import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import templateHelper from 'screwdriver-ui/utils/template';
const { getLastUpdatedTime } = templateHelper;

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

          if (c.createTime) {
            // Add last updated time
            c.lastUpdated = getLastUpdatedTime({ createTime: c.createTime });
          }

          result.push(c);
        }
      });

      return result;
    });
  }
});
