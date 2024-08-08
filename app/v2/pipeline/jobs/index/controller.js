import Controller from '@ember/controller';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { isPRJob } from 'screwdriver-ui/utils/build';
import moment from 'moment';
import { isInactivePipeline } from 'screwdriver-ui/utils/pipeline';

export default class PipelineOptionsController extends Controller {
  @service session;

  @service router;

  showListView = true;

  lastRefreshed = moment();

  isShowingModal = false;

  isFetching = false;

  activeTab = 'events';

  moreToShow = true;

  errorMessage = '';

  get pipeline() {
    return this.model.pipeline;
  }

  get jobs() {
    const jobs = this.model.jobs === undefined ? [] : this.model.jobs;

    return jobs.filter(j => !isPRJob(j.name));
  }

  // missing set
  get isInactivePipeline() {
    return isInactivePipeline(this.pipeline);
  }

  get jobIds() {
    return this.jobs.map(j => j.id);
  }

  @action
  setShowListView(showListView) {
    if (!showListView) {
      this.router.transitionTo('v2.pipeline.events');
    }
  }
}
