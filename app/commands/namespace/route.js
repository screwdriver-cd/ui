import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';

export default Route.extend({
  command: service(),
  templateName: 'commands/index',
  setupController(controller, model) {
    this._super(controller, model);
    controller.set('targetNamespace', this.paramsFor('commands.namespace').namespace);
  },
  model(params) {
    return this.get('command').getAllCommands(params.namespace);
  }
});
