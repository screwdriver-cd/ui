import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  namespace: computed('record.namespace', {
    get() {
      return this.record.namespace;
    }
  }),
  name: computed('record.name', {
    get() {
      return this.record.name;
    }
  }),
  trusted: computed('record.trusted', {
    get() {
      return this.record.trusted;
    }
  })
});
