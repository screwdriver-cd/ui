import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';

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
          // construct full template name
          t.fullName = t.name;
          if (t.namespace && t.namespace !== 'default') {
            t.fullName = `${t.namespace}/${t.name}`;
          }

          result.push(t);
        }
      });

      return result;
    });
  }
});
