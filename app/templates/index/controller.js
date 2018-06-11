import { inject as service } from '@ember/service';
import { computed, observer } from '@ember/object';
import Controller from '@ember/controller';
import { reads, mapBy } from '@ember/object/computed';
import templateHelper from 'screwdriver-ui/utils/template';
const { getFullName } = templateHelper;
const { alias } = computed;

export default Controller.extend({
  filterTemplateNamespace: service('filter-template-namespace'),
  templates: reads('model'),
  actions: {
    test() {
      const test = this.get('templates');
      console.log(test);
    },
    changeDisplayedTemplates(namespace)
     {
      this.get('filterTemplateNamespace').getTemplates(namespace).then((filteredTemplates) =>{
        console.log('-----------------TEMPLATE----------')
      console.log(filteredTemplates)
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

      this.set('templates', result)

      });
              
    }
  }
});
