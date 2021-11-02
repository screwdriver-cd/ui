import { tagName } from '@ember-decorators/component';
import classic from 'ember-classic-decorator';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';

@tagName('')
@classic
export default class CommandHeader extends Component {
  commandToRemove = null;

  scmUrl = null;

  isRemoving = false;

  @service
  store;

  init() {
    super.init(...arguments);
    this.store
      .findRecord('pipeline', this.command.pipelineId)
      .then(pipeline => {
        this.set('scmUrl', pipeline.get('scmRepo.url'));
      })
      .catch(() => {
        this.set('scmUrl', null);
      });
  }

  @action
  setCommandToRemove(command) {
    this.set('commandToRemove', command);
  }

  @action
  cancelRemovingCommand() {
    this.set('commandToRemove', null);
    this.set('isRemoving', false);
  }

  @action
  removeCommand(namespace, name) {
    this.set('isRemoving', true);
    this.onRemoveCommand(namespace, name).then(() => {
      this.set('commandToRemove', null);
      this.set('isRemoving', false);
    });
  }

  @action
  updateTrust(namespace, name, toTrust) {
    this.set('trusted', toTrust);
    this.onUpdateTrust(namespace, name, toTrust);
  }
}
