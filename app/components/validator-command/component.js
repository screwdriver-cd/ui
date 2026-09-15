import { computed } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
  classNameBindings: ['hasParseError', 'collapsible'],
  isOpen: true,
  collapsible: true,
  getBodyLabel: computed('command.{binary,docker,format,habitat}', {
    get() {
      const key = this.get('command.format');

      if (this.get(`command.${key}`)) return key;

      return '';
    }
  }),
  getBodyValue: computed('command.{binary,docker,habitat}', 'getBodyLabel', {
    get() {
      return this.get(`command.${this.getBodyLabel}`);
    }
  }),
  didInsertElement() {
    this._super(...arguments);

    if (!this.isOpen) {
      this.element
        .querySelectorAll('div')
        .forEach(el => el.classList.add('hidden'));
    }
  },
  actions: {
    nameClick() {
      this.toggleProperty('isOpen');
      this.element
        .querySelectorAll('div')
        .forEach(el => el.classList.toggle('hidden'));
    }
  }
});
