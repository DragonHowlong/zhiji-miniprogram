const storage = require('./utils/storage');
const api = require('./utils/api');

App({
  globalData: {
    published: null,
    playQuiz: null,
    playAnswers: [],
    playIdx: 0,
    playNick: '',
    result: null,
    lastRemoteBoard: null,
    sharedBanner: '',
    fromShare: false
  },
  onLaunch(options) {
    storage.getPlayerFp();
    const nick = storage.loadNick();
    if (nick) this.globalData.playNick = nick;
    const pub = storage.loadPublished();
    if (pub) this.globalData.published = pub;
    // best-effort health (non-blocking)
    api.health().then((r) => {
      this.globalData.apiOk = !!(r && r.ok);
    });
    this._launchOptions = options || {};
  },
  onShow() {}
});
