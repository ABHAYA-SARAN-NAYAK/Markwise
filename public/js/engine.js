/* StudentSphere - Mark Leak Finder: checking engine
   Pure JavaScript. No libraries. Works in the browser (window.Engine) and in Node (module.exports).
   AI is NOT used here. Marks come only from the Key Card rules. */
(function (root) {
  'use strict';

  // ---------- 1. Clean-up of text (student text and key words go through the SAME clean-up) ----------
  function norm(s) {
    s = String(s || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    s = s.replace(/\u2044/g, '/')
         .replace(/[\u2212\u2013\u2014\u2012]/g, '-')
         .replace(/[×✕✖*]/g, 'x')
         .replace(/[·⋅•∙]/g, '.')
         .replace(/÷/g, '/')
         .replace(/\bepsilon\b/g, 'ε').replace(/\blambda\b/g, 'λ').replace(/\bpi\b/g, 'π')
         .replace(/\bmu\b/g, 'μ').replace(/\bomega\b/g, 'ω').replace(/\btheta\b/g, 'θ')
         .replace(/\balpha\b/g, 'α').replace(/\bdelta\b/g, 'δ').replace(/\bsqrt\b/g, '√')
         .replace(/\bohms?\b/g, 'ω').replace(/\bphi\b/g, 'φ').replace(/\bnu\b/g, 'ν');
    s = s.replace(/(\d),(?=\d)/g, '$1');                       // 1,08,000 -> 108000
    s = s.replace(/\./g, function (m, i, str) {                // keep '.' only inside numbers
      return /\d/.test(str[i - 1] || '') && /\d/.test(str[i + 1] || '') ? '.' : ' ';
    });
    return s;
  }
  function toSpaced(s) {
    return norm(s).replace(/[^a-z0-9\u03b1-\u03c9°√.+\-\/%]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // ---------- 2. Matching helpers ----------
  function lev(a, b) {
    var m = a.length, n = b.length;
    if (!m) return n; if (!n) return m;
    var prev = [], cur = [], i, j;
    for (j = 0; j <= n; j++) prev[j] = j;
    for (i = 1; i <= m; i++) {
      cur[0] = i;
      for (j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      var t = prev; prev = cur; cur = t;
    }
    return prev[n];
  }
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&'); }

  function makeIndex(text) {
    var S = toSpaced(text), tokens = S ? S.split(' ') : [], C = tokens.join(''), offs = [], p = 0;
    tokens.forEach(function (t) { offs.push(p); p += t.length; });
    return { S: S, C: C, tokens: tokens, offs: offs };
  }

  // Look for ONE variant in the student's text. Returns {pos, spelling} or null.
  function findVariant(ix, variant) {
    var vs = toSpaced(variant), vc = vs.replace(/ /g, '');
    if (!vc) return null;
    var pos = -1, i, w;
    if (vc.length >= 5) {
      pos = ix.C.indexOf(vc);
    } else {
      // short variant: it must equal 1 to 4 whole tokens joined together (so "2160" is not found inside "21600")
      var toks = ix.tokens.map(function (t, k) { return { t: t, p: ix.offs[k] }; });
      ix.tokens.forEach(function (t, k) {            // split number ranges such as 330-350
        if (/^\d[\d.]*-\d[\d.]*$/.test(t)) t.split('-').forEach(function (part) { toks.push({ t: part, p: ix.offs[k] }); });
      });
      for (i = 0; i < ix.tokens.length && pos < 0; i++) {
        var joined = '';
        for (w = 0; w < 4 && i + w < ix.tokens.length; w++) {
          joined += ix.tokens[i + w];
          if (joined === vc) { pos = ix.offs[i]; break; }
          if (joined.length > vc.length) break;
        }
      }
      for (i = 0; i < toks.length && pos < 0; i++) if (toks[i].t === vc) pos = toks[i].p;
    }
    if (pos >= 0) return { pos: pos, spelling: false };
    // spelling check: letters only, long enough, first letter must be right
    if (vc.length >= 7 && /^[a-z\u03b1-\u03c9]+$/.test(vc)) {
      var k = vs.split(' ').length, maxd = vc.length >= 12 ? 2 : 1;
      for (i = 0; i + k <= ix.tokens.length; i++) {
        var cand = ix.tokens.slice(i, i + k).join('');
        if (cand[0] === vc[0] && Math.abs(cand.length - vc.length) <= maxd && lev(cand, vc) <= maxd)
          return { pos: ix.offs[i], spelling: true, saw: cand };
      }
    }
    return null;
  }
  function findAny(ix, variants) {
    var best = null;
    for (var i = 0; i < variants.length; i++) {
      var r = findVariant(ix, variants[i]);
      if (r) { r.variant = variants[i]; if (!best || (best.spelling && !r.spelling)) best = r; if (!r.spelling) break; }
    }
    return best;
  }
  function half(x) { return Math.floor(x * 2 + 1e-9) / 2; }

  // ---------- 3. Transcript preparation (handwriting reading marks unreadable words as [?]) ----------
  function prepareTranscript(raw) {
    raw = String(raw || '');
    var illegible = (raw.match(/\[\?\]/g) || []).length;
    var clean = raw.replace(/\[\?\]/g, ' ');
    var words = clean.trim().split(/\s+/).filter(Boolean).length;
    var total = words + illegible;
    return { clean: clean, illegible: illegible, readableWords: words, totalWords: total,
             readability: total ? Math.round(100 * words / total) : 0 };
  }

  // ---------- 4. Main: check one answer against one Key Card ----------
  function evaluate(card, text) {
    var ix = makeIndex(text);
    var wordCount = String(text || '').trim().split(/\s+/).filter(Boolean).length;
    var out = { cardId: card.id, max: card.marks, total: 0, items: [], leaks: [], warnings: [],
                traps: [], spellingFlags: [], matchedVariants: [], wordCount: wordCount };
    var positions = [];

    card.items.forEach(function (item) {
      var r = { id: item.id, label: item.label, max: item.marks, got: 0, status: 'missing',
                tip: item.tip || '', keys: item.keys || [], found: [], missingHints: [] };
      if (item.kind === 'pool') {
        var count = 0;
        item.points.forEach(function (pt) {
          var hit = findAny(ix, pt.any);
          if (hit) {
            count++; r.found.push(pt.label);
            out.matchedVariants.push(hit.variant);
            if (hit.spelling) out.spellingFlags.push({ itemId: item.id, wrote: hit.saw, expected: hit.variant });
          } else if (r.missingHints.length < 3) r.missingHints.push(pt.label);
        });
        r.got = Math.min(item.max, count * item.each);
        r.status = r.got >= item.max ? 'found' : r.got > 0 ? 'partial' : 'missing';
        r.counted = count; r.needed = Math.round(item.max / item.each);
      } else {
        var matched = 0, spell = false, firstPos = null;
        item.all.forEach(function (group) {
          var hit = findAny(ix, group);
          if (hit) {
            matched++; out.matchedVariants.push(hit.variant);
            if (firstPos === null || hit.pos < firstPos) firstPos = hit.pos;
            if (hit.spelling) { spell = true; out.spellingFlags.push({ itemId: item.id, wrote: hit.saw, expected: hit.variant }); }
          } else if (r.missingHints.length < 3) r.missingHints.push(group[0]);
        });
        var f = matched / item.all.length;
        if (f === 1) { r.got = item.marks; r.status = spell ? 'spelling' : 'found'; }
        else if (f >= 0.5 && item.marks >= 1) { r.got = half(item.marks * f); r.status = r.got > 0 ? 'partial' : 'missing'; }
        if (r.got > 0 && firstPos !== null) positions.push({ id: item.id, pos: firstPos });
      }
      out.total += r.got;
      if (r.got < r.max) out.leaks.push({ id: r.id, label: r.label, lost: +(r.max - r.got).toFixed(1), tip: r.tip, hints: r.missingHints });
      out.items.push(r);
    });

    out.total = half(out.total);
    out.leaks.sort(function (a, b) { return b.lost - a.lost; });

    // wrong-idea traps
    (card.traps || []).forEach(function (t) { var h = findAny(ix, t.any); if (h) out.traps.push(t.msg); });

    // warnings (no extra marks are taken away for these)
    if (wordCount < (card.minWords || 0))
      out.warnings.push('Very short answer. Examiners want full sentences, not only keywords.');
    if (out.spellingFlags.length)
      out.warnings.push('Check the spelling of key terms: ' + out.spellingFlags.map(function (s) { return '"' + s.wrote + '" should be "' + s.expected + '"'; }).join('; ') + '.');
    if (card.ordered && positions.length > 1) {
      var inOrder = positions.every(function (p, i) { return i === 0 || p.pos >= positions[i - 1].pos; });
      if (!inOrder) out.warnings.push('Your steps are out of order. Write them in the order of the solution.');
    }
    return out;
  }

  // ---------- 5. Best-effort highlighting of matched words inside the ORIGINAL text ----------
  function highlight(text, variants) {
    var html = String(text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
    var seen = {};
    variants.forEach(function (v) {
      var chunks = String(v).match(/[A-Za-z0-9\u00C0-\u024F\u03b1-\u03c9\u0391-\u03a9]+/g);
      if (!chunks || seen[v]) return; seen[v] = 1;
      var re = new RegExp(chunks.map(escRe).join('[^A-Za-z0-9]{0,3}'), 'ig');
      html = html.replace(re, function (m) { return '<mark class="kw">' + m + '</mark>'; });
    });
    return html;
  }

  var API = { norm: norm, toSpaced: toSpaced, evaluate: evaluate, prepareTranscript: prepareTranscript, highlight: highlight };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.Engine = API;
})(typeof window !== 'undefined' ? window : this);
