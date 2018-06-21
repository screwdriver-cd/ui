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

          result.push(t);
        }
      });

      return result;
    });
  }
});
