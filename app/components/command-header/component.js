import Component from '@ember/component';
import { inject as service } from '@ember/service';

export default Component.extend({
  commandToRemove: null,
  scmUrl: null,
  isRemoving: false,
  store: service(),
  init() {
    this._super(...arguments);
    this.store.findRecord('pipeline', this.command.pipelineId).then((pipeline) => {
      this.set('scmUrl', pipeline.get('scmRepo.url'));
    }).catch(() => {
      this.set('scmUrl', null);
    });
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
    }
  }
});
