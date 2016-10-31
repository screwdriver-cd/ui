import Ember from 'ember';

export default Ember.Component.extend({
  tagName: 'span',
  classNames: ['build-bubble'],
  classNameBindings: ['build.id', 'small'],

  icon: Ember.computed('jobIsDisabled', 'build', {
    get() {
      if (this.get('jobIsDisabled')) {
        return 'pause';
      }

      const build = this.get('build');

      if (!build) {
        return '';
      }

      switch (build.get('status')) {
      case 'SUCCESS':
        return 'check';
      case 'FAILURE':
        return 'times';
      case 'ABORTED':
        return 'stop';
      case 'RUNNING':
        return 'fa-spinner fa-spin';
      case 'QUEUED':
        return 'clock-o';
      default:
        return 'question';
      }
    }
  }),

  linkTitle: Ember.computed('small', {
    get() {
      if (this.get('small')) {
        return this.get('jobName');
      }

      return this.get('build.sha');
    }
  }),

  mouseEnter() {
    Ember.$(`.${this.get('build.id')}`).addClass('highlight');
  },
  mouseLeave() {
    Ember.$('.build-bubble').removeClass('highlight');
  }
});
