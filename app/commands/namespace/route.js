import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';

export default Route.extend({
  command: service(),
  templateName: 'commands/index',
  model(params) {
    return this.get('command').getAllCommands(params.namespace);
  }
});
