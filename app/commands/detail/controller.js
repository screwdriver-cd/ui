import { computed, observer } from '@ember/object';
import { inject as service } from '@ember/service';
import Controller from '@ember/controller';
const { alias } = computed;

export default Controller.extend({
  selectedVersion: null,
  errorMessage: '',
  command: service(),
  commands: alias('model'),
  reset: function () {
    this.set('errorMessage', '')
  },
  latest: computed('commands.[]', {
    get() {
      return this.get('commands')[0];
    }
  }),
  versionCommand: computed('selectedVersion', 'commands.[]', {
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
    },
    removeCommand(namespace, name) {
      return this.get('command').deleteCommands(namespace, name)
        .then(
          () => this.transitionToRoute('commands'),
          (err) => this.set('errorMessage', err));
    }
  }
});
