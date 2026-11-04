const { API_BASE } = require('./constants');
const storage = require('./storage');

function request(path, opts) {
  opts = opts || {};
  const method = (opts.method || 'GET').toUpperCase();
  const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
  return new Promise((resolve) => {
    wx.request({
      url: API_BASE + path,
      method,
      header: headers,
      data: opts.body,
      timeout: opts.timeout || 12000,
      success(res) {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          data: res.data
        });
      },
      fail(err) {
        resolve({ ok: false, status: 0, error: err && err.errMsg, data: null });
      }
    });
  });
}

async function submitScore(quizId, row) {
  const body = {
    quizId,
    nick: (row.nick || '匿名').slice(0, 20),
    score: row.score | 0,
    pct: row.pct | 0,
    won: !!row.won,
    at: row.at || Date.now(),
    fp: storage.getPlayerFp()
  };
  const res = await request('/zhiji/score', { method: 'POST', body });
  if (!res.ok) return null;
  return res.data;
}

async function fetchBoard(quizId) {
  const res = await request('/zhiji/board?quizId=' + encodeURIComponent(quizId));
  if (!res.ok) return null;
  const data = res.data;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.board)) return data.board;
  return null;
}

async function registerOwner(quizId, ownerToken) {
  if (!quizId || !ownerToken) return null;
  return request('/zhiji/owner', {
    method: 'POST',
    body: { quizId, ownerToken }
  });
}

async function postHit(quizId, kind) {
  if (!quizId) return null;
  return request('/zhiji/hit', {
    method: 'POST',
    body: { quizId, kind: kind || 'open', fp: storage.getPlayerFp() }
  });
}

async function postMsg(quizId, kind, text, nick) {
  return request('/zhiji/msg', {
    method: 'POST',
    body: {
      quizId,
      kind,
      text,
      nick: nick || '',
      fp: storage.getPlayerFp()
    }
  });
}

async function fetchMsg(quizId, kind, ownerToken) {
  const headers = {};
  if (ownerToken) headers['X-Owner-Token'] = ownerToken;
  return request(
    '/zhiji/msg?quizId=' + encodeURIComponent(quizId) + '&kind=' + encodeURIComponent(kind),
    { headers }
  );
}

async function health() {
  return request('/health');
}

/**
 * GAP: Worker currently has no /zhiji/quiz (404). Short-id cloud store not available.
 * Keep stubs so call sites stay ready when Worker grows the route.
 */
async function fetchQuizRemote() {
  return null;
}
async function upsertQuizRemote() {
  return null;
}

module.exports = {
  request,
  submitScore,
  fetchBoard,
  registerOwner,
  postHit,
  postMsg,
  fetchMsg,
  health,
  fetchQuizRemote,
  upsertQuizRemote,
  API_BASE
};
