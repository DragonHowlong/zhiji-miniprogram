const api = require('../../utils/api');
const storage = require('../../utils/storage');
const shareUtil = require('../../utils/share');

Page({
  data: { quiz: null, result: null, board: [], boardHint: '' },
  onShow() {
    const app = getApp();
    const quiz = app.globalData.playQuiz;
    const result = app.globalData.result;
    this.setData({ quiz, result });
    if (quiz) this.hydrateBoard(quiz.id);
  },
  async hydrateBoard(quizId) {
    const app = getApp();
    if (
      app.globalData.lastRemoteBoard &&
      app.globalData.lastRemoteBoard.quizId === quizId &&
      Array.isArray(app.globalData.lastRemoteBoard.board)
    ) {
      this.setData({ board: app.globalData.lastRemoteBoard.board.slice(0, 20), boardHint: '' });
      return;
    }
    const remote = await api.fetchBoard(quizId);
    if (remote === null) {
      const local = (storage.getStats(quizId).board || []).slice(0, 20);
      this.setData({
        board: local,
        boardHint: '远程榜暂不可用（检查合法域名）。显示本机记录。'
      });
      return;
    }
    this.setData({ board: remote.slice(0, 20), boardHint: '' });
  },
  onCreateOwn() {
    wx.reLaunch({ url: '/pages/index/index' });
  },
  onRetry() {
    const app = getApp();
    app.globalData.result = null;
    app.globalData.playAnswers = [];
    app.globalData.playIdx = 0;
    // 可再答；榜只记首次（Worker first-only + 本机 played 标记）
    wx.redirectTo({
      url: '/pages/play/play' + (app.globalData.fromShare ? '' : '?preview=1')
    });
  },
  goHome() {
    wx.reLaunch({ url: '/pages/index/index' });
  },
  onShareAppMessage() {
    const app = getApp();
    return shareUtil.resultShareConfig(
      this.data.quiz || app.globalData.playQuiz,
      this.data.result || app.globalData.result,
      app.globalData.playNick || storage.loadNick()
    );
  }
});
