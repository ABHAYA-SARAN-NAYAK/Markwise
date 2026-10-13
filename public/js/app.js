/* StudentSphere - Main Application & Hash Router (PRD Section 4 & 10) */
(function () {
  'use strict';

  var state = {
    keycards: null,
    loading: true,
    error: null,
    currentEvaluation: null
  };

  async function loadData() {
    try {
      var res = await fetch('data/keycards.json');
      if (!res.ok) throw new Error('Failed to load keycards data: ' + res.status);
      state.keycards = await res.json();
      state.loading = false;
      window.keycardsData = state.keycards;
      route();
    } catch (err) {
      state.loading = false;
      state.error = err.message;
      var el = document.getElementById('view-content');
      if (el) {
        el.innerHTML = '<div class="glass-card"><p style="color:var(--bad)">Error: ' + err.message + '</p></div>';
      }
    }
  }

  function updateNavActive(hash) {
    var navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(function (a) {
      var href = a.getAttribute('href');
      if (href === hash) {
        a.classList.add('active');
      } else {
        a.classList.remove('active');
      }
    });
  }

  function route() {
    var contentEl = document.getElementById('view-content');
    if (!contentEl) return;
    if (state.loading) {
      contentEl.innerHTML = '<div class="glass-card shimmer" style="height:240px; border-radius:20px;"></div>';
      return;
    }

    var hash = window.location.hash || '#/';
    updateNavActive(hash);

    if (hash === '#/' || hash === '#' || hash === '') {
      Views.renderHome(contentEl, state);
    } else if (hash.startsWith('#/subject/')) {
      var subject = decodeURIComponent(hash.replace('#/subject/', ''));
      Views.renderSubject(contentEl, subject, state);
    } else if (hash.startsWith('#/q/')) {
      var qId = decodeURIComponent(hash.replace('#/q/', ''));
      Views.renderQuestion(contentEl, qId, state);
    } else if (hash === '#/result') {
      Views.renderResult(contentEl, state);
    } else if (hash === '#/read') {
      Views.renderRead(contentEl, state);
    } else if (hash === '#/how') {
      Views.renderHow(contentEl);
    } else if (hash === '#/bank') {
      Views.renderBank(contentEl, state);
    } else if (hash === '#/teacher') {
      Views.renderTeacher(contentEl, state);
    } else if (hash === '#/peer') {
      Views.renderPeer(contentEl, state);
    } else if (hash === '#/leaderboard') {
      Views.renderLeaderboard(contentEl, state);
    } else if (hash === '#/pattern') {
      Views.renderPattern(contentEl, state);
    } else {
      Views.renderHome(contentEl, state);
    }

    updateBoardSwitcher();

    // Scroll to top on route change
    window.scrollTo(0, 0);
  }

  function updateBoardSwitcher() {
    var currentBoard = window.Store ? Store.getBoard() : 'CBSE';
    var btns = document.querySelectorAll('.board-toggle-btn');
    btns.forEach(function (btn) {
      var b = btn.getAttribute('data-board');
      if (b === currentBoard) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });
  }

  // Board switch click listener (Top Bar & Home)
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.board-toggle-btn');
    if (btn) {
      var board = btn.getAttribute('data-board');
      if (board && window.Store) {
        Store.setBoard(board);
        updateBoardSwitcher();
        route();
      }
    }
  });

  // Kiosk Mode: 90 seconds idle timer (PRD Section 4.5, 9.5)
  var idleTimer = null;
  function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(function () {
      var currentHash = window.location.hash || '#/';
      if (currentHash === '#/result' || currentHash === '#/read' || currentHash.startsWith('#/q/')) {
        console.log('Kiosk idle (90s): resetting for next visitor.');
        if (window.Store) Store.setNick('');
        state.currentEvaluation = null;
        state.currentRead = null;
        window.location.hash = '#/';
      }
    }, 90000); // 90 seconds
  }

  ['mousemove', 'keydown', 'touchstart', 'click', 'scroll'].forEach(function (ev) {
    window.addEventListener(ev, resetIdleTimer, { passive: true });
  });

  // Next Visitor button reset handler
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('#btn-kiosk-reset');
    if (btn) {
      if (window.Store) Store.setNick('');
      state.currentEvaluation = null;
      state.currentRead = null;
      window.location.hash = '#/';
    }
  });

  window.addEventListener('hashchange', function () {
    resetIdleTimer();
    route();
  });
  window.addEventListener('DOMContentLoaded', function () {
    resetIdleTimer();
    loadData();
  });
})();
