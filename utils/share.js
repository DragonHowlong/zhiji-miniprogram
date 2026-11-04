const { encodeQuiz, decodeQuiz } = require('./quiz');
const { H5_ORIGIN } = require('./constants');

/** WeChat native share path — quiz body in q=; never include ownerToken */
function playPathFromQuiz(quiz) {
  const payload = encodeQuiz(quiz);
  // pages/play/play?q=...
  return '/pages/play/play?q=' + payload;
}

function playPathFromPayload(payload) {
  return '/pages/play/play?q=' + payload;
}

function inviteShareConfig(quiz) {
  const name = (quiz && (quiz.name || quiz.title)) || '我';
  return {
    title: '来测测你有多懂我～「' + String(name).slice(0, 16) + '」的默契测试',
    path: playPathFromQuiz(quiz)
    // imageUrl optional — 需问 Bot小艺 for brand asset
  };
}

function resultShareConfig(quiz, result, nick) {
  const pct = (result && result.pct) | 0;
  const owner = (quiz && (quiz.name || 'TA')) || 'TA';
  return {
    title: '我和 ' + owner + ' 默契 ' + pct + '%，你呢？',
    path: playPathFromQuiz(quiz) + '&r=' + encodeURIComponent(pct + '.' + String(nick || '').trim().slice(0, 12))
  };
}

/** Short clipboard text for manual paste (H5-compatible short line; mini uses native share primarily) */
function inviteClipboard(quiz) {
  return '来测测你有多懂我～\n打开小程序「默契测试」或 H5：' + H5_ORIGIN + '?s=' + encodeURIComponent(quiz.id);
}

function parseLaunchQuery(query) {
  query = query || {};
  let q = query.q || '';
  // scene may carry q= for QR
  if (!q && query.scene) {
    try {
      const scene = decodeURIComponent(String(query.scene));
      const m = /(?:^|&)q=([^&]+)/.exec(scene) || /^q=(.+)$/.exec(scene);
      if (m) q = m[1];
      else if (scene.length > 20) q = scene;
    } catch (e) {}
  }
  const quiz = q ? decodeQuiz(q) : null;
  return {
    quiz,
    payload: q || '',
    sharedResult: query.r || ''
  };
}

module.exports = {
  playPathFromQuiz,
  playPathFromPayload,
  inviteShareConfig,
  resultShareConfig,
  inviteClipboard,
  parseLaunchQuery,
  encodeQuiz,
  decodeQuiz
};
