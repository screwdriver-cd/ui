import { computed, observer } from '@ember/object';
import { inject as service } from '@ember/service';
import Controller from '@ember/controller';
const { alias } = computed;

export default Controller.extend({
  selectedVersion: null,
  errorMessage: '',
  command: service(),
  commands: alias('model'),
  reset() {
    this.set('errorMessage', '');
  },
  latest: computed('commands.[]', {
    get() {
      return this.commands[0];
    }
  }),
  trusted: computed('commands.[]', function computeTrusted() {
    return this.commands.some(c => c.trusted);
  }),
  versionCommand: computed('selectedVersion', 'commands.[]', {
    get() {
      const version = this.selectedVersion || this.get('latest.version');

      return this.commands.findBy('version', version);
    }
  }),
  // Set selected version to null whenever the list of commands changes
  // eslint-disable-next-line ember/no-observers
  modelObserver: observer('commands.[]', function modelObserver() {
    this.set('selectedVersion', null);
  }),
  actions: {
    changeVersion(version) {
      this.set('selectedVersion', version);
    },
    removeCommand(namespace, name) {
      return this.command
        .deleteCommands(namespace, name)
        .then(() => this.transitionToRoute('commands'), err => this.set('errorMessage', err));
    }
  }
});
