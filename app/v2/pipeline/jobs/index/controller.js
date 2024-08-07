import Controller from '@ember/controller';
import { service } from '@ember/service';
// import { action } from '@ember/object';
// import { isPRJob } from 'screwdriver-ui/utils/build';

export default class PipelineOptionsController extends Controller {
  @service session;

  @service router;

  get pipeline() {
    return this.model.pipeline;
  }

  // get jobs() {
  //   const jobs =
  //     this.get('model.jobs') === undefined ? [] : this.get('model.jobs');

  //   return jobs.filter(j => !isPRJob(j.get('name')));
  // }
}
