const quiz = require('../../utils/quiz');
const storage = require('../../utils/storage');
const api = require('../../utils/api');
const { REWARD_PRESETS, THRESH_PRESETS } = require('../../utils/constants');

Page({
  data: {
    name: '',
    title: '',
    reward: '奶茶券',
    rewardCustom: '',
    threshold: 9,
    rewards: REWARD_PRESETS,
    thresh: THRESH_PRESETS,
    publishing: false
  },
  onShow() {
    const draft = storage.loadDraft() || quiz.defaultDraft();
    this.draft = draft;
    this.setData({
      name: draft.name || '',
      title: draft.title || '',
      reward: draft.reward || '奶茶券',
      rewardCustom: draft.rewardCustom || '',
      threshold: draft.threshold || 9
    });
  },
  onName(e) { this.setData({ name: e.detail.value }); },
  onTitle(e) { this.setData({ title: e.detail.value }); },
  onReward(e) {
    this.setData({ reward: e.currentTarget.dataset.v, rewardCustom: '' });
  },
  onRewardCustom(e) {
    this.setData({ rewardCustom: e.detail.value, reward: '' });
  },
  onThresh(e) { this.setData({ threshold: e.currentTarget.dataset.v | 0 }); },
  async onPublish() {
    if (this.data.publishing) return;
    const draft = this.draft || storage.loadDraft();
    if (!draft || !(draft.slots || []).every((s) => s && s.filled)) {
      wx.showToast({ title: '题目未完成', icon: 'none' });
      return;
    }
    draft.name = this.data.name;
    draft.title = this.data.title;
    draft.reward = this.data.rewardCustom.trim() || this.data.reward || '神秘奖励';
    draft.rewardCustom = this.data.rewardCustom;
    draft.rewardIsCustom = !!this.data.rewardCustom.trim();
    draft.threshold = this.data.threshold;
    storage.saveDraft(draft);

    this.setData({ publishing: true });
    const published = quiz.publishFromDraft(draft);
    storage.savePublished(published);
    getApp().globalData.published = published;
    // register owner hash on Worker (token stays on-device only)
    api.registerOwner(published.id, published.ownerToken);
    api.postHit(published.id, 'publish');
    // GAP: upsertQuizRemote not available on live Worker
    api.upsertQuizRemote(published);
    // clear draft
    const fresh = quiz.defaultDraft();
    fresh.theme = published.theme;
    storage.saveDraft(fresh);
    this.setData({ publishing: false });
    wx.redirectTo({ url: '/pages/manage/manage' });
  }
});
