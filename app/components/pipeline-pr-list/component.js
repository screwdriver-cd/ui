import classic from 'ember-classic-decorator';
import { classNameBindings } from '@ember-decorators/component';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { set, get, action, computed } from '@ember/object';
import { isActiveBuild } from 'screwdriver-ui/utils/build';
@classic
@classNameBindings('highlighted')
export default class PipelinePrList extends Component {
  @service
  store;

  @computed('selectedEvent', 'eventId')
  get highlighted() {
    return this.selectedEvent === this.eventId;
  }

  didInsertElement() {
    super.didInsertElement(...arguments);
    this.set('inited', false);
  }

  inited = true;

  async init() {
    super.init(...arguments);

    const pipelineId = this.get('pipeline.id');
    const jobName = this.get('jobs.firstObject.name');
    // extract prNumber from jobName
    const prNum = jobName.split(/PR-(\d+):/)[1];
    const events = await this.store.query('event', {
      pipelineId,
      page: 1,
      count: 1,
      prNum
    });
    const currentEventId = events.get('firstObject.id');

    set(this, 'eventId', currentEventId);
  }

  @computed('jobs.@each.builds', 'inited')
  get showJobs() {
    return this.inited || this.jobs.some(j => !!j.get('builds.length'));
  }

  @computed('jobs.@each.builds', 'inited')
  get isRunning() {
    return this.jobs.some(j => {
      const status = j.builds.get('firstObject.status');
      const endTime = j.builds.get('firstObject.endTime');

      return isActiveBuild(status, endTime);
    });
  }

  @action
  selectPR() {
    set(this, 'selected', this.eventId);
  }
}
