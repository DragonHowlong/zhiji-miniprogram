const {
  STORAGE_DRAFT,
  STORAGE_PUB,
  STORAGE_STATS,
  STORAGE_NICK,
  STORAGE_FP
} = require('./constants');

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function get(key, fallback) {
  try {
    const v = wx.getStorageSync(key);
    if (v === '' || v === undefined || v === null) return fallback;
    return v;
  } catch (e) {
    return fallback;
  }
}

function set(key, val) {
  try {
    wx.setStorageSync(key, val);
  } catch (e) {}
}

function getPlayerFp() {
  let fp = get(STORAGE_FP, '');
  if (!fp) {
    fp = 'fp_' + uid();
    set(STORAGE_FP, fp);
  }
  return fp;
}

function loadNick() {
  return String(get(STORAGE_NICK, '') || '');
}

function saveNick(nick) {
  const n = String(nick || '').trim().slice(0, 12);
  if (!n) return '';
  set(STORAGE_NICK, n);
  return n;
}

function loadDraft() {
  return get(STORAGE_DRAFT, null);
}

function saveDraft(draft) {
  set(STORAGE_DRAFT, draft);
}

function loadPublished() {
  return get(STORAGE_PUB, null);
}

function savePublished(quiz) {
  set(STORAGE_PUB, quiz);
}

function getStats(qid) {
  const all = get(STORAGE_STATS, {}) || {};
  return all[qid] || { plays: 0, wins: 0, board: [] };
}

function setStats(qid, stats) {
  const all = get(STORAGE_STATS, {}) || {};
  all[qid] = stats;
  set(STORAGE_STATS, all);
}

function playedKey(qid) {
  return 'zhiji-played-' + String(qid || '');
}

function getPlayedRecord(qid) {
  if (!qid) return null;
  try {
    const o = get(playedKey(qid), null);
    return o && (o.done || o.started) ? o : null;
  } catch (e) {
    return null;
  }
}

function hasFinishedPlayed(qid) {
  const o = getPlayedRecord(qid);
  return !!(o && o.done);
}

function markQuizPlayed(qid, result, quiz) {
  if (!qid) return;
  const rec = {
    done: true,
    at: Date.now(),
    nick: loadNick() || '',
    fp: getPlayerFp(),
    score: (result && result.score) | 0,
    pct: (result && result.pct) | 0,
    won: !!(result && result.won),
    bandText: (result && result.band && result.band.text) || '',
    threshold: quiz ? quiz.threshold | 0 : 0,
    reward: quiz ? quiz.reward : '',
    title: quiz ? quiz.title : ''
  };
  set(playedKey(qid), rec);
}

function genOwnerToken() {
  try {
    const a = new Uint8Array(24);
    // wx env may not have crypto.getRandomValues; fallback
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(a);
      return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {}
  let s = '';
  for (let i = 0; i < 48; i++) s += Math.floor(Math.random() * 16).toString(16);
  return s;
}

module.exports = {
  uid,
  get,
  set,
  getPlayerFp,
  loadNick,
  saveNick,
  loadDraft,
  saveDraft,
  loadPublished,
  savePublished,
  getStats,
  setStats,
  getPlayedRecord,
  hasFinishedPlayed,
  markQuizPlayed,
  genOwnerToken
};
