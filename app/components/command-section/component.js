import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  classNames: ['col-sm-3'],
  headerTitle: computed('command', {
    get() {
      return `${this.get('command.namespace')}/${this.get('command.name')}`;
    }
  })
});
