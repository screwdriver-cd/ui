import Controller from '@ember/controller';

export default class NewPipelineEventsShowController extends Controller {
  queryParams = ['jobId'];

  jobId = '';
}
