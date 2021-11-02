import { tagName } from '@ember-decorators/component';
import classic from 'ember-classic-decorator';
import { action, computed } from '@ember/object';
import Component from '@ember/component';
import { unfinishedStatuses } from 'screwdriver-ui/utils/build';

@tagName('')
@classic
export default class PipelineListActionsCell extends Component {
  @computed('value.latestBuild.status')
  get stopButtonClass() {
    const status = this.get('value.latestBuild.status');

    if (unfinishedStatuses.includes(status)) {
      return 'clicks-enabled';
    }

    return 'clicks-disabled';
  }

  @action
  startSingleBuild(buildState = undefined) {
    const { value } = this;

    if (buildState === 'START' && value.hasParameters) {
      value.openParametersModal(value.jobId, buildState);
    } else {
      value.startSingleBuild(value.jobId, value.jobName, buildState);
    }
  }

  @action
  stopBuild() {
    const { value } = this;

    value.stopBuild(null, { buildId: value.latestBuild.id });
  }
}
