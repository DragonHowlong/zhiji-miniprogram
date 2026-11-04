const shareUtil = require('../../utils/share');
const storage = require('../../utils/storage');
const api = require('../../utils/api');
const quizUtil = require('../../utils/quiz');
const { LETTERS, Q_COUNT } = require('../../utils/constants');

Page({
  data: {
    phase: 'intro',
    quiz: null,
    nick: '',
    idx: 0,
    question: null,
    picked: -1,
    progress: 0,
    letters: LETTERS.split(''),
    sharedBanner: '',
    preview: false
  },
  onLoad(query) {
    const app = getApp();
    this.answers = [];
    let quiz = null;
    let sharedBanner = '';
    const parsed = shareUtil.parseLaunchQuery(query || {});
    if (parsed.quiz) {
      quiz = parsed.quiz;
      app.globalData.fromShare = true;
      if (parsed.sharedResult) {
        const parts = String(parsed.sharedResult).split('.');
        const pct = parts[0];
        const who = parts.slice(1).join('.') || '有人';
        sharedBanner = who + ' 测出默契 ' + pct + '%，轮到你了';
      }
    } else if (query && query.preview === '1' && app.globalData.playQuiz) {
      quiz = app.globalData.playQuiz;
      app.globalData.fromShare = false;
      this.setData({ preview: true });
    } else if (app.globalData.playQuiz) {
      quiz = app.globalData.playQuiz;
    }

    if (!quiz) {
      this.setData({ phase: 'empty', quiz: null });
      return;
    }
    app.globalData.playQuiz = quiz;
    // strip ownerToken if somehow present in decoded object (decode never includes it)
    if (quiz.ownerToken) delete quiz.ownerToken;

    this.setData({
      quiz,
      nick: storage.loadNick() || app.globalData.playNick || '',
      sharedBanner,
      phase: 'intro'
    });
    if (app.globalData.fromShare) api.postHit(quiz.id, 'open');
  },
  onNick(e) { this.setData({ nick: e.detail.value }); },
  onBegin() {
    const nick = storage.saveNick(this.data.nick) || this.data.nick || '匿名';
    getApp().globalData.playNick = nick;
    this.answers = [];
    this.setData({ nick, phase: 'play', idx: 0, picked: -1 });
    this._paintQ();
    if (getApp().globalData.fromShare) api.postHit(this.data.quiz.id, 'play');
  },
  _paintQ() {
    const idx = this.data.idx;
    const q = this.data.quiz.questions[idx];
    this.setData({
      question: q,
      picked: this.answers[idx] == null ? -1 : this.answers[idx],
      progress: Math.round((idx / Q_COUNT) * 100)
    });
  },
  onPick(e) {
    const i = e.currentTarget.dataset.i | 0;
    this.answers[this.data.idx] = i;
    this.setData({ picked: i });
    // auto advance
    setTimeout(() => this._next(), 180);
  },
  _next() {
    if (this.data.idx >= Q_COUNT - 1) {
      this._finish();
      return;
    }
    this.setData({ idx: this.data.idx + 1 });
    this._paintQ();
  },
  async _finish() {
    const quiz = this.data.quiz;
    const result = quizUtil.scoreAnswers(quiz, this.answers);
    const app = getApp();
    app.globalData.result = result;
    app.globalData.playAnswers = this.answers.slice();

    const fromShare = !!app.globalData.fromShare;
    const firstTime = !(fromShare && storage.hasFinishedPlayed(quiz.id));
    result.firstTime = firstTime;

    if (firstTime) {
      const st = storage.getStats(quiz.id);
      st.plays = (st.plays | 0) + 1;
      if (result.won) st.wins = (st.wins | 0) + 1;
      st.board = st.board || [];
      st.board.push({
        nick: this.data.nick || '匿名',
        score: result.score,
        pct: result.pct,
        at: Date.now(),
        won: result.won
      });
      st.board.sort((a, b) => b.score - a.score || b.at - a.at);
      st.board = st.board.slice(0, 50);
      storage.setStats(quiz.id, st);

      const remote = await api.submitScore(quiz.id, {
        nick: this.data.nick || '匿名',
        score: result.score,
        pct: result.pct,
        won: result.won,
        at: Date.now()
      });
      if (remote && Array.isArray(remote.board)) {
        app.globalData.lastRemoteBoard = { quizId: quiz.id, board: remote.board };
      }
    }

    if (fromShare && firstTime) {
      storage.markQuizPlayed(quiz.id, result, quiz);
    }

    wx.redirectTo({ url: '/pages/result/result' });
  },
  goHome() {
    wx.reLaunch({ url: '/pages/index/index' });
  },
  onShareAppMessage() {
    if (this.data.quiz) return shareUtil.inviteShareConfig(this.data.quiz);
    return { title: '默契测试', path: '/pages/index/index' };
  }
});
