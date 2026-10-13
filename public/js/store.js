/* StudentSphere - localStorage data store (PRD Section 11)
   Wraps every localStorage call in try/catch.
   Never saves photos or answer text - only numbers, IDs, and nicknames. */
(function (root) {
  'use strict';

  var memStore = {};
  var sessionAttempts = []; // in-memory list for this browser session

  function getItem(key, defaultVal) {
    try {
      var v = window.localStorage ? localStorage.getItem(key) : memStore[key];
      return v ? JSON.parse(v) : defaultVal;
    } catch (e) {
      return memStore[key] !== undefined ? memStore[key] : defaultVal;
    }
  }

  function setItem(key, val) {
    try {
      var s = JSON.stringify(val);
      if (window.localStorage) localStorage.setItem(key, s);
      memStore[key] = val;
    } catch (e) {
      memStore[key] = val;
    }
  }

  var Store = {
    getNick: function () {
      return getItem('ss.nick', '') || '';
    },
    setNick: function (nick) {
      setItem('ss.nick', String(nick || '').trim());
    },
    getAttempts: function () {
      return getItem('ss.attempts', []) || [];
    },
    saveAttempt: function (attempt) {
      sessionAttempts.push(attempt);
      var list = Store.getAttempts();
      list.push(attempt);
      if (list.length > 300) list = list.slice(list.length - 300);
      setItem('ss.attempts', list);
      return list;
    },
    getFirstAttemptForCardInSession: function (cardId) {
      for (var i = 0; i < sessionAttempts.length; i++) {
        if (sessionAttempts[i].cardId === cardId) {
          return sessionAttempts[i];
        }
      }
      return null;
    },
    getSessionAttemptsForCard: function (cardId) {
      return sessionAttempts.filter(function (a) { return a.cardId === cardId; });
    },
    getSuggestions: function () {
      return getItem('ss.suggestions', []) || [];
    },
    saveSuggestion: function (sugg) {
      var list = Store.getSuggestions();
      list.push(sugg);
      setItem('ss.suggestions', list);
      return list;
    },
    updateSuggestionStatus: function (id, status) {
      var list = Store.getSuggestions();
      var target = null;
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === id) {
          list[i].status = status;
          target = list[i];
          break;
        }
      }
      setItem('ss.suggestions', list);
      if (target && status === 'approved') {
        Store.addOverride(target.cardId, target.itemId, target.word);
      }
      return list;
    },
    getOverrides: function () {
      return getItem('ss.overrides', {}) || {};
    },
    setOverrides: function (map) {
      setItem('ss.overrides', map || {});
    },
    addOverride: function (cardId, itemId, word) {
      var overrides = Store.getOverrides();
      if (!overrides[cardId]) overrides[cardId] = {};
      if (!overrides[cardId][itemId]) overrides[cardId][itemId] = [];
      if (!overrides[cardId][itemId].includes(word)) {
        overrides[cardId][itemId].push(word);
      }
      Store.setOverrides(overrides);
      return overrides;
    },
    applyOverridesToCard: function (card) {
      var overrides = Store.getOverrides();
      var cardOverrides = overrides[card.id];
      if (!cardOverrides) return card;

      var clonedItems = card.items.map(function (item) {
        var extraWords = cardOverrides[item.id];
        if (!extraWords || !extraWords.length) return item;

        var clonedItem = Object.assign({}, item);
        if (clonedItem.kind === 'pool') {
          if (clonedItem.points && clonedItem.points.length) {
            clonedItem.points = clonedItem.points.map(function (pt, idx) {
              if (idx === 0) {
                return Object.assign({}, pt, { any: pt.any.concat(extraWords) });
              }
              return pt;
            });
          }
        } else if (clonedItem.all && clonedItem.all.length) {
          clonedItem.all = clonedItem.all.map(function (group, idx) {
            if (idx === 0) {
              return group.concat(extraWords);
            }
            return group;
          });
        }
        return clonedItem;
      });

      return Object.assign({}, card, { items: clonedItems });
    },
    isTeacherMode: function () {
      return !!memStore['teacherModeAuth'];
    },
    setTeacherMode: function (val) {
      memStore['teacherModeAuth'] = !!val;
    },
    clearAttempts: function () {
      sessionAttempts = [];
      setItem('ss.attempts', []);
    },
    getReadsCounter: function () {
      return getItem('ss.reads', { hourStart: Date.now(), count: 0 });
    },
    setReadsCounter: function (data) {
      setItem('ss.reads', data);
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Store;
  else root.Store = Store;
})(typeof window !== 'undefined' ? window : this);
