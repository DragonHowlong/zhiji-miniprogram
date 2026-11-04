const storage = require('../../utils/storage');
const api = require('../../utils/api');
const share = require('../../utils/share');

/** 匿名信/悄悄话入口：默认关闭（个人主体过审更稳）。打开前需问用户/Bot小网。 */
const SHOW_INBOX = false;

Page({
  data: { quiz: null, board: [], boardHint: '', showInbox: SHOW_INBOX },
  onShow() {
    const quiz = storage.loadPublished();
    getApp().globalData.published = quiz;
    this.setData({ quiz });
    if (quiz) this.loadBoard(quiz.id);
  },
  async loadBoard(quizId) {
    const remote = await api.fetchBoard(quizId);
    if (remote === null) {
      const local = (storage.getStats(quizId).board || []).slice(0, 20);
      this.setData({
        board: local,
        boardHint: '远程榜读取失败（常见：未配 request 合法域名）。暂显示本机记录。'
      });
      return;
    }
    this.setData({ board: remote.slice(0, 20), boardHint: '' });
  },
  onRefreshBoard() {
    if (this.data.quiz) this.loadBoard(this.data.quiz.id);
  },
  onCopy() {
    const text = share.inviteClipboard(this.data.quiz);
    wx.setClipboardData({ data: text });
  },
  onPreview() {
    const quiz = this.data.quiz;
    if (!quiz) return;
    getApp().globalData.playQuiz = quiz;
    getApp().globalData.fromShare = false;
    getApp().globalData.playIdx = 0;
    getApp().globalData.playAnswers = [];
    getApp().globalData.result = null;
    wx.navigateTo({ url: '/pages/play/play?preview=1' });
  },
  onNew() {
    wx.reLaunch({ url: '/pages/index/index' });
  },
  onShareAppMessage() {
    return share.inviteShareConfig(this.data.quiz || storage.loadPublished());
  }
});
