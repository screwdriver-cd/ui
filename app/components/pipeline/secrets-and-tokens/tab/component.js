import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class PipelineSecretsAndTokensTabComponent extends Component {
  @tracked activeTab;

  constructor() {
    super(...arguments);

    this.activeTab = this.args.activeTab;
  }

  @action
  setActiveTab(tab) {
    this.activeTab = tab;
    this.args.onTabChange(tab);
  }
}
