import Component from '@ember/component';
import { computed, get } from '@ember/object';

export default Component.extend({
  tagName: 'tr',
  classNameBindings: ['highlighted'],
  highlighted: computed('selectedEvent', 'event.id', {
    get() {
      return get(this, 'selectedEvent') === get(this, 'event.id');
    }
  }),
  actions: {
    clickRow() {
      console.log('event.causeMessage: ', get(this, 'event.commit.url'));

      const fn = get(this, 'eventClick');

      if (typeof fn === 'function') {
        fn(get(this, 'event.id'));
      }
    }
  },
  click() {
    this.send('clickRow');
  }
});
