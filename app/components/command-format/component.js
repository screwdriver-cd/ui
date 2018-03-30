import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  isHabitat: computed('command', {
    get() {
      return this.get('command.format') === 'habitat';
    }
  }),
  isDocker: computed('command', {
    get() {
      return this.get('command.format') === 'docker';
    }
  }),
  isBinary: computed('command', {
    get() {
      return this.get('command.format') === 'binary';
    }
  })
});
