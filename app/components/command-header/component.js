import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';

export default Component.extend({
  commandToRemove: null,
  scmUrl: null,
  isRemoving: false,
  showToggleTrustModal: false,
  store: service(),
  isTrusted: null,
  isLatestVersion: alias('command.latest'),
  init() {
    this._super(...arguments);
    this.store
      .findRecord('pipeline', this.command.pipelineId)
      .then(pipeline => {
        this.set('scmUrl', pipeline.scmRepo.url);
      })
      .catch(() => {
        this.set('scmUrl', null);
      });

    let compatibilities = {
      clouds: ['aws', 'gcp'],
      architectures: ['arm64']
    };

    this.command.compatibilities = compatibilities;

    this.set('isTrusted', this.command.trusted);
  },
  actions: {
    setCommandToRemove(command) {
      this.set('commandToRemove', command);
    },
    cancelRemovingCommand() {
      this.set('commandToRemove', null);
      this.set('isRemoving', false);
    },
    removeCommand(namespace, name) {
      this.set('isRemoving', true);
      this.onRemoveCommand(namespace, name).then(() => {
        this.set('commandToRemove', null);
        this.set('isRemoving', false);
      });
    },
    showToggleTrustModal() {
      this.set('showToggleTrustModal', true);
    },
    cancelToggleTrustModal() {
      this.set('showToggleTrustModal', false);
    },
    updateTrust(namespace, name, toTrust) {
      this.onUpdateTrust(namespace, name, toTrust);
      this.set('isTrusted', toTrust);
      this.set('showToggleTrustModal', false);
    }
  }
});
