import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['info-message'],
  classNameBindings: ['hasMessage:enabled:disabled', 'type'],
  icon: 'fa-info',
  type: 'info',
  hasMessage: Ember.computed('message', {
    get() {
      return this.get('message').length > 0;
    }
  })
});
