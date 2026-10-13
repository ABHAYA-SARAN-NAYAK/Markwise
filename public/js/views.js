/* StudentSphere - Views (PRD Sections 2, 4.1 to 4.6, 4.11, 7, 9)
   Dark glass UI, Uniform Blue #122837 + Palesun Yellow #FBFC09, Inter font, 18px base.
   Status always uses icon + word, never color alone. */
(function (root) {
  'use strict';

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Active camera stream tracker to stop tracks when leaving view
  var activeMediaStream = null;
  function stopActiveCamera() {
    if (activeMediaStream) {
      activeMediaStream.getTracks().forEach(function (t) { t.stop(); });
      activeMediaStream = null;
    }
  }

  var Views = {
    // ----------------- 1. HOME SCREEN (#/) -----------------
    renderHome: function (container, state) {
      stopActiveCamera();
      var nick = window.Store ? Store.getNick() : '';
      var subjects = ['Physics', 'Chemistry', 'Biology', 'Accountancy', 'Maths'];
      var cards = (state.keycards && state.keycards.cards) ? state.keycards.cards : [];

      var subjectStats = {};
      subjects.forEach(function (sub) {
        subjectStats[sub] = { count: 0, marks: 0 };
      });
      cards.forEach(function (c) {
        if (subjectStats[c.subject]) {
          subjectStats[c.subject].count++;
          subjectStats[c.subject].marks += c.marks;
        }
      });

      var subjectCardsHtml = subjects.map(function (sub) {
        var stat = subjectStats[sub] || { count: 0, marks: 0 };
        return `
          <a href="#/subject/${encodeURIComponent(sub)}" class="glass-card interactive" style="text-decoration:none;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px;">
              <h3 class="h3-title" style="margin:0;">${escapeHtml(sub)}</h3>
              <span class="chip chip-marks tabular-nums">${stat.marks} marks</span>
            </div>
            <p class="text-small" style="color:var(--muted);">${stat.count} questions available</p>
          </a>
        `;
      }).join('');

      container.innerHTML = `
        <div class="view-enter">
          <div style="margin-bottom:36px;">
            <h1 class="hero-title">Find where your marks leak.</h1>
            <p class="hero-sub">Write an answer. We check it with a board-style keyword key and tell you what to fix.</p>
            
            <div class="glass-card" style="max-width:540px; padding:22px; margin-bottom:32px;">
              <label for="nick-input" style="display:block; font-size:15px; font-weight:600; color:var(--muted); margin-bottom:10px;">
                Enter a nickname (no sign-up, no real name needed)
              </label>
              <input type="text" id="nick-input" placeholder="Your nickname, no real name needed" value="${escapeHtml(nick)}" maxlength="24" />
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:20px;">
            <h2 class="h2-title" style="margin:0;">Choose a Subject</h2>
            <span class="text-small">Class 12 · Tamil Nadu State Board</span>
          </div>

          <div class="grid-3" style="margin-bottom:44px;">
            ${subjectCardsHtml}
          </div>
        </div>
      `;

      var nickInput = document.getElementById('nick-input');
      if (nickInput) {
        nickInput.addEventListener('input', function (e) {
          if (window.Store) Store.setNick(e.target.value);
        });
      }
    },

    // ----------------- 2. SUBJECT LIST SCREEN (#/subject/:name) -----------------
    renderSubject: function (container, subjectName, state, activeMarksFilter) {
      stopActiveCamera();
      activeMarksFilter = activeMarksFilter || 'all';
      var allCards = (state.keycards && state.keycards.cards) ? state.keycards.cards : [];
      var subjectCards = allCards.filter(function (c) {
        return c.subject.toLowerCase() === subjectName.toLowerCase();
      });

      var filteredCards = subjectCards;
      if (activeMarksFilter !== 'all') {
        var targetMarks = parseInt(activeMarksFilter, 10);
        filteredCards = subjectCards.filter(function (c) { return c.marks === targetMarks; });
      }

      var filterChipsHtml = ['all', '2', '3', '4', '5'].map(function (m) {
        var label = m === 'all' ? 'All Marks' : m + ' Marks';
        var isActive = activeMarksFilter === m ? 'active' : '';
        return `<button class="filter-chip ${isActive}" data-mark="${m}">${label}</button>`;
      }).join(' ');

      var questionCardsHtml = filteredCards.map(function (card) {
        var badgeHtml = card.verified
          ? `<span class="chip chip-verified">✔ Verified by ${escapeHtml(card.verifiedBy || 'Teacher')}</span>`
          : `<span class="chip chip-draft">Draft key</span>`;

        return `
          <a href="#/q/${encodeURIComponent(card.id)}" class="question-card">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-weight:800; font-size:16px; color:var(--accent);">${escapeHtml(card.id)}</span>
                <span class="chip chip-marks tabular-nums">${card.marks} marks</span>
                <span class="chip chip-part">${escapeHtml(card.part || card.type)}</span>
              </div>
              <div>${badgeHtml}</div>
            </div>
            <h3 class="h3-title" style="margin-bottom:6px; font-size:20px;">${escapeHtml(card.topic)}</h3>
            <p class="text-small" style="color:var(--muted); margin-bottom:10px;">Chapter: ${escapeHtml(card.chapter)}</p>
            <p style="font-size:17px; color:var(--text); line-height:1.45;">${escapeHtml(card.question)}</p>
          </a>
        `;
      }).join('');

      if (!filteredCards.length) {
        questionCardsHtml = `
          <div class="glass-card" style="text-align:center; padding:36px;">
            <p class="text-muted">No questions found matching ${activeMarksFilter} marks in ${escapeHtml(subjectName)}.</p>
          </div>
        `;
      }

      container.innerHTML = `
        <div class="view-enter">
          <div style="margin-bottom:24px;">
            <a href="#/" class="btn btn-secondary btn-sm" style="margin-bottom:16px;">← All Subjects</a>
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
              <div>
                <h1 class="hero-title" style="font-size:40px; margin-bottom:6px;">${escapeHtml(subjectName)}</h1>
                <p class="text-muted">${subjectCards.length} questions available · Pick one to check your answer</p>
              </div>
              <div style="display:flex; gap:8px; flex-wrap:wrap;" id="filter-chips-container">
                ${filterChipsHtml}
              </div>
            </div>
          </div>

          <div style="margin-top:24px;">
            ${questionCardsHtml}
          </div>
        </div>
      `;

      var filterContainer = document.getElementById('filter-chips-container');
      if (filterContainer) {
        filterContainer.addEventListener('click', function (e) {
          var btn = e.target.closest('button[data-mark]');
          if (btn) {
            var markVal = btn.getAttribute('data-mark');
            Views.renderSubject(container, subjectName, state, markVal);
          }
        });
      }
    },

    // ----------------- 3. ANSWER SCREEN (#/q/:id) -----------------
    renderQuestion: function (container, cardId, state) {
      stopActiveCamera();
      var allCards = (state.keycards && state.keycards.cards) ? state.keycards.cards : [];
      var card = allCards.find(function (c) { return c.id === cardId; });

      if (!card) {
        Views.renderPlaceholder(container, 'Question Not Found', 'Could not locate question ID: ' + escapeHtml(cardId));
        return;
      }

      var badgeHtml = card.verified
        ? `<span class="chip chip-verified">✔ Verified by ${escapeHtml(card.verifiedBy || 'Teacher')}</span>`
        : `<span class="chip chip-draft">Draft key</span>`;

      var currentProcessedImage = null; // store current selected photo for read call

      container.innerHTML = `
        <div class="view-enter">
          <div style="margin-bottom:20px;">
            <a href="#/subject/${encodeURIComponent(card.subject)}" class="btn btn-secondary btn-sm">← Back to ${escapeHtml(card.subject)}</a>
          </div>

          <div class="grid-2" style="align-items:start;">
            <!-- Left Column: Question Details -->
            <div>
              <div class="glass-card" style="margin-bottom:20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <span style="font-weight:800; font-size:18px; color:var(--accent);">${escapeHtml(card.id)}</span>
                    <span class="chip chip-marks tabular-nums">${card.marks} marks</span>
                    <span class="chip chip-part">${escapeHtml(card.part)}</span>
                  </div>
                  <div>${badgeHtml}</div>
                </div>

                <h2 class="h2-title" style="font-size:24px; margin-bottom:8px;">${escapeHtml(card.topic)}</h2>
                <p class="text-small" style="color:var(--muted); margin-bottom:18px;">${escapeHtml(card.chapter)} · ${escapeHtml(card.board)} (Class ${card.class})</p>

                <div style="background:rgba(10, 24, 34, 0.6); border:1px solid var(--stroke); border-radius:14px; padding:20px; margin-bottom:20px;">
                  <p style="font-size:20px; font-weight:600; line-height:1.45; color:#FFFFFF;">${escapeHtml(card.question)}</p>
                </div>

                <div style="background:rgba(59, 130, 246, 0.1); border:1px solid rgba(59, 130, 246, 0.25); border-radius:12px; padding:14px 18px; margin-bottom:14px;">
                  <div style="font-weight:700; font-size:15px; color:#93C5FD; margin-bottom:4px;">💡 Valuator Exam Tip</div>
                  <div style="font-size:15px; color:var(--text);">Write like an exam: formula → steps → unit → final answer.</div>
                </div>

                <div style="background:rgba(255, 255, 255, 0.04); border:1px solid var(--stroke); border-radius:12px; padding:14px 18px;">
                  <div style="font-weight:700; font-size:15px; color:var(--muted); margin-bottom:4px;">✍️ Handwriting Tip</div>
                  <div style="font-size:15px; color:var(--text);">Write with a dark pen on white paper. Keep the page flat and fill the camera frame.</div>
                </div>
              </div>
            </div>

            <!-- Right Column: Answer Tabs & Input -->
            <div>
              <div class="glass-card">
                <!-- Mode Tabs -->
                <div class="tab-group" id="mode-tabs">
                  <button class="tab-btn active" data-tab="type">⌨️ Type</button>
                  <button class="tab-btn" data-tab="photo">📷 Photo</button>
                  <button class="tab-btn" data-tab="camera">📹 Camera</button>
                </div>

                <!-- Tab 1: Type -->
                <div id="tab-content-type">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <label for="answer-text" style="font-size:15px; font-weight:600; color:var(--muted);">Your written answer</label>
                    <span id="live-word-count" class="text-small tabular-nums">0 words</span>
                  </div>

                  <textarea id="answer-text" placeholder="Type your answer here exactly as you would write on your exam paper..."></textarea>

                  <div style="margin-top:20px;">
                    <button id="btn-check-answer" class="btn btn-primary" style="width:100%;">Check my answer →</button>
                  </div>
                </div>

                <!-- Tab 2: Photo Upload -->
                <div id="tab-content-photo" style="display:none;">
                  <div class="drop-zone" id="photo-drop-zone">
                    <input type="file" id="photo-file-input" accept="image/*" style="display:none;" />
                    <div style="font-size:36px; margin-bottom:8px;">📄</div>
                    <strong style="color:#FFFFFF; font-size:17px; display:block; margin-bottom:4px;">Drop your answer sheet photo here</strong>
                    <span class="text-small" style="color:var(--muted);">or click to browse from device (JPG/PNG)</span>
                  </div>

                  <div style="margin-top:12px; text-align:center;">
                    <button type="button" id="btn-try-sample" class="btn btn-secondary btn-sm" style="font-size:14px; width:100%;">
                      ⚡ Try a sample (Offline Demo)
                    </button>
                  </div>

                  <div id="photo-preview-container" style="display:none; margin-top:16px;">
                    <div class="photo-preview-wrap">
                      <img id="photo-preview-img" src="" alt="Answer preview" />
                    </div>
                    <div id="photo-brightness-feedback" style="margin-bottom:12px;"></div>
                    <div style="display:flex; gap:10px;">
                      <button id="btn-read-photo" class="btn btn-primary" style="flex:1;">Read Handwriting →</button>
                      <button id="btn-change-photo" class="btn btn-secondary btn-sm">Change photo</button>
                    </div>
                  </div>

                  <div style="margin-top:20px; font-size:13px; color:var(--muted); text-align:center; line-height:1.4;">
                    🔒 Privacy notice: Your photo is sent to an online AI service only to read the words. This app does not save it. Do not write your name or school.
                  </div>
                </div>

                <!-- Tab 3: Camera Live -->
                <div id="tab-content-camera" style="display:none;">
                  <div id="camera-stream-container">
                    <div class="camera-stream-wrap">
                      <video id="camera-video" class="camera-video" autoplay playsinline muted></video>
                      <div class="camera-overlay-frame">
                        <span class="camera-overlay-text">Fit answer inside frame</span>
                      </div>
                    </div>
                    <div id="camera-error-msg" style="display:none; color:var(--bad); font-size:15px; margin-top:8px;"></div>
                    <div style="margin-top:16px;">
                      <button id="btn-snap-photo" class="btn btn-primary" style="width:100%;">📸 Take photo</button>
                    </div>
                  </div>

                  <div id="camera-preview-container" style="display:none; margin-top:16px;">
                    <div class="photo-preview-wrap">
                      <img id="camera-preview-img" src="" alt="Captured answer" />
                    </div>
                    <div id="camera-brightness-feedback" style="margin-bottom:12px;"></div>
                    <div style="display:flex; gap:10px;">
                      <button id="btn-read-camera-photo" class="btn btn-primary" style="flex:1;">Read Handwriting →</button>
                      <button id="btn-retake-camera" class="btn btn-secondary btn-sm">Retake</button>
                    </div>
                  </div>

                  <div style="margin-top:20px; font-size:13px; color:var(--muted); text-align:center; line-height:1.4;">
                    🔒 Privacy notice: Your photo is sent to an online AI service only to read the words. This app does not save it. Do not write your name or school.
                  </div>
                </div>

                <!-- Reading Loading Shimmer -->
                <div id="reading-shimmer-state" style="display:none; text-align:center; padding:48px 16px;">
                  <div class="score-ring-wrap" style="width:100px; height:100px; margin-bottom:16px;">
                    <svg viewBox="0 0 100 100" style="animation: spin 1.5s linear infinite;">
                      <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.1)" stroke-width="8" fill="none" />
                      <circle cx="50" cy="50" r="40" stroke="var(--accent)" stroke-width="8" stroke-dasharray="80 170" fill="none" stroke-linecap="round" />
                    </svg>
                  </div>
                  <h3 class="h3-title" style="margin-bottom:8px;">Reading your handwriting…</h3>
                  <p class="text-muted" style="font-size:15px; max-width:400px; margin:0 auto 20px;">
                    Classifying letter strokes, numbers, and symbols. This takes 4–10 seconds.
                  </p>
                  <button id="btn-cancel-read" class="btn btn-secondary btn-sm">Cancel & Type instead</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      // Event Handlers for Elements
      var textarea = document.getElementById('answer-text');
      var wordCountEl = document.getElementById('live-word-count');
      var checkBtn = document.getElementById('btn-check-answer');
      var modeTabs = document.getElementById('mode-tabs');
      var tabType = document.getElementById('tab-content-type');
      var tabPhoto = document.getElementById('tab-content-photo');
      var tabCamera = document.getElementById('tab-content-camera');
      var shimmerState = document.getElementById('reading-shimmer-state');

      // Live word count
      if (textarea && wordCountEl) {
        textarea.addEventListener('input', function () {
          var words = textarea.value.trim().split(/\s+/).filter(Boolean).length;
          wordCountEl.textContent = words + (words === 1 ? ' word' : ' words');
        });
      }

      // Check Type Answer
      if (checkBtn && textarea) {
        checkBtn.addEventListener('click', function () {
          var text = textarea.value.trim();
          if (!text) {
            textarea.focus();
            return;
          }

          var evalCard = window.Store ? Store.applyOverridesToCard(card) : card;
          var result = window.Engine.evaluate(evalCard, text);
          var firstAttempt = Store.getFirstAttemptForCardInSession(card.id);
          var attemptNum = Store.getSessionAttemptsForCard(card.id).length + 1;

          var attemptRecord = {
            id: 'a_' + Date.now(),
            ts: Date.now(),
            nick: Store.getNick() || 'Student',
            cardId: card.id,
            subject: card.subject,
            mode: 'type',
            score: result.total,
            max: card.marks,
            readability: 100,
            illegible: 0,
            missing: result.leaks.map(function (l) { return l.id; }),
            spelling: result.spellingFlags.map(function (s) { return s.wrote; }),
            edited: false,
            traps: result.traps.length
          };
          Store.saveAttempt(attemptRecord);

          state.currentEvaluation = {
            card: card,
            evalResult: result,
            studentText: text,
            firstAttempt: firstAttempt,
            attemptNum: attemptNum,
            handwriting: null
          };

          window.location.hash = '#/result';
        });
      }

      // Mode Tabs Switch
      if (modeTabs) {
        modeTabs.addEventListener('click', function (e) {
          var btn = e.target.closest('button[data-tab]');
          if (!btn) return;
          var tab = btn.getAttribute('data-tab');

          modeTabs.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');

          tabType.style.display = tab === 'type' ? 'block' : 'none';
          tabPhoto.style.display = tab === 'photo' ? 'block' : 'none';
          tabCamera.style.display = tab === 'camera' ? 'block' : 'none';

          if (tab === 'camera') {
            startCamera();
          } else {
            stopActiveCamera();
          }
        });
      }

      // Photo Tab Logic
      var dropZone = document.getElementById('photo-drop-zone');
      var fileInput = document.getElementById('photo-file-input');
      var photoPreviewBox = document.getElementById('photo-preview-container');
      var photoPreviewImg = document.getElementById('photo-preview-img');
      var photoBrightnessBox = document.getElementById('photo-brightness-feedback');
      var readPhotoBtn = document.getElementById('btn-read-photo');
      var changePhotoBtn = document.getElementById('btn-change-photo');

      if (dropZone && fileInput) {
        dropZone.addEventListener('click', function () { fileInput.click(); });
        dropZone.addEventListener('dragover', function (e) { e.preventDefault(); dropZone.classList.add('dragover'); });
        dropZone.addEventListener('dragleave', function () { dropZone.classList.remove('dragover'); });
        dropZone.addEventListener('drop', function (e) {
          e.preventDefault();
          dropZone.classList.remove('dragover');
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleSelectedPhoto(e.dataTransfer.files[0]);
          }
        });
        fileInput.addEventListener('change', function () {
          if (fileInput.files && fileInput.files[0]) {
            handleSelectedPhoto(fileInput.files[0]);
          }
        });
      }

      if (changePhotoBtn) {
        changePhotoBtn.addEventListener('click', function () {
          photoPreviewBox.style.display = 'none';
          dropZone.style.display = 'block';
          currentProcessedImage = null;
        });
      }

      var trySampleBtn = document.getElementById('btn-try-sample');
      if (trySampleBtn) {
        trySampleBtn.addEventListener('click', function () {
          fetch('demo/reads.json')
            .then(function (r) { return r.json(); })
            .then(function (demoData) {
              var samples = demoData.samples || [];
              var matched = samples.find(function (s) { return s.cardId === card.id; }) || samples[0];
              if (!matched) return;

              state.currentRead = {
                card: card,
                processedImg: {
                  dataUrl: matched.dataUrl,
                  base64: '',
                  width: 800,
                  height: 400,
                  brightness: 180,
                  mimeType: 'image/jpeg'
                },
                readResult: matched.readResult,
                mode: 'photo'
              };
              window.location.hash = '#/read';
            })
            .catch(function (err) {
              alert('Could not load sample demo data: ' + err.message);
            });
        });
      }

      function handleSelectedPhoto(file) {
        dropZone.style.display = 'none';
        photoPreviewBox.style.display = 'block';
        photoBrightnessBox.innerHTML = '<span class="text-small text-muted">Checking image lighting…</span>';

        Vision.processImageFile(file).then(function (res) {
          if (!res.ok) {
            photoBrightnessBox.innerHTML = `
              <div style="background:rgba(255,92,108,0.15); border:1px solid var(--bad); border-radius:8px; padding:10px 14px; font-size:15px; color:#FFFFFF;">
                ⚠️ ${escapeHtml(res.message)}
              </div>
            `;
            readPhotoBtn.disabled = true;
            return;
          }

          currentProcessedImage = res;
          photoPreviewImg.src = res.dataUrl;
          readPhotoBtn.disabled = false;
          photoBrightnessBox.innerHTML = `
            <div style="background:rgba(124,252,79,0.12); border:1px solid var(--ok); border-radius:8px; padding:8px 12px; font-size:14px; color:var(--ok);">
              ✔ Lighting check passed (Brightness: ${res.brightness}/255). Ready to read.
            </div>
          `;
        });
      }

      // Camera Tab Logic
      var videoEl = document.getElementById('camera-video');
      var snapBtn = document.getElementById('btn-snap-photo');
      var cameraStreamBox = document.getElementById('camera-stream-container');
      var cameraPreviewBox = document.getElementById('camera-preview-container');
      var cameraPreviewImg = document.getElementById('camera-preview-img');
      var cameraBrightnessBox = document.getElementById('camera-brightness-feedback');
      var retakeCamBtn = document.getElementById('btn-retake-camera');
      var readCamBtn = document.getElementById('btn-read-camera-photo');
      var cameraErrEl = document.getElementById('camera-error-msg');

      function startCamera() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          cameraErrEl.style.display = 'block';
          cameraErrEl.textContent = 'Camera API not supported in this browser. Please use Photo upload or Type mode.';
          return;
        }
        navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
        }).then(function (stream) {
          activeMediaStream = stream;
          videoEl.srcObject = stream;
          cameraErrEl.style.display = 'none';
        }).catch(function (err) {
          navigator.mediaDevices.getUserMedia({ video: true }).then(function (stream) {
            activeMediaStream = stream;
            videoEl.srcObject = stream;
            cameraErrEl.style.display = 'none';
          }).catch(function () {
            cameraErrEl.style.display = 'block';
            cameraErrEl.textContent = 'Camera permission was denied or no camera device found. Please use Photo upload or Type mode.';
          });
        });
      }

      if (snapBtn && videoEl) {
        snapBtn.addEventListener('click', function () {
          Vision.processImageElement(videoEl, 1600, 0.85).then(function (res) {
            stopActiveCamera();
            cameraStreamBox.style.display = 'none';
            cameraPreviewBox.style.display = 'block';

            if (!res.ok) {
              cameraBrightnessBox.innerHTML = `
                <div style="background:rgba(255,92,108,0.15); border:1px solid var(--bad); border-radius:8px; padding:10px 14px; font-size:15px; color:#FFFFFF;">
                  ⚠️ ${escapeHtml(res.message)}
                </div>
              `;
              readCamBtn.disabled = true;
              return;
            }

            currentProcessedImage = res;
            cameraPreviewImg.src = res.dataUrl;
            readCamBtn.disabled = false;
            cameraBrightnessBox.innerHTML = `
              <div style="background:rgba(124,252,79,0.12); border:1px solid var(--ok); border-radius:8px; padding:8px 12px; font-size:14px; color:var(--ok);">
                ✔ Lighting check passed (Brightness: ${res.brightness}/255). Ready to read.
              </div>
            `;
          });
        });
      }

      if (retakeCamBtn) {
        retakeCamBtn.addEventListener('click', function () {
          cameraPreviewBox.style.display = 'none';
          cameraStreamBox.style.display = 'block';
          currentProcessedImage = null;
          startCamera();
        });
      }

      // Execute handwriting read (Photo or Camera)
      function executeRead(mode) {
        if (!currentProcessedImage) return;

        tabType.style.display = 'none';
        tabPhoto.style.display = 'none';
        tabCamera.style.display = 'none';
        modeTabs.style.display = 'none';
        shimmerState.style.display = 'block';

        Vision.readHandwriting(currentProcessedImage, card.subject).then(function (resp) {
          shimmerState.style.display = 'none';
          modeTabs.style.display = 'flex';

          if (!resp.ok) {
            // Friendly error handling (PRD 7.5)
            var targetTab = mode === 'camera' ? tabCamera : tabPhoto;
            targetTab.style.display = 'block';
            var errorBox = mode === 'camera' ? cameraBrightnessBox : photoBrightnessBox;
            errorBox.innerHTML = `
              <div style="background:rgba(255,92,108,0.16); border:1px solid var(--bad); border-radius:10px; padding:14px; margin-bottom:12px; font-size:15px; color:#FFFFFF;">
                <div style="font-weight:700; margin-bottom:4px;">⚠️ Reading Failed</div>
                <div>${escapeHtml(resp.message)}</div>
                <div style="margin-top:10px;">
                  <button id="btn-fallback-type" class="btn btn-secondary btn-sm">Type your answer instead</button>
                </div>
              </div>
            `;
            var fallbackBtn = document.getElementById('btn-fallback-type');
            if (fallbackBtn) {
              fallbackBtn.addEventListener('click', function () {
                var typeTabBtn = modeTabs.querySelector('button[data-tab="type"]');
                if (typeTabBtn) typeTabBtn.click();
              });
            }
            return;
          }

          // Successfully read handwriting response!
          state.currentRead = {
            card: card,
            processedImg: currentProcessedImage,
            readResult: resp.data,
            mode: mode
          };

          window.location.hash = '#/read';
        });
      }

      if (readPhotoBtn) {
        readPhotoBtn.addEventListener('click', function () { executeRead('photo'); });
      }
      if (readCamBtn) {
        readCamBtn.addEventListener('click', function () { executeRead('camera'); });
      }

      var cancelReadBtn = document.getElementById('btn-cancel-read');
      if (cancelReadBtn) {
        cancelReadBtn.addEventListener('click', function () {
          shimmerState.style.display = 'none';
          modeTabs.style.display = 'flex';
          var typeTabBtn = modeTabs.querySelector('button[data-tab="type"]');
          if (typeTabBtn) typeTabBtn.click();
        });
      }
    },

    // ----------------- 4. READING SCREEN (#/read) -----------------
    renderRead: function (container, state) {
      stopActiveCamera();
      if (!state.currentRead) {
        Views.renderPlaceholder(container, 'No Image to Review', 'Please select a question and capture or upload an answer sheet first.');
        return;
      }

      var readData = state.currentRead;
      var card = readData.card;
      var img = readData.processedImg;
      var res = readData.readResult;
      var mode = readData.mode;

      // Case 1: Photo quality failed (photo_ok === false)
      if (res.photo_ok === false) {
        var problems = (res.photo_problems && res.photo_problems.length) ? res.photo_problems : ['too_far'];
        var problemMsgs = problems.map(function (p) {
          return `<li style="margin-bottom:6px;">${escapeHtml(Vision.getPhotoProblemMessage(p))}</li>`;
        }).join('');

        container.innerHTML = `
          <div class="view-enter">
            <div style="margin-bottom:20px;">
              <a href="#/q/${encodeURIComponent(card.id)}" class="btn btn-secondary btn-sm">← Back to Question</a>
            </div>

            <div class="glass-card" style="max-width:780px; margin:0 auto; padding:32px;">
              <div style="text-align:center; margin-bottom:24px;">
                <span style="font-size:48px;">⚠️</span>
                <h2 class="h2-title" style="margin-top:10px; color:var(--bad);">Could not read this photo clearly</h2>
                <p class="text-muted">The reading service could not distinguish the answer lines on this page.</p>
              </div>

              <div class="grid-2" style="align-items:center; margin-bottom:28px;">
                <div class="photo-preview-wrap" style="max-height:260px;">
                  <img src="${img.dataUrl}" alt="Photo attempt" />
                </div>
                <div style="background:rgba(255,92,108,0.1); border:1px solid rgba(255,92,108,0.3); border-radius:14px; padding:20px;">
                  <div style="font-weight:700; font-size:16px; color:#FFCCD1; margin-bottom:8px;">Suggested Adjustments:</div>
                  <ul style="padding-left:20px; font-size:15px; color:var(--text);">
                    ${problemMsgs}
                  </ul>
                </div>
              </div>

              <div style="display:flex; justify-content:center; gap:16px; flex-wrap:wrap;">
                <a href="#/q/${encodeURIComponent(card.id)}" class="btn btn-primary">Retake photo ↺</a>
                <a href="#/q/${encodeURIComponent(card.id)}" class="btn btn-secondary">Type answer instead ⌨️</a>
              </div>
            </div>
          </div>
        `;
        return;
      }

      // Case 2: Photo reading succeeded (photo_ok === true)
      var rawTranscript = res.transcript || '';
      var prep = window.Engine.prepareTranscript(rawTranscript);
      var illegibleCount = prep.illegible;

      container.innerHTML = `
        <div class="view-enter">
          <div style="margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
            <a href="#/q/${encodeURIComponent(card.id)}" class="btn btn-secondary btn-sm">← Back to Question</a>
            <span class="chip chip-marks">${escapeHtml(card.id)}: ${card.marks} marks</span>
          </div>

          <div class="glass-card" style="margin-bottom:24px; padding:18px 24px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <span style="font-size:24px;">🔍</span>
              <div>
                <strong style="color:var(--accent); font-size:17px;">Check the text. Fix any wrong word. Then press Check.</strong>
                <p class="text-small" style="color:var(--muted); margin:0;">
                  If the reader misread a handwritten word, edit it below to protect your fair mark.
                </p>
              </div>
            </div>
          </div>

          <div class="grid-2" style="align-items:start; margin-bottom:28px;">
            <!-- Left: Captured Photo -->
            <div>
              <div class="glass-card">
                <h3 class="h3-title" style="font-size:18px; margin-bottom:12px;">Your Answer Sheet Photo</h3>
                <div class="photo-preview-wrap" style="max-height:480px;">
                  <img src="${img.dataUrl}" alt="Answer sheet" style="max-height:480px;" />
                </div>
                ${illegibleCount > 0 ? `
                  <div style="margin-top:12px; font-size:14px; color:var(--warn); background:rgba(255,176,32,0.12); padding:8px 12px; border-radius:8px;">
                    ⚠️ ${illegibleCount} unreadable word(s) marked as <span class="chip-unreadable">[?]</span>. You can replace them with your actual words.
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Right: Editable Transcript -->
            <div>
              <div class="glass-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                  <h3 class="h3-title" style="font-size:18px; margin:0;">Transcribed Text (Editable)</h3>
                  <span id="transcript-edited-badge" class="chip chip-part" style="display:none;">Text edited by you</span>
                </div>

                <textarea id="transcript-textarea" style="min-height:360px; font-size:18px; line-height:1.6; font-family:inherit;">${escapeHtml(rawTranscript)}</textarea>

                <div style="margin-top:20px;">
                  <button id="btn-confirm-transcript" class="btn btn-primary" style="width:100%;">Check my answer →</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      var transcriptEl = document.getElementById('transcript-textarea');
      var editedBadge = document.getElementById('transcript-edited-badge');
      var confirmBtn = document.getElementById('btn-confirm-transcript');
      var hasEdited = false;

      if (transcriptEl && editedBadge) {
        transcriptEl.addEventListener('input', function () {
          if (transcriptEl.value !== rawTranscript) {
            hasEdited = true;
            editedBadge.style.display = 'inline-flex';
          }
        });
      }

      if (confirmBtn && transcriptEl) {
        confirmBtn.addEventListener('click', function () {
          var finalAnswer = transcriptEl.value.trim();
          if (!finalAnswer) {
            transcriptEl.focus();
            return;
          }

          // Evaluate with Engine (including runtime overrides)
          var evalCard = window.Store ? Store.applyOverridesToCard(card) : card;
          var result = window.Engine.evaluate(evalCard, finalAnswer);

          // Original readability from raw transcript (PRD 4.6)
          var origTranscriptMetrics = window.Engine.prepareTranscript(rawTranscript);
          var readabilityScore = origTranscriptMetrics.readability;
          var illegibleCountFinal = origTranscriptMetrics.illegible;

          var firstAttempt = Store.getFirstAttemptForCardInSession(card.id);
          var attemptNum = Store.getSessionAttemptsForCard(card.id).length + 1;

          var attemptRecord = {
            id: 'a_' + Date.now(),
            ts: Date.now(),
            nick: Store.getNick() || 'Student',
            cardId: card.id,
            subject: card.subject,
            mode: mode,
            score: result.total,
            max: card.marks,
            readability: readabilityScore,
            illegible: illegibleCountFinal,
            missing: result.leaks.map(function (l) { return l.id; }),
            spelling: result.spellingFlags.map(function (s) { return s.wrote; }),
            edited: hasEdited,
            traps: result.traps.length
          };
          Store.saveAttempt(attemptRecord);

          state.currentEvaluation = {
            card: card,
            evalResult: result,
            studentText: finalAnswer,
            firstAttempt: firstAttempt,
            attemptNum: attemptNum,
            handwriting: {
              rawTranscript: rawTranscript,
              readability: readabilityScore,
              illegible: illegibleCountFinal,
              writing: res.writing || {},
              edited: hasEdited
            }
          };

          window.location.hash = '#/result';
        });
      }
    },

    // ----------------- 5. MARK LEAK REPORT SCREEN (#/result) -----------------
    renderResult: function (container, state) {
      stopActiveCamera();
      if (!state.currentEvaluation) {
        Views.renderPlaceholder(container, 'No Evaluation Result', 'Please select a question and check an answer first.');
        return;
      }

      var data = state.currentEvaluation;
      var card = data.card;
      var out = data.evalResult;
      var text = data.studentText;
      var firstAttempt = data.firstAttempt;
      var hw = data.handwriting;

      var badgeHtml = card.verified
        ? `<span class="chip chip-verified">✔ Verified by ${escapeHtml(card.verifiedBy || 'Teacher')}</span>`
        : `<span class="chip chip-draft">Draft key</span>`;

      // Retry Banner
      var retryBannerHtml = '';
      if (firstAttempt && data.attemptNum > 1) {
        var diff = +(out.total - firstAttempt.score).toFixed(1);
        var sign = diff > 0 ? '+' : '';
        if (diff > 0) {
          retryBannerHtml = `
            <div class="retry-improvement-banner">
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:24px;">🚀</span>
                <div>
                  <strong style="color:var(--ok); font-size:18px;">${sign}${diff} marks vs your first try!</strong>
                  <div class="text-small" style="color:var(--muted);">Previous: ${firstAttempt.score}/${card.marks} → Now: ${out.total}/${card.marks}</div>
                </div>
              </div>
              <span class="chip chip-marks">Attempt #${data.attemptNum}</span>
            </div>
          `;
        } else if (diff === 0) {
          retryBannerHtml = `
            <div class="retry-improvement-banner" style="background:rgba(255,255,255,0.06); border-color:var(--stroke);">
              <div>Same score (${out.total}/${card.marks}) as your first attempt. Check the leaks below to gain the remaining marks!</div>
              <span class="chip chip-part">Attempt #${data.attemptNum}</span>
            </div>
          `;
        }
      }

      // Where Marks Leaked List
      var leaksHtml = '';
      if (out.leaks && out.leaks.length > 0) {
        leaksHtml = out.leaks.map(function (leak) {
          var hintText = leak.hints && leak.hints.length
            ? `<div class="leak-hint">Look for: ${escapeHtml(leak.hints.join(', '))}</div>`
            : '';
          var tipText = leak.tip ? `<div class="leak-tip">💡 Tip: ${escapeHtml(leak.tip)}</div>` : '';

          return `
            <div class="leak-item">
              <div class="leak-lost-badge tabular-nums">−${leak.lost}</div>
              <div class="leak-content">
                <div class="leak-title">${escapeHtml(leak.label)}</div>
                ${hintText}
                ${tipText}
              </div>
            </div>
          `;
        }).join('');
      } else {
        leaksHtml = `
          <div style="background:rgba(124, 252, 79, 0.1); border:1px solid rgba(124, 252, 79, 0.3); border-radius:14px; padding:20px; text-align:center;">
            <div style="font-size:28px; margin-bottom:6px;">🎉</div>
            <strong style="color:var(--ok); font-size:18px;">No Marks Leaked!</strong>
            <p class="text-small" style="color:var(--text); margin-top:4px;">Full marks earned! Every expected keyword and step was found.</p>
          </div>
        `;
      }

      // Handwriting Card (PRD Section 4.6)
      var handwritingCardHtml = '';
      if (hw) {
        var band = Vision.getReadabilityBand(hw.readability);
        var tips = Vision.getHandwritingTips(hw.writing);

        var tipsListHtml = tips.map(function (tip) {
          return `
            <div class="tip-item">
              <span style="color:var(--accent); font-size:16px;">✦</span>
              <span>${escapeHtml(tip)}</span>
            </div>
          `;
        }).join('');

        var cautionNotice = (hw.illegible > 0 && out.leaks.length > 0)
          ? `<div style="background:rgba(255,176,32,0.12); border:1px solid var(--warn); border-radius:10px; padding:10px 14px; font-size:14px; color:#FFE4B5; margin-top:14px;">
              ⚠️ Some lost marks may be because words were hard to read. Fix the text and check again.
            </div>`
          : '';

        handwritingCardHtml = `
          <div class="handwriting-card">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
              <div>
                <h3 class="h3-title" style="margin:0; font-size:22px;">Handwriting Feedback</h3>
                <span class="text-small" style="color:var(--muted);">Evaluated on original photo submission</span>
              </div>
              <div style="display:flex; align-items:center; gap:8px;">
                ${hw.edited ? '<span class="chip chip-part">Text edited by you</span>' : ''}
                <span class="chip" style="background:rgba(255,255,255,0.08); color:${band.color}; border:1px solid ${band.color}; font-weight:700;">
                  ${band.label} (${hw.readability}%)
                </span>
              </div>
            </div>

            <!-- Readability Meter -->
            <div class="meter-track">
              <div class="meter-fill" style="width:${hw.readability}%; background:${band.color};"></div>
            </div>
            <p style="font-size:14px; color:var(--muted); margin-bottom:18px;">
              Readability is the share of words the reader could confidently read. It is an estimate, not a mark.
            </p>

            <!-- Fixed Tips -->
            <div style="margin-top:16px;">
              <div style="font-size:15px; font-weight:700; color:#FFFFFF; margin-bottom:8px;">Handwriting Tips for Board Valuators:</div>
              ${tipsListHtml}
            </div>

            ${cautionNotice}

            <p style="font-size:13px; color:var(--muted); font-style:italic; margin-top:14px;">
              These are observations by the reading service. A teacher's eye is the final judge.
            </p>
          </div>
        `;
      }

      // Traps & Warnings
      var trapsHtml = (out.traps || []).map(function (trap) {
        return `
          <div class="trap-box">
            <span style="font-size:24px;">⚠️</span>
            <div>
              <strong style="color:var(--bad); font-size:16px;">Trap Spotted</strong>
              <div style="color:var(--text); margin-top:4px;">${escapeHtml(trap)}</div>
            </div>
          </div>
        `;
      }).join('');

      var warningsHtml = (out.warnings || []).map(function (warn) {
        return `
          <div class="warning-box">
            <span style="font-size:20px;">⚠️</span>
            <div style="color:var(--text); font-size:16px;">${escapeHtml(warn)}</div>
          </div>
        `;
      }).join('');

      // Key Checklist
      var checklistHtml = out.items.map(function (item) {
        var statusBadge = '';
        var statusClass = '';
        if (item.status === 'found') {
          statusBadge = '<span class="status-tag status-found">✔ Found</span>';
          statusClass = 'status-is-found';
        } else if (item.status === 'spelling') {
          statusBadge = '<span class="status-tag status-spelling">✔ Spelling</span>';
          statusClass = 'status-is-spelling';
        } else if (item.status === 'partial') {
          statusBadge = '<span class="status-tag status-partial">◐ Partial</span>';
          statusClass = 'status-is-partial';
        } else {
          statusBadge = '<span class="status-tag status-missing">✖ Missing</span>';
          statusClass = 'status-is-missing';
        }

        var keysHtml = (item.keys || []).map(function (k) {
          return `<span class="key-chip">${escapeHtml(k)}</span>`;
        }).join('');

        var tipHtml = (item.status !== 'found' && item.tip)
          ? `<div style="font-size:14px; color:#FFCCD1; margin-top:6px;">Tip: ${escapeHtml(item.tip)}</div>`
          : '';

        var hintHtml = (item.status !== 'found' && item.missingHints && item.missingHints.length)
          ? `<div style="font-size:14px; color:var(--muted); margin-top:4px;">Look for: ${escapeHtml(item.missingHints.join(', '))}</div>`
          : '';

        return `
          <div class="check-item ${statusClass}">
            <div class="check-header">
              <span class="check-label">${escapeHtml(item.label)}</span>
              <div style="display:flex; align-items:center; gap:10px;">
                <span class="text-small tabular-nums" style="font-weight:700;">${item.got} / ${item.max}</span>
                ${statusBadge}
              </div>
            </div>
            ${keysHtml ? `<div style="margin-top:2px;">${keysHtml}</div>` : ''}
            ${hintHtml}
            ${tipHtml}
          </div>
        `;
      }).join('');

      var highlightedAnswerHtml = window.Engine.highlight(text, out.matchedVariants || []);

      container.innerHTML = `
        <div class="view-enter">
          <!-- Top Row -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:12px;">
            <div>
              <div style="display:flex; align-items:center; gap:10px; margin-bottom:4px;">
                <span style="font-weight:800; font-size:16px; color:var(--accent);">${escapeHtml(card.id)}</span>
                <span class="chip chip-marks tabular-nums">${card.marks} marks</span>
                ${badgeHtml}
              </div>
              <h1 class="hero-title" style="font-size:32px; margin:0;">${escapeHtml(card.topic)}</h1>
            </div>
            <div>
              <a href="#/q/${encodeURIComponent(card.id)}" class="btn btn-primary btn-sm">↺ Try again</a>
            </div>
          </div>

          ${retryBannerHtml}

          <!-- Score & Where Marks Leaked Grid -->
          <div class="grid-2" style="margin-bottom:28px; align-items:stretch;">
            <!-- Left: Score Ring -->
            <div class="glass-card" style="display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:32px;">
              <h3 class="h3-title" style="font-size:18px; color:var(--muted); margin-bottom:20px;">Score Summary</h3>
              <div class="score-ring-wrap">
                <svg viewBox="0 0 160 160">
                  <circle class="score-ring-bg" cx="80" cy="80" r="64" />
                  <circle class="score-ring-fill" id="score-ring-circle" cx="80" cy="80" r="64" stroke-dasharray="402.12" stroke-dashoffset="402.12" />
                </svg>
                <div class="score-ring-text">
                  <span id="animated-score-num">0</span>
                  <span class="score-sub">out of ${card.marks}</span>
                </div>
              </div>

              <div style="display:flex; gap:24px; margin-top:24px;">
                <div>
                  <div class="text-small">Marks Kept</div>
                  <div style="font-size:22px; font-weight:800; color:var(--ok);" class="tabular-nums">${out.total}</div>
                </div>
                <div style="width:1px; background:var(--stroke);"></div>
                <div>
                  <div class="text-small">Marks Leaked</div>
                  <div style="font-size:22px; font-weight:800; color:var(--bad);" class="tabular-nums">${+(card.marks - out.total).toFixed(1)}</div>
                </div>
              </div>
            </div>

            <!-- Right: Where Marks Leaked -->
            <div class="glass-card">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <h3 class="h3-title" style="margin:0; font-size:20px;">Where Marks Leaked</h3>
                <span class="text-small" style="color:var(--muted);">${out.leaks.length} item(s) to fix</span>
              </div>
              <div style="max-height:360px; overflow-y:auto; padding-right:4px;">
                ${leaksHtml}
              </div>
            </div>
          </div>

          <!-- Handwriting Card (Photo/Camera only) -->
          ${handwritingCardHtml}

          <!-- Traps & Warnings -->
          ${trapsHtml}
          ${warningsHtml}

          <!-- Key Checklist -->
          <div class="glass-card" style="margin-bottom:28px;">
            <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:16px; flex-wrap:wrap; gap:8px;">
              <div>
                <h3 class="h3-title" style="margin:0;">Key Checklist</h3>
                <p class="text-small" style="color:var(--muted); margin-top:2px;">Every item the board valuator looks for in this answer</p>
              </div>
              <div class="text-small" style="color:var(--muted);">
                ✔ Found &nbsp;|&nbsp; ✔ Spelling &nbsp;|&nbsp; ◐ Partial &nbsp;|&nbsp; ✖ Missing
              </div>
            </div>
            <div>
              ${checklistHtml}
            </div>
          </div>

          <!-- Your Answer Highlighted -->
          <div class="glass-card" style="margin-bottom:28px;">
            <h3 class="h3-title" style="margin-bottom:12px;">Your Answer</h3>
            <p class="text-small" style="color:var(--muted); margin-bottom:12px;">
              Matched keywords and phrases are highlighted in <mark class="kw">yellow</mark>:
            </p>
            <div style="background:rgba(10, 24, 34, 0.7); border:1px solid var(--stroke); border-radius:14px; padding:20px; font-size:18px; line-height:1.6; white-space:pre-wrap;">${highlightedAnswerHtml}</div>
          </div>

          <!-- Model Answer (Hidden by default) -->
          <div class="glass-card" style="margin-bottom:28px;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
              <div>
                <h3 class="h3-title" style="margin:0;">Model Answer</h3>
                <p class="text-small" style="color:var(--muted); margin-top:2px;">Compare with the recommended textbook answer</p>
              </div>
              <button id="btn-toggle-model" class="btn btn-secondary btn-sm">Reveal model answer</button>
            </div>

            <div id="model-answer-container" style="display:none;">
              <div class="model-answer-box">
                <p style="color:#FFFFFF; font-weight:500;">${escapeHtml(card.model)}</p>
                ${(card.mistakes && card.mistakes.length) ? `
                  <div style="margin-top:14px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.1);">
                    <div style="font-weight:700; font-size:14px; color:var(--warn); margin-bottom:4px;">Common Student Mistakes:</div>
                    <ul style="padding-left:20px; font-size:15px; color:var(--muted);">
                      ${card.mistakes.map(function (m) { return `<li>${escapeHtml(m)}</li>`; }).join('')}
                    </ul>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- Bottom Footer Note -->
          <div style="text-align:center; padding:16px; color:var(--muted); font-size:14px;">
            Estimate based on a draft key. Real valuators may differ.
          </div>
        </div>
      `;

      // Animate score ring (600ms)
      var circle = document.getElementById('score-ring-circle');
      var scoreNumEl = document.getElementById('animated-score-num');
      var circumference = 402.12;
      var ratio = card.marks > 0 ? (out.total / card.marks) : 0;
      var targetOffset = circumference - (ratio * circumference);

      if (circle) {
        requestAnimationFrame(function () {
          circle.style.strokeDashoffset = targetOffset;
        });
      }

      if (scoreNumEl) {
        var start = 0;
        var end = out.total;
        var startTime = performance.now();
        var duration = 600;

        function animateNumber(now) {
          var elapsed = now - startTime;
          var progress = Math.min(elapsed / duration, 1);
          var cur = (start + (end - start) * progress).toFixed(1);
          if (cur.endsWith('.0')) cur = parseInt(cur, 10);
          scoreNumEl.textContent = cur;
          if (progress < 1) requestAnimationFrame(animateNumber);
        }
        requestAnimationFrame(animateNumber);
      }

      // Toggle model answer
      var toggleBtn = document.getElementById('btn-toggle-model');
      var modelBox = document.getElementById('model-answer-container');
      if (toggleBtn && modelBox) {
        toggleBtn.addEventListener('click', function () {
          var isHidden = modelBox.style.display === 'none';
          modelBox.style.display = isHidden ? 'block' : 'none';
          toggleBtn.textContent = isHidden ? 'Hide model answer' : 'Reveal model answer';
        });
      }
    },

    // ----------------- 6. HOW MARKS ARE DECIDED (#/how) -----------------
    renderHow: function (container) {
      stopActiveCamera();
      container.innerHTML = `
        <div class="view-enter">
          <div style="margin-bottom:24px;">
            <a href="#/" class="btn btn-secondary btn-sm">← Back to Practice</a>
          </div>

          <div style="max-width:840px; margin:0 auto;">
            <div style="text-align:center; margin-bottom:36px;">
              <h1 class="hero-title" style="font-size:42px; margin-bottom:10px;">How marks are decided</h1>
              <p class="hero-sub" style="margin:0 auto;">
                Understanding how StudentSphere marks your answers, protects your trust, and mirrors board exam valuation.
              </p>
            </div>

            <div class="grid-2" style="margin-bottom:32px;">
              <div class="glass-card">
                <div style="font-size:28px; margin-bottom:10px;">📋</div>
                <h3 class="h3-title" style="font-size:20px;">1. Key Cards</h3>
                <p style="font-size:16px; color:var(--muted); line-height:1.5;">
                  Each question has a Key Card designed like an official valuator's key: must-have keywords, accepted alternatives, step-by-step points, formulas, and units.
                </p>
              </div>

              <div class="glass-card">
                <div style="font-size:28px; margin-bottom:10px;">⚙️</div>
                <h3 class="h3-title" style="font-size:20px;">2. Fixed Rules (No AI Grading)</h3>
                <p style="font-size:16px; color:var(--muted); line-height:1.5;">
                  The app looks for those words and steps in your answer using deterministic rules in Engine.evaluate. No AI model ever decides a mark.
                </p>
              </div>

              <div class="glass-card">
                <div style="font-size:28px; margin-bottom:10px;">✍️</div>
                <h3 class="h3-title" style="font-size:20px;">3. AI Only Reads Handwriting</h3>
                <p style="font-size:16px; color:var(--muted); line-height:1.5;">
                  Vision AI is used solely to transcribe handwriting into text. You always inspect and correct the transcript before any mark is calculated.
                </p>
              </div>

              <div class="glass-card">
                <div style="font-size:28px; margin-bottom:10px;">✏️</div>
                <h3 class="h3-title" style="font-size:20px;">4. Spelling Tolerances</h3>
                <p style="font-size:16px; color:var(--muted); line-height:1.5;">
                  A key term with a small spelling slip still earns the mark but is flagged orange, alerting you that strict board examiners may penalize it.
                </p>
              </div>

              <div class="glass-card">
                <div style="font-size:28px; margin-bottom:10px;">🏷️</div>
                <h3 class="h3-title" style="font-size:20px;">5. Draft vs Verified Keys</h3>
                <p style="font-size:16px; color:var(--muted); line-height:1.5;">
                  All keys are explicitly marked as "Draft key" until a certified Class 12 teacher reviews and verifies them for the board syllabus.
                </p>
              </div>

              <div class="glass-card">
                <div style="font-size:28px; margin-bottom:10px;">🎯</div>
                <h3 class="h3-title" style="font-size:20px;">6. Honest Limits</h3>
                <p style="font-size:16px; color:var(--muted); line-height:1.5;">
                  This is a practice tool. It gives a close estimate based on key requirements, but real human examiners may have differing discretionary judgment.
                </p>
              </div>
            </div>

            <div style="text-align:center; margin-bottom:40px;">
              <a href="#/" class="btn btn-primary">Start Practicing Questions →</a>
            </div>
          </div>
        </div>
      `;
    },

    // ----------------- 7. KEYWORD BANK SCREEN (#/bank) -----------------
    renderBank: function (container, state) {
      stopActiveCamera();
      var allCards = (state.keycards && state.keycards.cards) ? state.keycards.cards : [];
      var activeSubject = 'all';
      var searchQuery = '';

      function draw() {
        var isTeacher = window.Store ? Store.isTeacherMode() : false;
        var suggestions = window.Store ? Store.getSuggestions() : [];
        var pendingSuggestions = suggestions.filter(function (s) { return s.status === 'pending'; });
        var overrides = window.Store ? Store.getOverrides() : {};

        // Flatten all items across cards
        var allItems = [];
        allCards.forEach(function (c) {
          if (activeSubject !== 'all' && c.subject.toLowerCase() !== activeSubject.toLowerCase()) return;
          c.items.forEach(function (item) {
            var approvedExtra = (overrides[c.id] && overrides[c.id][item.id]) ? overrides[c.id][item.id] : [];
            var textToSearch = (c.topic + ' ' + c.chapter + ' ' + item.label + ' ' + (item.keys || []).join(' ') + ' ' + approvedExtra.join(' ')).toLowerCase();
            if (searchQuery && !textToSearch.includes(searchQuery.toLowerCase())) return;

            allItems.push({
              card: c,
              item: item,
              approvedExtra: approvedExtra
            });
          });
        });

        var subjectTabsHtml = ['all', 'Physics', 'Chemistry', 'Biology', 'Accountancy', 'Maths'].map(function (sub) {
          var label = sub === 'all' ? 'All Subjects' : sub;
          var isActive = activeSubject.toLowerCase() === sub.toLowerCase() ? 'active' : '';
          return `<button class="filter-chip ${isActive}" data-subject="${sub}">${label}</button>`;
        }).join(' ');

        // Teacher suggestions banner
        var teacherSectionHtml = '';
        if (isTeacher) {
          var pendingListHtml = pendingSuggestions.length ? pendingSuggestions.map(function (sugg) {
            var targetCard = allCards.find(function (c) { return c.id === sugg.cardId; });
            var topic = targetCard ? targetCard.topic : sugg.cardId;
            return `
              <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(10,24,34,0.6); padding:12px 16px; border-radius:10px; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
                <div>
                  <span style="font-weight:700; color:var(--accent); font-size:16px;">"${escapeHtml(sugg.word)}"</span>
                  <span class="text-small" style="color:var(--muted); margin-left:8px;">for ${escapeHtml(topic)} (${escapeHtml(sugg.cardId)})</span>
                </div>
                <div style="display:flex; gap:8px;">
                  <button class="btn btn-primary btn-sm btn-approve" data-id="${sugg.id}">✔ Approve</button>
                  <button class="btn btn-secondary btn-sm btn-reject" data-id="${sugg.id}">✖ Reject</button>
                </div>
              </div>
            `;
          }).join('') : '<p class="text-small text-muted">No pending student word suggestions.</p>';

          teacherSectionHtml = `
            <div class="glass-card" style="margin-bottom:24px; border-color:var(--ok);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="color:var(--ok); font-size:18px;">🧑‍🏫</span>
                  <strong style="color:var(--ok);">Teacher Mode Active (PIN 1234)</strong>
                </div>
                <button id="btn-lock-teacher" class="btn btn-secondary btn-sm">Lock Teacher Mode</button>
              </div>
              <div style="margin-top:10px;">
                <div style="font-size:14px; font-weight:700; color:#FFFFFF; margin-bottom:8px;">Pending Student Suggestions for Keyword Bank:</div>
                ${pendingListHtml}
              </div>
            </div>
          `;
        }

        var itemsListHtml = allItems.map(function (row) {
          var c = row.card;
          var item = row.item;
          var approved = row.approvedExtra;

          var keysHtml = (item.keys || []).map(function (k) {
            return `<span class="key-chip">${escapeHtml(k)}</span>`;
          }).join('');

          var approvedHtml = approved.map(function (w) {
            return `<span class="key-chip" style="border-color:var(--ok); color:var(--ok);">${escapeHtml(w)} <span class="btn-teacher-tag">Teacher Approved</span></span>`;
          }).join('');

          return `
            <div class="check-item" style="margin-bottom:16px;">
              <div class="check-header">
                <div>
                  <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                    <span style="font-weight:800; font-size:15px; color:var(--accent);">${escapeHtml(c.id)}</span>
                    <span style="font-size:14px; color:var(--muted);">${escapeHtml(c.subject)} · ${escapeHtml(c.chapter)}</span>
                  </div>
                  <h4 style="font-size:18px; font-weight:700; color:#FFFFFF; margin:0;">${escapeHtml(c.topic)}</h4>
                </div>
                <button class="btn btn-secondary btn-sm btn-suggest-word" data-card="${c.id}" data-item="${item.id}" data-topic="${escapeHtml(c.topic)}">
                  + Suggest another word
                </button>
              </div>

              <div style="margin-top:8px;">
                <div style="font-size:15px; font-weight:600; color:var(--text); margin-bottom:6px;">${escapeHtml(item.label)}</div>
                <div>${keysHtml} ${approvedHtml}</div>
              </div>
            </div>
          `;
        }).join('');

        container.innerHTML = `
          <div class="view-enter">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
              <a href="#/" class="btn btn-secondary btn-sm">← Back to Practice</a>
              ${!isTeacher ? '<button id="btn-unlock-teacher" class="btn btn-secondary btn-sm">Teacher Mode (PIN 1234)</button>' : ''}
            </div>

            <div style="margin-bottom:28px;">
              <h1 class="hero-title" style="font-size:42px; margin-bottom:8px;">Keyword Bank</h1>
              <p class="text-muted" style="font-size:18px;">
                Every must-have keyword and accepted synonym required by Class 12 valuator keys.
              </p>
            </div>

            ${teacherSectionHtml}

            <!-- Search and Filter Bar -->
            <div class="glass-card" style="margin-bottom:24px; padding:20px;">
              <input type="text" id="bank-search-input" placeholder="Search keywords, laws, formulas, chapters…" value="${escapeHtml(searchQuery)}" style="margin-bottom:16px;" />
              <div style="display:flex; gap:8px; flex-wrap:wrap;" id="bank-subject-tabs">
                ${subjectTabsHtml}
              </div>
            </div>

            <div>
              ${itemsListHtml.length ? itemsListHtml : '<div class="glass-card" style="text-align:center; padding:36px;"><p class="text-muted">No keywords found matching search.</p></div>'}
            </div>

            <!-- Suggestion Modal / Input Container -->
            <div id="suggest-modal-wrap" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(8px); z-index:9999; display:none; align-items:center; justify-content:center; padding:20px;">
              <div class="glass-card" style="max-width:500px; width:100%; padding:28px;">
                <h3 class="h3-title" style="margin-bottom:6px;">Suggest Alternative Keyword</h3>
                <p class="text-small" style="color:var(--muted); margin-bottom:16px;" id="suggest-modal-sub"></p>
                <label for="suggest-word-input" style="font-size:14px; color:var(--muted); display:block; margin-bottom:6px;">Your suggested synonym or alternative term:</label>
                <input type="text" id="suggest-word-input" placeholder="e.g. against the flux" style="margin-bottom:20px;" />
                <div style="display:flex; justify-content:flex-end; gap:12px;">
                  <button id="btn-cancel-suggest" class="btn btn-secondary btn-sm">Cancel</button>
                  <button id="btn-submit-suggest" class="btn btn-primary btn-sm">Submit for Teacher Review</button>
                </div>
              </div>
            </div>
          </div>
        `;

        // Search events
        var searchInput = document.getElementById('bank-search-input');
        if (searchInput) {
          searchInput.addEventListener('input', function (e) {
            searchQuery = e.target.value;
            draw();
          });
        }

        // Subject filter events
        var tabsWrap = document.getElementById('bank-subject-tabs');
        if (tabsWrap) {
          tabsWrap.addEventListener('click', function (e) {
            var btn = e.target.closest('button[data-subject]');
            if (btn) {
              activeSubject = btn.getAttribute('data-subject');
              draw();
            }
          });
        }

        // Teacher Mode Unlock
        var unlockBtn = document.getElementById('btn-unlock-teacher');
        if (unlockBtn) {
          unlockBtn.addEventListener('click', function () {
            var pin = prompt('Enter Teacher PIN:');
            if (pin === '1234') {
              Store.setTeacherMode(true);
              draw();
            } else if (pin !== null) {
              alert('Incorrect PIN. The teacher PIN for this stall is 1234.');
            }
          });
        }

        var lockBtn = document.getElementById('btn-lock-teacher');
        if (lockBtn) {
          lockBtn.addEventListener('click', function () {
            Store.setTeacherMode(false);
            draw();
          });
        }

        // Suggest word modal
        var modalWrap = document.getElementById('suggest-modal-wrap');
        var modalSub = document.getElementById('suggest-modal-sub');
        var modalInput = document.getElementById('suggest-word-input');
        var cancelSuggestBtn = document.getElementById('btn-cancel-suggest');
        var submitSuggestBtn = document.getElementById('btn-submit-suggest');
        var curSuggestTarget = null;

        container.querySelectorAll('.btn-suggest-word').forEach(function (b) {
          b.addEventListener('click', function () {
            var cardId = b.getAttribute('data-card');
            var itemId = b.getAttribute('data-item');
            var topic = b.getAttribute('data-topic');
            curSuggestTarget = { cardId: cardId, itemId: itemId };
            modalSub.textContent = 'Question: ' + topic + ' (' + cardId + ')';
            modalInput.value = '';
            modalWrap.style.display = 'flex';
            modalInput.focus();
          });
        });

        if (cancelSuggestBtn) {
          cancelSuggestBtn.addEventListener('click', function () {
            modalWrap.style.display = 'none';
          });
        }

        if (submitSuggestBtn) {
          submitSuggestBtn.addEventListener('click', function () {
            var word = modalInput.value.trim();
            if (!word || !curSuggestTarget) return;

            Store.saveSuggestion({
              id: 's_' + Date.now(),
              cardId: curSuggestTarget.cardId,
              itemId: curSuggestTarget.itemId,
              word: word,
              status: 'pending',
              ts: Date.now()
            });

            modalWrap.style.display = 'none';
            alert('Thank you! "' + word + '" submitted for teacher review.');
            draw();
          });
        }

        // Teacher Approve / Reject actions
        container.querySelectorAll('.btn-approve').forEach(function (b) {
          b.addEventListener('click', function () {
            var id = b.getAttribute('data-id');
            Store.updateSuggestionStatus(id, 'approved');
            draw();
          });
        });

        container.querySelectorAll('.btn-reject').forEach(function (b) {
          b.addEventListener('click', function () {
            var id = b.getAttribute('data-id');
            Store.updateSuggestionStatus(id, 'rejected');
            draw();
          });
        });
      }

      draw();
    },

    // ----------------- 8. CLASS MAP / TEACHER VIEW (#/teacher) -----------------
    renderTeacher: function (container, state) {
      stopActiveCamera();
      var isTeacher = window.Store ? Store.isTeacherMode() : false;
      var allCards = (state.keycards && state.keycards.cards) ? state.keycards.cards : [];

      // PIN Gate (PIN 1234)
      if (!isTeacher) {
        container.innerHTML = `
          <div class="view-enter" style="max-width:520px; margin:40px auto;">
            <div style="margin-bottom:16px;">
              <a href="#/" class="btn btn-secondary btn-sm">← Back to Practice</a>
            </div>

            <div class="glass-card" style="padding:36px; text-align:center;">
              <span style="font-size:44px; display:block; margin-bottom:12px;">🔒</span>
              <h2 class="h2-title" style="margin-bottom:8px;">Teacher Mode PIN</h2>
              <p class="text-muted" style="margin-bottom:24px;">Enter PIN (1234) to unlock Class Map analytics and re-teach insights.</p>

              <form id="teacher-pin-form">
                <input type="password" id="teacher-pin-input" placeholder="Enter PIN" maxlength="10" style="text-align:center; font-size:24px; letter-spacing:6px; margin-bottom:16px;" autofocus />
                <div id="pin-error-box" style="display:none; color:var(--bad); font-size:15px; margin-bottom:14px;">Incorrect PIN. Try 1234.</div>
                <button type="submit" class="btn btn-primary" style="width:100%;">Unlock Class Map</button>
              </form>
            </div>
          </div>
        `;

        var pinForm = document.getElementById('teacher-pin-form');
        var pinInput = document.getElementById('teacher-pin-input');
        var pinErr = document.getElementById('pin-error-box');

        if (pinForm) {
          pinForm.addEventListener('submit', function (e) {
            e.preventDefault();
            if (pinInput.value.trim() === '1234') {
              Store.setTeacherMode(true);
              Views.renderTeacher(container, state);
            } else {
              pinErr.style.display = 'block';
              pinInput.focus();
            }
          });
        }
        return;
      }

      // Teacher Mode Authenticated: Render Class Map
      var attempts = window.Store ? Store.getAttempts() : [];
      var totalAttempts = attempts.length;

      var totalScore = 0;
      var totalMax = 0;
      var totalReadability = 0;
      var subjectsSeen = {};
      var missingFrequency = {}; // itemId -> { count, cardId }
      var spellingFrequency = {}; // word -> count

      attempts.forEach(function (att) {
        totalScore += (att.score || 0);
        totalMax += (att.max || 0);
        totalReadability += (att.readability !== undefined ? att.readability : 100);
        if (att.subject) subjectsSeen[att.subject] = (subjectsSeen[att.subject] || 0) + 1;

        (att.missing || []).forEach(function (itemId) {
          if (!missingFrequency[itemId]) missingFrequency[itemId] = { count: 0, cardId: att.cardId };
          missingFrequency[itemId].count++;
        });

        (att.spelling || []).forEach(function (spellWord) {
          var cleanW = String(spellWord).toLowerCase().trim();
          if (cleanW) {
            spellingFrequency[cleanW] = (spellingFrequency[cleanW] || 0) + 1;
          }
        });
      });

      var avgScorePct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
      var avgReadabilityPct = totalAttempts > 0 ? Math.round(totalReadability / totalAttempts) : 0;
      var subjectsTriedCount = Object.keys(subjectsSeen).length;

      // Find Top 8 Most Missed Keywords
      var missedList = [];
      Object.keys(missingFrequency).forEach(function (itemId) {
        var info = missingFrequency[itemId];
        var card = allCards.find(function (c) { return c.id === info.cardId; });
        var cardItem = card ? card.items.find(function (it) { return it.id === itemId; }) : null;

        missedList.push({
          itemId: itemId,
          cardId: info.cardId,
          count: info.count,
          label: cardItem ? cardItem.label : 'Item ' + itemId,
          topic: card ? card.topic : info.cardId,
          subject: card ? card.subject : 'Science',
          tip: cardItem ? cardItem.tip : ''
        });
      });
      missedList.sort(function (a, b) { return b.count - a.count; });
      var topMissed = missedList.slice(0, 8);
      var top5Reteach = missedList.slice(0, 5);

      // Top 5 Spelling Slips
      var spellingList = Object.keys(spellingFrequency).map(function (w) {
        return { word: w, count: spellingFrequency[w] };
      });
      spellingList.sort(function (a, b) { return b.count - a.count; });
      var top5Spelling = spellingList.slice(0, 5);

      var missedTableRowsHtml = topMissed.length ? topMissed.map(function (m, idx) {
        return `
          <tr>
            <td style="font-weight:700;">#${idx + 1}</td>
            <td>
              <strong style="color:#FFFFFF;">${escapeHtml(m.label)}</strong>
              <div class="text-small" style="color:var(--muted);">${escapeHtml(m.topic)} (${escapeHtml(m.cardId)})</div>
            </td>
            <td><span class="chip chip-part">${escapeHtml(m.subject)}</span></td>
            <td class="tabular-nums" style="font-weight:800; color:var(--bad);">${m.count}</td>
          </tr>
        `;
      }).join('') : '<tr><td colspan="4" class="text-muted" style="text-align:center; padding:24px;">No missed keywords recorded yet today.</td></tr>';

      var spellingRowsHtml = top5Spelling.length ? top5Spelling.map(function (s, idx) {
        return `
          <tr>
            <td>#${idx + 1}</td>
            <td style="color:var(--warn); font-weight:700;">"${escapeHtml(s.word)}"</td>
            <td class="tabular-nums">${s.count} time(s)</td>
          </tr>
        `;
      }).join('') : '<tr><td colspan="3" class="text-muted" style="text-align:center; padding:20px;">No spelling flags recorded.</td></tr>';

      var reteachItemsHtml = top5Reteach.length ? top5Reteach.map(function (r, idx) {
        return `
          <div style="background:rgba(10,24,34,0.6); border:1px solid var(--stroke); border-radius:12px; padding:16px; margin-bottom:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <strong style="color:var(--accent);">${idx + 1}. ${escapeHtml(r.topic)} (${escapeHtml(r.cardId)})</strong>
              <span class="chip chip-marks">${r.count} students missed</span>
            </div>
            <div style="font-size:16px; color:#FFFFFF; margin-bottom:6px;">${escapeHtml(r.label)}</div>
            ${r.tip ? `<div style="font-size:14px; color:#93C5FD;">💡 Teacher teaching tip: ${escapeHtml(r.tip)}</div>` : ''}
          </div>
        `;
      }).join('') : '<p class="text-muted">No re-teach items yet. Practice attempts will populate this list live.</p>';

      container.innerHTML = `
        <div class="view-enter">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
            <a href="#/" class="btn btn-secondary btn-sm">← Back to Practice</a>
            <div style="display:flex; gap:10px;">
              <button id="btn-print-reteach" class="btn btn-secondary btn-sm">🖨️ Print Re-teach List</button>
              <button id="btn-lock-classmap" class="btn btn-secondary btn-sm">Lock Teacher Mode</button>
            </div>
          </div>

          <div style="margin-bottom:28px;">
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:6px;">
              <h1 class="hero-title" style="font-size:38px; margin:0;">Class Map</h1>
              <span class="chip chip-verified">Live stall data</span>
            </div>
            <p class="text-muted" style="font-size:18px;">
              Live diagnostic analytics from today's student visitors at this laptop stall.
            </p>
          </div>

          <!-- Summary Metric Cards -->
          <div class="grid-4" style="display:grid; grid-template-columns:repeat(4, 1fr); gap:16px; margin-bottom:32px;">
            <div class="stat-metric-card">
              <div class="stat-metric-num tabular-nums">${totalAttempts}</div>
              <div class="text-small">Attempts Today</div>
            </div>
            <div class="stat-metric-card">
              <div class="stat-metric-num tabular-nums" style="color:var(--ok);">${avgScorePct}%</div>
              <div class="text-small">Average Score</div>
            </div>
            <div class="stat-metric-card">
              <div class="stat-metric-num tabular-nums" style="color:var(--accent);">${avgReadabilityPct}%</div>
              <div class="text-small">Avg Handwriting Readability</div>
            </div>
            <div class="stat-metric-card">
              <div class="stat-metric-num tabular-nums">${subjectsTriedCount}/5</div>
              <div class="text-small">Subjects Practiced</div>
            </div>
          </div>

          <!-- Most Missed Keywords -->
          <div class="glass-card" style="margin-bottom:28px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <div>
                <h3 class="h3-title" style="margin:0;">Most Missed Keywords (Top 8)</h3>
                <p class="text-small" style="color:var(--muted); margin-top:2px;">Points where students lost the most board marks today</p>
              </div>
            </div>

            <div style="overflow-x:auto;">
              <table class="glass-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Missing Point / Key</th>
                    <th>Subject</th>
                    <th>Students Missed</th>
                  </tr>
                </thead>
                <tbody>
                  ${missedTableRowsHtml}
                </tbody>
              </table>
            </div>
          </div>

          <!-- 2 Columns: Re-teach List & Spelling Slips -->
          <div class="grid-2" style="margin-bottom:32px;">
            <!-- Re-teach List -->
            <div class="glass-card">
              <h3 class="h3-title" style="margin-bottom:6px;">Top 5 Re-teach List</h3>
              <p class="text-small" style="color:var(--muted); margin-bottom:16px;">
                Recommended focus areas for the next classroom revision session
              </p>
              <div>
                ${reteachItemsHtml}
              </div>
            </div>

            <!-- Spelling Slips -->
            <div class="glass-card">
              <h3 class="h3-title" style="margin-bottom:6px;">Common Spelling Slips</h3>
              <p class="text-small" style="color:var(--muted); margin-bottom:16px;">
                Spelling mistakes flagged in key terms by the engine today
              </p>
              <div style="overflow-x:auto;">
                <table class="glass-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Misspelled Term</th>
                      <th>Occurrences</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${spellingRowsHtml}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; padding:16px 0; border-top:1px solid rgba(255,255,255,0.08); flex-wrap:wrap; gap:12px;">
            <span class="text-small text-muted">Honest notice: Demo data from this laptop only.</span>
            <button id="btn-reset-stall-data" class="btn btn-secondary btn-sm" style="color:var(--bad); border-color:rgba(255,92,108,0.3);">
              Reset Stall Data
            </button>
          </div>
        </div>
      `;

      // Event handlers
      var lockBtn = document.getElementById('btn-lock-classmap');
      if (lockBtn) {
        lockBtn.addEventListener('click', function () {
          Store.setTeacherMode(false);
          Views.renderTeacher(container, state);
        });
      }

      var printBtn = document.getElementById('btn-print-reteach');
      if (printBtn) {
        printBtn.addEventListener('click', function () {
          window.print();
        });
      }

      var resetBtn = document.getElementById('btn-reset-stall-data');
      if (resetBtn) {
        resetBtn.addEventListener('click', function () {
          if (confirm('Are you sure you want to reset all attempt data collected at this stall today?')) {
            Store.clearAttempts();
            Views.renderTeacher(container, state);
          }
        });
      }
    },

    // ----------------- 9. PEER MARKING SCREEN (#/peer) -----------------
    renderPeer: function (container, state) {
      stopActiveCamera();
      var allCards = (state.keycards && state.keycards.cards) ? state.keycards.cards : [];
      // Find cards with peerSamples
      var cardsWithSamples = allCards.filter(function (c) {
        return c.peerSamples && c.peerSamples.length > 0;
      });

      if (!cardsWithSamples.length) {
        Views.renderPlaceholder(container, 'Peer Marking', 'No peer samples available.');
        return;
      }

      var selectedIndex = 0;
      var selectedSampleIndex = 0;

      function draw() {
        var card = cardsWithSamples[selectedIndex];
        var sample = card.peerSamples[selectedSampleIndex] || card.peerSamples[0];

        var cardChipsHtml = cardsWithSamples.map(function (c, idx) {
          var isActive = idx === selectedIndex ? 'active' : '';
          return `<button class="filter-chip ${isActive}" data-cidx="${idx}">${escapeHtml(c.id)}: ${escapeHtml(c.topic)}</button>`;
        }).join(' ');

        var sampleChipsHtml = card.peerSamples.map(function (s, sIdx) {
          var isActive = sIdx === selectedSampleIndex ? 'active' : '';
          return `<button class="filter-chip ${isActive}" data-sidx="${sIdx}">${escapeHtml(s.label)}</button>`;
        }).join(' ');

        var checklistFormHtml = card.items.map(function (item, itIdx) {
          return `
            <label class="peer-check-label">
              <input type="checkbox" class="peer-item-cb" data-itemid="${item.id}" />
              <div>
                <strong style="color:#FFFFFF; font-size:16px;">${escapeHtml(item.label)}</strong>
                <div class="text-small" style="color:var(--muted); margin-top:2px;">Worth ${item.marks} mark(s)</div>
              </div>
            </label>
          `;
        }).join('');

        container.innerHTML = `
          <div class="view-enter">
            <div style="margin-bottom:20px;">
              <a href="#/" class="btn btn-secondary btn-sm">← Back to Practice</a>
            </div>

            <div style="margin-bottom:28px;">
              <h1 class="hero-title" style="font-size:38px; margin-bottom:8px;">Peer Marking Practice</h1>
              <p class="text-muted" style="font-size:18px;">
                Step into the examiner's shoes. Read an anonymous student's answer and tick which points they earned.
              </p>
            </div>

            <!-- Card Selector -->
            <div class="glass-card" style="margin-bottom:24px; padding:18px;">
              <div style="font-size:14px; font-weight:700; color:var(--muted); margin-bottom:10px;">Select a Practice Question:</div>
              <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px;" id="peer-card-tabs">
                ${cardChipsHtml}
              </div>
              <div style="display:flex; align-items:center; gap:10px;">
                <span class="text-small" style="color:var(--muted);">Samples:</span>
                <div style="display:flex; gap:8px;" id="peer-sample-tabs">
                  ${sampleChipsHtml}
                </div>
              </div>
            </div>

            <!-- Main Peer Marking Split Layout -->
            <div class="grid-2" style="align-items:start; margin-bottom:28px;">
              <!-- Left: Anonymous Sample Text -->
              <div class="glass-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                  <h3 class="h3-title" style="font-size:20px; margin:0;">${escapeHtml(sample.label)} Answer Text</h3>
                  <span class="chip chip-marks">${card.marks} marks</span>
                </div>
                <div class="peer-sample-box">
                  "${escapeHtml(sample.text)}"
                </div>
                <div style="font-size:15px; color:var(--muted);">
                  <strong>Question:</strong> ${escapeHtml(card.question)}
                </div>
              </div>

              <!-- Right: Valuator Checklist to Tick -->
              <div class="glass-card">
                <h3 class="h3-title" style="font-size:20px; margin-bottom:6px;">Examiner Checklist</h3>
                <p class="text-small" style="color:var(--muted); margin-bottom:16px;">
                  Tick every point you believe this answer earned:
                </p>

                <div id="peer-checklist-container">
                  ${checklistFormHtml}
                </div>

                <div style="margin-top:20px;">
                  <button id="btn-reveal-peer-key" class="btn btn-primary" style="width:100%;">
                    Reveal Key & Compare →
                  </button>
                </div>
              </div>
            </div>

            <!-- Comparison Results Box (Hidden until revealed) -->
            <div id="peer-comparison-results" style="display:none;" class="glass-card"></div>
          </div>
        `;

        // Tab events
        var cardTabs = document.getElementById('peer-card-tabs');
        if (cardTabs) {
          cardTabs.addEventListener('click', function (e) {
            var btn = e.target.closest('button[data-cidx]');
            if (btn) {
              selectedIndex = parseInt(btn.getAttribute('data-cidx'), 10);
              selectedSampleIndex = 0;
              draw();
            }
          });
        }

        var sampleTabs = document.getElementById('peer-sample-tabs');
        if (sampleTabs) {
          sampleTabs.addEventListener('click', function (e) {
            var btn = e.target.closest('button[data-sidx]');
            if (btn) {
              selectedSampleIndex = parseInt(btn.getAttribute('data-sidx'), 10);
              draw();
            }
          });
        }

        // Compare Button logic
        var revealBtn = document.getElementById('btn-reveal-peer-key');
        var resultsBox = document.getElementById('peer-comparison-results');

        if (revealBtn && resultsBox) {
          revealBtn.addEventListener('click', function () {
            // Get student checked items
            var checkedItemIds = [];
            container.querySelectorAll('.peer-item-cb:checked').forEach(function (cb) {
              checkedItemIds.push(cb.getAttribute('data-itemid'));
            });

            // Evaluate sample text using Engine
            var evalResult = window.Engine.evaluate(card, sample.text);

            var totalItemsCount = card.items.length;
            var agreedCount = 0;

            var itemsComparisonHtml = evalResult.items.map(function (it) {
              var userChecked = checkedItemIds.includes(it.id);
              var engineFound = it.got > 0;
              var agreed = (userChecked === engineFound);
              if (agreed) agreedCount++;

              var icon = agreed ? '✔' : '✖';
              var color = agreed ? 'var(--ok)' : 'var(--bad)';

              return `
                <div style="background:rgba(10,24,34,0.6); border:1px solid var(--stroke); border-radius:10px; padding:14px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <strong style="color:#FFFFFF;">${escapeHtml(it.label)}</strong>
                    <div class="text-small" style="color:var(--muted); margin-top:2px;">
                      You: ${userChecked ? 'Awarded' : 'Not awarded'} · Engine Key: ${engineFound ? 'Awarded (' + it.got + '/' + it.max + ')' : 'Missing'}
                    </div>
                  </div>
                  <span style="font-weight:800; font-size:18px; color:${color};">${icon}</span>
                </div>
              `;
            }).join('');

            resultsBox.style.display = 'block';
            resultsBox.innerHTML = `
              <div style="text-align:center; margin-bottom:20px;">
                <div style="font-size:36px; margin-bottom:8px;">🎯</div>
                <h3 class="h3-title" style="font-size:24px;">Examiner Eye Score</h3>
                <div style="font-size:28px; font-weight:800; color:var(--accent); margin:8px 0;" class="tabular-nums">
                  You agreed with the key on ${agreedCount} of ${totalItemsCount} points!
                </div>
                <p class="text-muted" style="max-width:540px; margin:0 auto;">
                  Engine evaluated mark: <strong style="color:var(--ok);">${evalResult.total} / ${card.marks}</strong>
                </p>
              </div>

              <div>
                ${itemsComparisonHtml}
              </div>
            `;

            resultsBox.scrollIntoView({ behavior: 'smooth' });
          });
        }
      }

      draw();
    },

    // ----------------- 10. LEADERBOARD: BIGGEST COMEBACK (#/leaderboard) -----------------
    renderLeaderboard: function (container, state) {
      stopActiveCamera();
      var attempts = window.Store ? Store.getAttempts() : [];
      var allCards = (state.keycards && state.keycards.cards) ? state.keycards.cards : [];
      var activeTab = 'comeback'; // 'comeback' | 'kept'

      function draw() {
        // Tab 1: Calculate Comebacks (PRD 4.10: Largest improvement between first and latest try on same question)
        var userCardMap = {}; // "nick::cardId" -> [attempts]
        attempts.forEach(function (att) {
          var key = (att.nick || 'Student') + '::' + att.cardId;
          if (!userCardMap[key]) userCardMap[key] = [];
          userCardMap[key].push(att);
        });

        var comebackList = [];
        Object.keys(userCardMap).forEach(function (key) {
          var userAtts = userCardMap[key];
          if (userAtts.length >= 2) {
            var parts = key.split('::');
            var nick = parts[0];
            var cardId = parts[1];
            var firstScore = userAtts[0].score;
            var bestScore = Math.max.apply(null, userAtts.map(function (a) { return a.score; }));
            var improvement = +(bestScore - firstScore).toFixed(1);

            if (improvement > 0) {
              var card = allCards.find(function (c) { return c.id === cardId; });
              comebackList.push({
                nick: nick,
                cardId: cardId,
                topic: card ? card.topic : cardId,
                firstScore: firstScore,
                bestScore: bestScore,
                max: userAtts[0].max,
                improvement: improvement
              });
            }
          }
        });

        comebackList.sort(function (a, b) { return b.improvement - a.improvement; });

        // Tab 2: Most Marks Kept Today (sum of best scores per question per nick)
        var userBestMap = {}; // nick -> { [cardId]: bestScore }
        attempts.forEach(function (att) {
          var nick = att.nick || 'Student';
          if (!userBestMap[nick]) userBestMap[nick] = {};
          if (userBestMap[nick][att.cardId] === undefined || att.score > userBestMap[nick][att.cardId]) {
            userBestMap[nick][att.cardId] = att.score;
          }
        });

        var marksKeptList = [];
        Object.keys(userBestMap).forEach(function (nick) {
          var cardScores = userBestMap[nick];
          var totalKept = 0;
          var qCount = 0;
          Object.keys(cardScores).forEach(function (cid) {
            totalKept += cardScores[cid];
            qCount++;
          });
          marksKeptList.push({
            nick: nick,
            totalKept: +totalKept.toFixed(1),
            questionsCount: qCount
          });
        });
        marksKeptList.sort(function (a, b) { return b.totalKept - a.totalKept; });

        // Render Table Body
        var tableHtml = '';
        if (activeTab === 'comeback') {
          if (!comebackList.length) {
            tableHtml = `
              <tr>
                <td colspan="6" style="text-align:center; padding:36px;" class="text-muted">
                  No comebacks recorded yet today. Complete a question, review your leaks, and try again to get on the board!
                </td>
              </tr>
            `;
          } else {
            tableHtml = comebackList.map(function (row, idx) {
              var rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : 'rank-other';
              return `
                <tr>
                  <td><span class="rank-badge ${rankClass}">${idx + 1}</span></td>
                  <td style="font-weight:700; color:#FFFFFF;">${escapeHtml(row.nick)}</td>
                  <td>${escapeHtml(row.topic)} (${escapeHtml(row.cardId)})</td>
                  <td class="tabular-nums">${row.firstScore} / ${row.max}</td>
                  <td class="tabular-nums" style="font-weight:700; color:var(--ok);">${row.bestScore} / ${row.max}</td>
                  <td class="tabular-nums" style="font-weight:800; color:var(--accent); font-size:18px;">+${row.improvement}</td>
                </tr>
              `;
            }).join('');
          }
        } else {
          if (!marksKeptList.length) {
            tableHtml = `
              <tr>
                <td colspan="4" style="text-align:center; padding:36px;" class="text-muted">
                  No scores recorded yet today. Complete a question to join the board!
                </td>
              </tr>
            `;
          } else {
            tableHtml = marksKeptList.map(function (row, idx) {
              var rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : 'rank-other';
              return `
                <tr>
                  <td><span class="rank-badge ${rankClass}">${idx + 1}</span></td>
                  <td style="font-weight:700; color:#FFFFFF;">${escapeHtml(row.nick)}</td>
                  <td>${row.questionsCount} question(s)</td>
                  <td class="tabular-nums" style="font-weight:800; color:var(--ok); font-size:18px;">${row.totalKept} marks</td>
                </tr>
              `;
            }).join('');
          }
        }

        container.innerHTML = `
          <div class="view-enter">
            <div style="margin-bottom:20px;">
              <a href="#/" class="btn btn-secondary btn-sm">← Back to Practice</a>
            </div>

            <div style="margin-bottom:28px;">
              <div style="display:flex; align-items:center; gap:12px; margin-bottom:6px;">
                <h1 class="hero-title" style="font-size:38px; margin:0;">Stall Leaderboard</h1>
                <span class="chip chip-verified">Live stall rankings</span>
              </div>
              <p class="text-muted" style="font-size:18px;">
                Rewarding students who review where marks leak and come back stronger.
              </p>
            </div>

            <!-- Leaderboard Tabs -->
            <div class="tab-group" id="leaderboard-tabs" style="max-width:540px; margin-bottom:24px;">
              <button class="tab-btn ${activeTab === 'comeback' ? 'active' : ''}" data-tab="comeback">
                🚀 Biggest Comeback (Improvement)
              </button>
              <button class="tab-btn ${activeTab === 'kept' ? 'active' : ''}" data-tab="kept">
                🏆 Most Marks Kept Today
              </button>
            </div>

            <div class="glass-card" style="margin-bottom:24px;">
              <div style="overflow-x:auto;">
                <table class="glass-table">
                  <thead>
                    ${activeTab === 'comeback' ? `
                      <tr>
                        <th>Rank</th>
                        <th>Nickname</th>
                        <th>Question</th>
                        <th>1st Try</th>
                        <th>Best Try</th>
                        <th>Comeback</th>
                      </tr>
                    ` : `
                      <tr>
                        <th>Rank</th>
                        <th>Nickname</th>
                        <th>Questions Completed</th>
                        <th>Total Marks Kept</th>
                      </tr>
                    `}
                  </thead>
                  <tbody>
                    ${tableHtml}
                  </tbody>
                </table>
              </div>
            </div>

            <div style="text-align:center; color:var(--muted); font-size:14px;">
              🔒 Real visitors from this stall only. No simulated or fake scores.
            </div>
          </div>
        `;

        var lbTabs = document.getElementById('leaderboard-tabs');
        if (lbTabs) {
          lbTabs.addEventListener('click', function (e) {
            var btn = e.target.closest('button[data-tab]');
            if (btn) {
              activeTab = btn.getAttribute('data-tab');
              draw();
            }
          });
        }
      }

      draw();
    },

    // ----------------- Placeholder fallback -----------------
    renderPlaceholder: function (container, title, msg) {
      stopActiveCamera();
      container.innerHTML = `
        <div class="view-enter glass-card" style="text-align:center; padding:48px 24px;">
          <h2 class="h2-title">${escapeHtml(title)}</h2>
          <p class="text-muted" style="margin:16px 0 24px;">${escapeHtml(msg)}</p>
          <a href="#/" class="btn btn-secondary">← Back to Home</a>
        </div>
      `;
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Views;
  else root.Views = Views;
})(typeof window !== 'undefined' ? window : this);

