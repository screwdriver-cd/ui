import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';

export default Route.extend({
  command: service(),
  model() {
    return this.command.getAllCommands();
  }
});
