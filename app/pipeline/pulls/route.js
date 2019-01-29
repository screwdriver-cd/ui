// import Route from '@ember/routing/route';
import EventsRoute from '../events/route';

export default EventsRoute.extend({
  controllerName: 'pipeline.events',
  setupController(controller, model) {
    this._super(controller, model);
    controller.set('activeTab', 'pulls');
  },
  renderTemplate() {
    this.render('pipeline.events');
  }
});
