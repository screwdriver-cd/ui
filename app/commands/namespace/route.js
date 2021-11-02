import classic from 'ember-classic-decorator';
import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';

@classic
export default class NamespaceRoute extends Route {
  @service
  command;

  templateName = 'commands/index';

  setupController(controller, model) {
    super.setupController(controller, model);
    controller.set(
      'targetNamespace',
      this.paramsFor('commands.namespace').namespace
    );
  }

  model(params) {
    return this.command.getAllCommands(params.namespace);
  }
}
