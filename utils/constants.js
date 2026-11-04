/** Product constants — copy placeholders; brand polish: 需问 Bot小艺 */
const Q_COUNT = 10;
const LETTERS = 'ABCDEF';
const STORAGE_DRAFT = 'moqi-draft-v3';
const STORAGE_PUB = 'moqi-published-v2';
const STORAGE_STATS = 'moqi-stats-v2';
const STORAGE_NICK = 'zhiji-player-nick';
const STORAGE_FP = 'zhiji-player-fp';
const REWARD_PRESETS = ['奶茶券', '红包券', '请客吃饭', '电影票', '一个拥抱'];
const THRESH_PRESETS = [7, 8, 9, 10];
const DEFAULT_BANDS = [
  { min: 0, max: 3, text: '默契值告急！看来我们还需要多了解彼此呢～' },
  { min: 4, max: 6, text: '有点懂我，但还有不少盲区哦，继续加油！' },
  { min: 7, max: 8, text: '不错嘛！你真的有在认真观察我～' },
  { min: 9, max: 10, text: '默契爆棚！！你也太懂我了吧，奖励安排上！' }
];
const THEME_IDS = ['cute', 'mono', 'dark'];
const THEME_META = [
  { id: 'cute', label: '明亮可爱' },
  { id: 'mono', label: '极简黑白' },
  { id: 'dark', label: '暗黑模式' }
];
/** Live Worker only — never put secrets / admin tokens here */
const API_BASE = 'https://zhiji-board.wanghowlonggg.workers.dev';
const H5_ORIGIN = 'https://dragonhowlong.github.io/zhiji/';

module.exports = {
  Q_COUNT,
  LETTERS,
  STORAGE_DRAFT,
  STORAGE_PUB,
  STORAGE_STATS,
  STORAGE_NICK,
  STORAGE_FP,
  REWARD_PRESETS,
  THRESH_PRESETS,
  DEFAULT_BANDS,
  THEME_IDS,
  THEME_META,
  API_BASE,
  H5_ORIGIN
};
