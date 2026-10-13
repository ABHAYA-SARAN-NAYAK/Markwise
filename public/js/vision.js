/* StudentSphere - Vision Module (PRD Section 4.3 - 4.6, Section 7)
   - Local brightness check
   - Canvas image resize & compression (JPEG 0.85, max 1600px)
   - SHA-256 caching via crypto.subtle
   - 5-second cooldown and 60 reads/hour limit
   - Calls POST /api/read with 20s timeout
   - Readability calculation & fixed tip rules (never AI generated) */
(function (root) {
  'use strict';

  var memoryCache = {}; // sha256 -> parsed response
  var lastReadTimestamp = 0;

  // 1. Convert File or Blob or Video Frame to Resized Compressed Base64
  function processImageElement(imgOrVideo, maxWidth, quality) {
    maxWidth = maxWidth || 1600;
    quality = quality || 0.85;

    var origW = imgOrVideo.videoWidth || imgOrVideo.naturalWidth || imgOrVideo.width;
    var origH = imgOrVideo.videoHeight || imgOrVideo.naturalHeight || imgOrVideo.height;

    if (!origW || !origH) {
      return Promise.reject(new Error('Invalid image dimensions'));
    }

    // Minimum size check (PRD 7.2)
    if (origW < 600) {
      return Promise.resolve({
        ok: false,
        error: 'too_small',
        message: 'Too small. Move closer.'
      });
    }

    var scale = origW > maxWidth ? (maxWidth / origW) : 1;
    var targetW = Math.round(origW * scale);
    var targetH = Math.round(origH * scale);

    var canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(imgOrVideo, 0, 0, targetW, targetH);

    // Brightness Check (PRD 7.2)
    var imgData = ctx.getImageData(0, 0, targetW, targetH);
    var data = imgData.data;
    var sum = 0;
    var step = 4 * 16; // sample every 16th pixel for speed
    var samples = 0;
    for (var i = 0; i < data.length; i += step) {
      // Perceived luminance: 0.299*R + 0.587*G + 0.114*B
      sum += (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      samples++;
    }
    var avgBrightness = Math.round(sum / samples);

    if (avgBrightness < 70) {
      return Promise.resolve({
        ok: false,
        error: 'too_dark',
        message: 'Too dark. Move under a light.',
        brightness: avgBrightness
      });
    }
    if (avgBrightness > 235) {
      return Promise.resolve({
        ok: false,
        error: 'too_bright',
        message: 'Too much glare. Tilt the page a little.',
        brightness: avgBrightness
      });
    }

    var dataUrl = canvas.toDataURL('image/jpeg', quality);
    var base64 = dataUrl.split(',')[1];

    return Promise.resolve({
      ok: true,
      base64: base64,
      dataUrl: dataUrl,
      width: targetW,
      height: targetH,
      brightness: avgBrightness,
      mimeType: 'image/jpeg'
    });
  }

  // Load File to Image element
  function processImageFile(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !file.type.match(/^image\//i)) {
        return resolve({ ok: false, error: 'not_an_image', message: 'Please select an image file.' });
      }

      var reader = new FileReader();
      reader.onload = function (e) {
        var img = new Image();
        img.onload = function () {
          processImageElement(img, 1600, 0.85).then(resolve).catch(reject);
        };
        img.onerror = function () {
          resolve({ ok: false, error: 'corrupt_image', message: 'Could not load image.' });
        };
        img.src = e.target.result;
      };
      reader.onerror = function () {
        resolve({ ok: false, error: 'read_failed', message: 'Failed to read file.' });
      };
      reader.readAsDataURL(file);
    });
  }

  // SHA-256 computation via crypto.subtle (PRD 7.5)
  async function computeSha256(base64) {
    try {
      if (!window.crypto || !window.crypto.subtle) {
        return 'hash_' + base64.slice(0, 32) + base64.length;
      }
      var binary = atob(base64.slice(0, 8192)); // hash first 8KB chunk for fast unique signature
      var len = binary.length;
      var bytes = new Uint8Array(len);
      for (var i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      var hashBuffer = await window.crypto.subtle.digest('SHA-256', bytes);
      var hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    } catch (e) {
      return 'fallback_' + base64.slice(0, 32);
    }
  }

  // Check limits & cooldown (PRD 7.5)
  function checkRateLimits() {
    var now = Date.now();
    // 5-second cooldown
    if (now - lastReadTimestamp < 5000) {
      var waitSec = Math.ceil((5000 - (now - lastReadTimestamp)) / 1000);
      return { ok: false, message: 'Please wait ' + waitSec + 's before scanning another photo.' };
    }

    // Hourly limit (max 60 reads/hour)
    var counter = window.Store ? Store.getReadsCounter() : { hourStart: now, count: 0 };
    if (!counter.hourStart || (now - counter.hourStart) > 3600000) {
      counter = { hourStart: now, count: 0 };
    }
    if (counter.count >= 60) {
      return { ok: false, message: 'Reading limit reached (60/hour). Please use Type mode.' };
    }

    return { ok: true, counter: counter };
  }

  // Map photo problems to student messages (PRD 7.3)
  function getPhotoProblemMessage(problem) {
    var map = {
      'too_dark': 'Too dark. Move under a light.',
      'too_bright': 'Too much glare. Tilt the page a little.',
      'glare': 'Too much glare. Tilt the page a little.',
      'blurry': 'Blurry. Hold steady and let the camera focus.',
      'tilted': 'Page is tilted. Keep the page straight.',
      'shadow': 'A shadow covers the page. Move your hand or the lamp.',
      'cropped': 'Part of the page is cut off. Fit the whole answer in the frame.',
      'too_far': 'Too far. Move closer so the writing fills the frame.',
      'not_a_page': 'I cannot see an answer sheet.'
    };
    return map[problem] || 'Please keep the page flat and fill the frame.';
  }

  // Select up to 3 fixed handwriting tips based on writing object (PRD 7.4)
  function getHandwritingTips(writing) {
    if (!writing) return ['Your writing is easy to read. Keep it up.'];
    var tips = [];

    // Priority 1: confusable
    if (writing.confusable_characters && writing.confusable_characters.length) {
      tips.push('Look-alike characters spotted: ' + writing.confusable_characters.join(', ') + '. Write them clearly different (cross your 7, close your 0).');
    }
    // Priority 2: units
    if (writing.units_or_symbols_unclear) {
      tips.push('Write units and symbols clearly, right after the number.');
    }
    // Priority 3: spacing
    if (writing.word_spacing === 'tight' || writing.word_spacing === 'very_tight') {
      tips.push('Leave a clear gap between words. Crowded words get skipped by examiners.');
    }
    // Priority 4: line direction
    if (writing.line_direction === 'uphill' || writing.line_direction === 'downhill' || writing.line_direction === 'wavy') {
      tips.push('Your lines drift. Put a ruled sheet under your paper.');
    }
    // Priority 5: letter size
    if (writing.letter_size === 'small') {
      tips.push('Write a little bigger. Small letters are easy to misread.');
    }
    // Priority 6: overwriting
    if (writing.overwriting === 'some' || writing.overwriting === 'a_lot') {
      tips.push('Cut a wrong word with one neat line and rewrite it. Do not write over letters.');
    }

    if (!tips.length) {
      tips.push('Your writing is easy to read. Keep it up.');
    }

    return tips.slice(0, 3);
  }

  // Get Readability band label (PRD 4.6)
  function getReadabilityBand(score) {
    if (score >= 90) return { label: 'Clear', color: 'var(--ok)' };
    if (score >= 75) return { label: 'Mostly clear', color: 'var(--ok)' };
    if (score >= 55) return { label: 'Hard to read in places', color: 'var(--warn)' };
    return { label: 'An examiner may struggle', color: 'var(--bad)' };
  }

  // Main Call: Read Handwriting from Processed Image
  async function readHandwriting(processedImg, subject) {
    var limitCheck = checkRateLimits();
    if (!limitCheck.ok) {
      return { ok: false, error: 'rate_limited', message: limitCheck.message };
    }

    // SHA-256 cache check
    var hash = await computeSha256(processedImg.base64);
    if (memoryCache[hash]) {
      return { ok: true, cached: true, data: memoryCache[hash] };
    }

    // 20-second timeout controller (PRD 7.5)
    var controller = new AbortController();
    var timeoutId = setTimeout(function () { controller.abort(); }, 20000);

    try {
      var res = await fetch('/api/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          imageBase64: processedImg.base64,
          mimeType: processedImg.mimeType || 'image/jpeg',
          subject: subject || 'Science'
        })
      });
      clearTimeout(timeoutId);

      if (res.status === 503) {
        var errBody = await res.json().catch(function () { return {}; });
        if (errBody.error === 'no_key') {
          return {
            ok: false,
            error: 'no_key',
            message: 'Photo reading is offline. Use Type mode.'
          };
        }
      }

      if (!res.ok) {
        return {
          ok: false,
          error: 'server_error',
          message: 'Could not read the photo. Try again or type your answer.'
        };
      }

      var json = await res.json();
      lastReadTimestamp = Date.now();

      // Update counter
      if (limitCheck.counter && window.Store) {
        limitCheck.counter.count++;
        Store.setReadsCounter(limitCheck.counter);
      }

      // Store in memory cache
      memoryCache[hash] = json;

      return { ok: true, cached: false, data: json };
    } catch (e) {
      clearTimeout(timeoutId);
      var msg = e.name === 'AbortError'
        ? 'Reading timed out (20s). Try moving closer to the answer or type it.'
        : 'Could not read the photo. Try again or type your answer.';
      return { ok: false, error: 'request_failed', message: msg };
    }
  }

  var Vision = {
    processImageElement: processImageElement,
    processImageFile: processImageFile,
    computeSha256: computeSha256,
    checkRateLimits: checkRateLimits,
    getPhotoProblemMessage: getPhotoProblemMessage,
    getHandwritingTips: getHandwritingTips,
    getReadabilityBand: getReadabilityBand,
    readHandwriting: readHandwriting
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Vision;
  else root.Vision = Vision;
})(typeof window !== 'undefined' ? window : this);
