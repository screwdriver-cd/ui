import Component from '@ember/component';
import { get, computed } from '@ember/object';
import { equal } from '@ember/object/computed';

export default Component.extend({
  classNames: 'workflow-tooltip',
  classNameBindings: ['showTooltip', 'left'],
  showTooltip: false,
  showToggleModal: false,
  left: equal('showTooltipPosition', 'left'),

  didUpdateAttrs() {
    this._super(...arguments);

    const event = get(this, 'tooltipData.mouseevent');
    const el = this.element;

    // setting tooltip position
    if (el && event) {
      const top = event.layerY + get(this, 'tooltipData.sizes.ICON_SIZE');

      const left = this.left
        ? event.layerX - 20
        : event.layerX - el.offsetWidth / 2;

      el.style.top = `${top}px`;
      el.style.left = `${left}px`;
    }
  },
  jobState: computed('tooltipData.job.isDisabled', function jobState() {
    const isDisabled = get(this, 'tooltipData.job.isDisabled');

    return isDisabled ? 'ENABLED' : 'DISABLED';
  }),
  actions: {
    toggleJob(toggleJobName) {
      const state = this.jobState;

      const originalJob = this.get('pipeline.jobs').find(
        j => j.name === toggleJobName
      );

      this.set('toggleJobName', toggleJobName);
      this.set(
        'stateChange',
        state[0].toUpperCase() + state.slice(1, -1).toLowerCase()
      );

      this.set('originalJobId', originalJob.id);
      this.set('showToggleModal', true);
    },
    updateMessage(message) {
      const { originalJobId, jobState } = this;

      this.setJobState(originalJobId, jobState, message || ' ');
      this.set('showToggleModal', false);
      this.set('showTooltip', false);
    }
  }
});
