const quiz = require('../../utils/quiz');
const storage = require('../../utils/storage');

Page({
  data: {
    templates: quiz.TEMPLATES.map((t) => ({ id: t.id, name: t.name, emoji: t.emoji })),
    hasPublished: false
  },
  onShow() {
    const pub = storage.loadPublished();
    getApp().globalData.published = pub;
    this.setData({ hasPublished: !!pub });
  },
  onStart() {
    const draft = quiz.defaultDraft();
    quiz.seedAllSlots(draft);
    storage.saveDraft(draft);
    wx.navigateTo({ url: '/pages/create/create' });
  },
  onTemplate(e) {
    const id = e.currentTarget.dataset.id;
    let draft = quiz.defaultDraft();
    draft = quiz.applyTemplate(draft, id);
    storage.saveDraft(draft);
    wx.navigateTo({ url: '/pages/create/create' });
  },
  onManage() {
    wx.navigateTo({ url: '/pages/manage/manage' });
  },
  onShareAppMessage() {
    const pub = storage.loadPublished();
    if (pub) {
      const share = require('../../utils/share');
      return share.inviteShareConfig(pub);
    }
    return {
      title: '默契测试 · 自测/投票式问卷工具',
      path: '/pages/index/index'
    };
  }
});
