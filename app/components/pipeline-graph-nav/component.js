import { tagName } from '@ember-decorators/component';
import classic from 'ember-classic-decorator';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { statusIcon } from 'screwdriver-ui/utils/build';

@tagName('')
@classic
export default class PipelineGraphNav extends Component {
  @service
  session;

  @computed('graphType')
  get isPR() {
    return this.graphType === 'pr';
  }

  @computed('selectedEventObj.prNum', 'prGroups')
  get prJobs() {
    const prNum = this.get('selectedEventObj.prNum');

    return this.prGroups[prNum];
  }

  @computed('lastSuccessful', 'mostRecent', 'isPR')
  get eventOptions() {
    const options = [
      { label: 'Most Recent', value: this.mostRecent },
      { label: 'Last Successful', value: this.lastSuccessful }
    ];

    return options;
  }

  @computed('selectedEventObj.type', 'isPR')
  get showGraphNavRow() {
    const eventType = this.get('selectedEventObj.type');

    return !this.isPR || eventType === 'pr';
  }

  @computed('selectedEventObj.status')
  get icon() {
    return statusIcon(this.get('selectedEventObj.status'));
  }
}
