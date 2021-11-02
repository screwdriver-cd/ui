import { tagName } from '@ember-decorators/component';
import classic from 'ember-classic-decorator';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';

@tagName('')
@classic
export default class TemplateHeader extends Component {
  templateToRemove = null;

  scmUrl = null;

  isRemoving = false;

  @service
  store;

  init() {
    super.init(...arguments);
    this.store
      .findRecord('pipeline', this.template.pipelineId)
      .then(pipeline => {
        this.set('scmUrl', pipeline.get('scmRepo.url'));
      })
      .catch(() => {
        this.set('scmUrl', null);
      });
  }

  @action
  setTemplateToRemove(template) {
    this.set('templateToRemove', template);
  }

  @action
  cancelRemovingTemplate() {
    this.set('templateToRemove', null);
    this.set('isRemoving', false);
  }

  @action
  removeTemplate(name) {
    this.set('isRemoving', true);
    this.onRemoveTemplate(name).then(() => {
      this.set('templateToRemove', null);
      this.set('isRemoving', false);
    });
  }

  @action
  updateTrust(fullName, toTrust) {
    this.set('trusted', toTrust);
    this.onUpdateTrust(fullName, toTrust);
  }
}
