const { BANK, TEMPLATES } = require('./bank');
const LZString = require('./lz-string');
const {
  Q_COUNT,
  DEFAULT_BANDS,
  THEME_IDS
} = require('./constants');
const storage = require('./storage');

function normalizeTheme(t) {
  t = String(t || 'cute');
  return THEME_IDS.indexOf(t) >= 0 ? t : 'cute';
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function emptySlots() {
  return Array.from({ length: Q_COUNT }, () => ({
    q: '',
    options: ['', '', ''],
    answer: 0,
    filled: false
  }));
}

function defaultDraft() {
  return {
    id: storage.uid(),
    name: '',
    title: '',
    theme: 'cute',
    slots: emptySlots(),
    step: 0,
    reward: '奶茶券',
    rewardCustom: '',
    rewardIsCustom: false,
    threshold: 9,
    inventory: null,
    bands: DEFAULT_BANDS.map((b) => Object.assign({}, b))
  };
}

function findBankIdx(question) {
  if (!question) return -1;
  if (
    typeof question.bankIdx === 'number' &&
    BANK[question.bankIdx] &&
    BANK[question.bankIdx].q === question.q
  ) {
    return question.bankIdx;
  }
  const q = question.q;
  const opts = question.options || question.o || [];
  for (let i = 0; i < BANK.length; i++) {
    const b = BANK[i];
    if (b.q !== q) continue;
    if (b.options.length !== opts.length) continue;
    let ok = true;
    for (let j = 0; j < opts.length; j++) {
      if (b.options[j] !== opts[j]) {
        ok = false;
        break;
      }
    }
    if (ok) return i;
  }
  return -1;
}

function compactQuestion(x) {
  const bi = findBankIdx(x);
  if (bi >= 0) return { b: bi, a: x.answer | 0 };
  return { q: x.q, o: x.options || x.o, a: x.answer | 0 };
}

function expandQuestion(x) {
  if (x && typeof x.b === 'number') {
    const b = BANK[x.b];
    if (!b) throw new Error('bad bank idx');
    return { q: b.q, options: b.options.slice(), answer: x.a | 0, bankIdx: x.b };
  }
  return { q: x.q, options: x.o || x.options || [], answer: x.a | 0 };
}

function toBase64Url(str) {
  // Prefer Buffer in Node self-test; wx has no Buffer — use encodeURIComponent trick
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
  const utf8 = unescape(encodeURIComponent(str));
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  for (let i = 0; i < utf8.length; i += 3) {
    const c1 = utf8.charCodeAt(i);
    const c2 = i + 1 < utf8.length ? utf8.charCodeAt(i + 1) : NaN;
    const c3 = i + 2 < utf8.length ? utf8.charCodeAt(i + 2) : NaN;
    const e1 = c1 >> 2;
    const e2 = ((c1 & 3) << 4) | (isNaN(c2) ? 0 : c2 >> 4);
    const e3 = isNaN(c2) ? 64 : (((c2 & 15) << 2) | (isNaN(c3) ? 0 : c3 >> 6));
    const e4 = isNaN(c3) ? 64 : c3 & 63;
    out += chars.charAt(e1) + chars.charAt(e2) + (e3 === 64 ? '=' : chars.charAt(e3)) + (e4 === 64 ? '=' : chars.charAt(e4));
  }
  return out.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s) {
  s = String(s || '').replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(s, 'base64').toString('utf8');
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = '';
  for (let i = 0; i < s.length; i += 4) {
    const e1 = chars.indexOf(s.charAt(i));
    const e2 = chars.indexOf(s.charAt(i + 1));
    const e3 = chars.indexOf(s.charAt(i + 2));
    const e4 = chars.indexOf(s.charAt(i + 3));
    const c1 = (e1 << 2) | (e2 >> 4);
    const c2 = ((e2 & 15) << 4) | (e3 >> 2);
    const c3 = ((e3 & 3) << 6) | e4;
    str += String.fromCharCode(c1);
    if (e3 !== 64) str += String.fromCharCode(c2);
    if (e4 !== 64) str += String.fromCharCode(c3);
  }
  try {
    return decodeURIComponent(escape(str));
  } catch (e) {
    return str;
  }
}

function lzCompressB64Url(str) {
  try {
    const z = LZString.compressToBase64(str);
    if (!z) return null;
    return z.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    return null;
  }
}

function lzDecompressB64Url(s) {
  try {
    let t = String(s || '').replace(/-/g, '+').replace(/_/g, '/');
    while (t.length % 4) t += '=';
    return LZString.decompressFromBase64(t);
  } catch (e) {
    return null;
  }
}

function encodeQuiz(quiz) {
  // ownerToken NEVER packed into share payload
  const compact = {
    i: quiz.id,
    t: quiz.title || '',
    r: quiz.reward || '',
    th: quiz.threshold | 0,
    tm: normalizeTheme(quiz.theme),
    b: (quiz.bands || []).map((x) => ({ m: x.min, x: x.max, t: x.text })),
    q: (quiz.questions || []).map(compactQuestion)
  };
  if (quiz.name) compact.n = quiz.name;
  if (quiz.inventory != null) compact.inv = quiz.inventory;
  const raw = JSON.stringify(compact);
  const plain = toBase64Url(raw);
  const z = lzCompressB64Url(raw);
  if (z && z.length + 2 < plain.length) return 'z.' + z;
  return plain;
}

function normalizePayload(payload) {
  let s = String(payload || '');
  s = s.replace(/[\s\u200b\ufeff]+/g, '');
  try {
    s = decodeURIComponent(s);
  } catch (e) {}
  s = s.replace(/[\s\u200b\ufeff]+/g, '');
  return s;
}

function decodeQuiz(payload) {
  try {
    const s = normalizePayload(payload);
    if (!s) return null;
    let jsonStr = null;
    if (/^z\./i.test(s)) {
      jsonStr = lzDecompressB64Url(s.slice(2));
      if (!jsonStr) {
        try {
          jsonStr = fromBase64Url(s.slice(2));
        } catch (e) {}
      }
    } else {
      try {
        jsonStr = fromBase64Url(s);
      } catch (e) {}
      if (jsonStr) {
        try {
          JSON.parse(jsonStr);
        } catch (e) {
          const ztry = lzDecompressB64Url(s);
          if (ztry) jsonStr = ztry;
        }
      } else {
        jsonStr = lzDecompressB64Url(s);
      }
    }
    if (!jsonStr) return null;
    const c = JSON.parse(jsonStr);
    if (!c || !Array.isArray(c.q) || c.q.length !== Q_COUNT) return null;
    const questions = c.q.map(expandQuestion);
    return {
      id: c.i || storage.uid(),
      name: c.n || '',
      title: c.t || (c.n || '神秘人') + '的默契测试卷',
      reward: c.r || '神秘奖励',
      threshold: typeof c.th === 'number' ? c.th : 9,
      theme: normalizeTheme(c.tm),
      inventory: c.inv == null ? null : c.inv,
      bands: (c.b || []).map((x) => ({ min: x.m, max: x.x, text: x.t })),
      questions
    };
  } catch (e) {
    return null;
  }
}

function bandFor(score, bands) {
  const list = bands && bands.length ? bands : DEFAULT_BANDS;
  let best = list[0];
  for (let i = 0; i < list.length; i++) {
    const b = list[i];
    if (score >= b.min && score <= b.max) best = b;
  }
  return best;
}

function applyBankToSlot(draft, step, bankIdx) {
  const b = BANK[bankIdx];
  if (!b || !draft || !draft.slots[step]) return draft;
  draft.slots[step] = {
    q: b.q,
    options: b.options.slice(),
    answer: typeof b.answer === 'number' ? b.answer : 0,
    filled: true,
    bankIdx
  };
  return draft;
}

function usedBankIdxSet(draft, exceptStep) {
  const used = {};
  (draft.slots || []).forEach((s, i) => {
    if (i === exceptStep) return;
    if (s && typeof s.bankIdx === 'number') used[s.bankIdx] = true;
  });
  return used;
}

function pickRandomUnused(draft, step) {
  const used = usedBankIdxSet(draft, step);
  const pool = [];
  for (let i = 0; i < BANK.length; i++) if (!used[i]) pool.push(i);
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function ensureSlotSeeded(draft) {
  if (!draft) return draft;
  const i = clamp(draft.step | 0, 0, Q_COUNT - 1);
  const slot = draft.slots[i];
  if (!slot || slot.filled) return draft;
  const idx = pickRandomUnused(draft, i);
  if (idx != null) applyBankToSlot(draft, i, idx);
  return draft;
}

function seedAllSlots(draft) {
  if (!draft) return draft;
  for (let i = 0; i < Q_COUNT; i++) {
    draft.step = i;
    const slot = draft.slots[i];
    if (!slot || !slot.filled) {
      const idx = pickRandomUnused(draft, i);
      if (idx != null) applyBankToSlot(draft, i, idx);
    }
  }
  draft.step = 0;
  return draft;
}

function applyTemplate(draft, templateId) {
  const t = TEMPLATES.find((x) => x.id === templateId);
  if (!t) return draft;
  draft = draft || defaultDraft();
  draft.title = t.titleHint || t.name;
  draft.name = t.nameHint || '';
  draft.reward = t.reward || draft.reward;
  draft.slots = t.questions.map((q) => {
    const bi = findBankIdx(q);
    return {
      q: q.q,
      options: q.options.slice(),
      answer: q.answer | 0,
      filled: true,
      bankIdx: bi >= 0 ? bi : undefined
    };
  });
  while (draft.slots.length < Q_COUNT) {
    draft.slots.push({ q: '', options: ['', '', ''], answer: 0, filled: false });
  }
  draft.step = 0;
  return draft;
}

function publishFromDraft(draft) {
  const name = (draft.name || '').trim() || '神秘人';
  let reward = (draft.reward || '').trim();
  if (!reward && draft.rewardIsCustom) reward = (draft.rewardCustom || '').trim();
  if (!reward) reward = '神秘奖励';
  const quiz = {
    id: draft.id || storage.uid(),
    name,
    title: (draft.title && String(draft.title).trim()) || name + '的默契测试卷',
    reward,
    threshold: clamp(draft.threshold | 0, 1, 10),
    theme: normalizeTheme(draft.theme),
    inventory:
      draft.inventory == null || draft.inventory === ''
        ? null
        : Math.max(0, +draft.inventory || 0),
    bands: (draft.bands || DEFAULT_BANDS).map((b) => ({
      min: +b.min || 0,
      max: +b.max || 0,
      text: String(b.text || '')
    })),
    questions: draft.slots.map((s) => {
      const qq = { q: s.q, options: s.options.slice(), answer: s.answer | 0 };
      if (typeof s.bankIdx === 'number') qq.bankIdx = s.bankIdx;
      else {
        const bi = findBankIdx(s);
        if (bi >= 0) qq.bankIdx = bi;
      }
      return qq;
    }),
    ownerToken: storage.genOwnerToken()
  };
  return quiz;
}

function scoreAnswers(quiz, answers) {
  let score = 0;
  for (let i = 0; i < Q_COUNT; i++) {
    if (answers[i] === quiz.questions[i].answer) score++;
  }
  const pct = Math.round((score / Q_COUNT) * 100);
  const band = bandFor(score, quiz.bands);
  const won = score >= (quiz.threshold | 0);
  return { score, pct, band, won };
}

function bankCategories() {
  const set = {};
  BANK.forEach((b) => {
    if (b.cat) set[b.cat] = true;
  });
  return ['全部'].concat(Object.keys(set));
}

function filterBank(cat, keyword) {
  const kw = String(keyword || '').trim();
  return BANK.map((b, idx) => Object.assign({ idx }, b)).filter((b) => {
    if (cat && cat !== '全部' && b.cat !== cat) return false;
    if (kw && b.q.indexOf(kw) < 0) return false;
    return true;
  });
}

module.exports = {
  BANK,
  TEMPLATES,
  normalizeTheme,
  clamp,
  emptySlots,
  defaultDraft,
  findBankIdx,
  encodeQuiz,
  decodeQuiz,
  bandFor,
  applyBankToSlot,
  pickRandomUnused,
  ensureSlotSeeded,
  seedAllSlots,
  applyTemplate,
  publishFromDraft,
  scoreAnswers,
  bankCategories,
  filterBank
};
