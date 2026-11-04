const quiz = require('../../utils/quiz');
const storage = require('../../utils/storage');
const { LETTERS, Q_COUNT } = require('../../utils/constants');

Page({
  data: { draft: null, step: 0, slot: null, letters: LETTERS.split(''), progress: 0 },
  onShow() {
    let draft = storage.loadDraft() || quiz.defaultDraft();
    draft = quiz.ensureSlotSeeded(draft);
    storage.saveDraft(draft);
    this._apply(draft);
  },
  _apply(draft) {
    const step = quiz.clamp(draft.step | 0, 0, Q_COUNT - 1);
    draft.step = step;
    this.setData({
      draft,
      step,
      slot: draft.slots[step],
      progress: Math.round(((step + 1) / Q_COUNT) * 100)
    });
  },
  onPickAnswer(e) {
    const i = e.currentTarget.dataset.i | 0;
    const draft = this.data.draft;
    draft.slots[draft.step].answer = i;
    storage.saveDraft(draft);
    this._apply(draft);
  },
  onReroll() {
    const draft = this.data.draft;
    const idx = quiz.pickRandomUnused(draft, draft.step);
    if (idx == null) {
      wx.showToast({ title: '题库已用尽', icon: 'none' });
      return;
    }
    quiz.applyBankToSlot(draft, draft.step, idx);
    storage.saveDraft(draft);
    this._apply(draft);
  },
  onPrev() {
    const draft = this.data.draft;
    draft.step = Math.max(0, (draft.step | 0) - 1);
    quiz.ensureSlotSeeded(draft);
    storage.saveDraft(draft);
    this._apply(draft);
  },
  onNext() {
    const draft = this.data.draft;
    if (!draft.slots[draft.step] || !draft.slots[draft.step].filled) {
      wx.showToast({ title: '请先完成此题', icon: 'none' });
      return;
    }
    if ((draft.step | 0) >= Q_COUNT - 1) {
      storage.saveDraft(draft);
      wx.navigateTo({ url: '/pages/reward/reward' });
      return;
    }
    draft.step = (draft.step | 0) + 1;
    quiz.ensureSlotSeeded(draft);
    storage.saveDraft(draft);
    this._apply(draft);
  }
});
