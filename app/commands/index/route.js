import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';

export default Route.extend({
  command: service(),
  model() {
    return this.get('command').getAllCommands().then((commands) => {
      const result = [];
      const names = {};

      // Reduce versions down to one entry
      commands.forEach((c) => {
        const name = `${c.namespace}/${c.name}`;

        if (!names[name]) {
          names[name] = 1;
          result.push(c);
        }
      });

      return result;
    });
  }
});
