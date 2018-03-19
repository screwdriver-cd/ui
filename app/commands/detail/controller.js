import { computed, observer } from '@ember/object';
import Controller from '@ember/controller';
const { alias } = computed;

export default Controller.extend({
  selectedVersion: null,
  commands: alias('model'),
  latest: computed('commands.[]', {
    get() {
      return this.get('commands')[0];
    }
  }),
  command: computed('selectedVersion', 'commands.[]', {
    get() {
      const version = this.get('selectedVersion') || this.get('latest.version');

      return this.get('commands').findBy('version', version);
    }
  }),
  // Set selected version to null whenever the list of commands changes
  modelObserver: observer('commands.[]', function modelObserver() {
    this.set('selectedVersion', null);
  }),
  actions: {
    changeVersion(version) {
      this.set('selectedVersion', version);
    }
  }
});
