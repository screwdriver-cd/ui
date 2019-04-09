import BuildRoute from '../route';

export default BuildRoute.extend({
  model(params) {
    this.controllerFor('pipeline.build').set('preselectedStepName', params.step_id);

    return this._super(this.paramsFor('pipeline.build'));
  },
  afterModel(model) {
    this._super(model);

    const stepName = this.controllerFor('pipeline.build').get('preselectedStepName');

    if (!model.build.get('steps').findBy('name', stepName)) {
      this.transitionTo('pipeline.build', model.pipeline.get('id'), model.build.get('id'));
    }
  }
});
