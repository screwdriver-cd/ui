import classic from 'ember-classic-decorator';
import { tagName } from '@ember-decorators/component';
import Component from '@ember/component';
import { action } from '@ember/object';
import ENV from 'screwdriver-ui/config/environment';

@classic
@tagName('')
export default class AppHeader extends Component {
  showSearch = false;

  docUrl = ENV.APP.SDDOC_URL;

  slackUrl = ENV.APP.SLACK_URL;

  releaseVersion = ENV.APP.RELEASE_VERSION;

  searchTerm = '';

  @action
  invalidateSession() {
    this.onInvalidate();
  }

  @action
  triggerSearch() {
    this.searchPipelines(this.searchTerm);
  }

  @action
  doAuthenticate(scmContext) {
    this.authenticate(scmContext);
  }

  @action
  cancelSearch() {
    this.set('showSearch', false);
  }

  @action
  openCreatePipeline() {
    this.set('showCreatePipeline', true);
  }
}
