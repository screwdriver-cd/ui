import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  classNames: ['col-sm-3'],
  isDefault: computed('template.namespace', {
    get() {
      const namespace = this.get('template.namespace');

      return namespace === 'default' ? null : namespace;
    }
  })
});
