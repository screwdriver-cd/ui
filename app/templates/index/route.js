import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import templateHelper from 'screwdriver-ui/utils/template';
const { getFullName, getLastUpdatedTime } = templateHelper;

export default Route.extend({
  template: service(),
  model() {
    return this.get('template').getAllTemplates().then((templates) => {
      const result = [];
      const names = {};

      // Reduce versions down to one entry
      templates.forEach((t) => {
        if (!names[t.name]) {
          names[t.name] = 1;

          // Add full template name
          t.fullName = getFullName({
            name: t.name,
            namespace: t.namespace
          });

          if (t.createTime) {
            // Add last updated time
            t.lastUpdated = getLastUpdatedTime({ createTime: t.createTime });
          }

          result.push(t);
        }
      });

      return result;
    });
  }
});
