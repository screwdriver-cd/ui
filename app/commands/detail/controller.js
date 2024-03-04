import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Controller from '@ember/controller';
import { jwt_decode as decoder } from 'ember-cli-jwt-decode';
import { alias } from '@ember/object/computed';

export default Controller.extend({
  selectedVersion: null,
  errorMessage: '',
  router: service(),
  session: service(),
  command: service(),
  commands: alias('model'),
  versionOrTagFromUrl: '',
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
  isAdmin: computed('session.data.authenticated.token', function isAdmin() {
    const token = this.get('session.data.authenticated.token');

    return (decoder(token).scope || []).includes('admin');
  }),
  versionCommand: computed(
    'commands.commandData.[]',
    'latest.version',
    'versionOrTagFromUrl',
    {
      get() {
        const version = this.get('latest.version');
        const { commandTagData } = this.commands;

        if (this.versionOrTagFromUrl === '') {
          return this.commands.commandData.findBy('version', version);
        }

        const tagExists = commandTagData.filter(
          t => t.tag === this.versionOrTagFromUrl
        );

        if (tagExists.length > 0) {
          return this.commands.commandData.findBy(
            'version',
            tagExists[0].version
          );
        }

        return this.commands.commandData.findBy(
          'version',
          this.versionOrTagFromUrl
        );
      }
    }
  ),
  actions: {
    removeCommand(namespace, name) {
      return this.command.deleteCommands(namespace, name).then(
        () => this.router.transitionTo('commands'),
        err => this.set('errorMessage', err)
      );
    },
    updateTrust(namespace, name, toTrust) {
      return (
        this.isAdmin &&
        this.command
          .updateTrust(namespace, name, toTrust)
          .catch(err => this.set('errorMessage', err))
      );
    }
  }
});
