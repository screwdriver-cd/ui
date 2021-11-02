import classic from 'ember-classic-decorator';
import { action } from '@ember/object';
import Route from '@ember/routing/route';

@classic
export default class StepRoute extends Route {
  routeAfterAuthentication = 'pipeline.build';

  model(params) {
    this.controllerFor('pipeline.build').set(
      'preselectedStepName',
      params.step_id
    );

    // return parent route model
    return this.modelFor('pipeline.build');
  }

  afterModel(model) {
    if (!model) {
      return;
    }

    const stepName = this.controllerFor('pipeline.build').get(
      'preselectedStepName'
    );

    if (!model.build.get('steps').findBy('name', stepName)) {
      this.transitionTo(
        'pipeline.build',
        model.pipeline.get('id'),
        model.build.get('id')
      );
    }
  }

  @action
  didTransition() {
    this.controllerFor('pipeline.build').setProperties({
      selectedArtifact: '',
      activeTab: 'steps'
    });
  }
}
