import { computed, observer } from '@ember/object';
import { inject as service } from '@ember/service';
import Controller from '@ember/controller';
import { jwt_decode as decoder } from 'ember-cli-jwt-decode';
const { alias } = computed;

export default Controller.extend({
  selectedVersion: null,
  errorMessage: '',
  session: service(),
  command: service(),
  commands: alias('model'),
  reset() {
    this.set('errorMessage', '');
  },
  latest: computed('commands.commandData.[]', {
    get() {
      return this.commands.commandData[0];
    }
  }),
  trusted: computed('commands.commandData.[]', function computeTrusted() {
    return this.commands.commandData.some(c => c.trusted && c.latest);
  }),
  isAdmin: computed(function isAdmin() {
    const token = this.get('session.data.authenticated.token');

    return (decoder(token).scope || []).includes('admin');
  }),
  versionCommand: computed('selectedVersion', 'commands.commandData.[]', {
    get() {
      const version = this.selectedVersion || this.get('latest.version');

      let { versionOrTagFromUrl } = this.commands;

      let { commandTagData } = this.commands;

      if (versionOrTagFromUrl === undefined) {
        return this.commands.commandData.findBy('version', version);
      }

      let tagExists = commandTagData.filter(t => t.tag === versionOrTagFromUrl);

      if (tagExists.length > 0) {
        return this.commands.commandData.findBy('version', tagExists[0].version);
      }

      return this.commands.commandData.findBy('version', versionOrTagFromUrl);
    }
  }),
  // Set selected version to null whenever the list of commands changes
  // eslint-disable-next-line ember/no-observers
  modelObserver: observer('commands.commandData.[]', function modelObserver() {
    this.set('selectedVersion', null);
  }),
  actions: {
    removeCommand(namespace, name) {
      return this.command
        .deleteCommands(namespace, name)
        .then(() => this.transitionToRoute('commands'), err => this.set('errorMessage', err));
    },
    updateTrust(namespace, name, toTrust) {
      return (
        this.isAdmin &&
                this.command.updateTrust(namespace, name, toTrust).catch(err => this.set('errorMessage', err))
      );
    }
  }
});
