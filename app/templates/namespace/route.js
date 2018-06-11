import { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import Route from '@ember/routing/route';
import templateHelper from 'screwdriver-ui/utils/template';
const { getFullName } = templateHelper;

export default Route.extend({
  //template: service(),
  filterTemplateNamespace: service('filter-template-namespace'),
  templateName: 'templates/index',
  controllerName: 'templates',
  model(params) {
    return this.get('filterTemplateNamespace').getTemplates(params.namespace).then((filteredTemplates) =>{
      const result = [];
      const names = {};

      // Reduce versions down to one entry
      filteredTemplates.forEach((t) => {
        if (!names[t.name]) {
          names[t.name] = 1;

          // Add full template name
          t.fullName = getFullName({
            name: t.name,
            namespace: t.namespace
          });

          result.push(t);
        }
      });

      console.log(result)

      return result
    })
  },
  actions: {
    willTransition(q) {
      console.log('in will transition at namespace');
      return true;
      // this.modelFor('templates').reload();
    }
  }
});
