import classic from 'ember-classic-decorator';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import Controller from '@ember/controller';

@classic
export default class ChildPipelinesController extends Controller {
  @service
  session;

  @service('scm')
  scmService;

  @computed('model.pipelines')
  get pipelines() {
    let pipelines = this.get('model.pipelines');

    // add scm contexts into pipelines.
    return pipelines.map(pipeline => {
      const scm = this.scmService.getScm(pipeline.get('scmContext'));

      pipeline.set('scm', scm.displayName);
      pipeline.set('scmIcon', scm.iconType);

      return pipeline;
    });
  }

  @reads('model.pipeline')
  pipeline;
}
