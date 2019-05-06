import { computed } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
  classNameBindings: ['hasParseError', 'collapsible'],
  isOpen: true,
  collapsible: true,
  hasParseError: computed('job', {
    get() {
      return this.get('job.commands.0.name') === 'config-parse-error';
    }
  }),
  steps: computed('job', {
    get() {
      let c = this.get('job.commands');

      if (c) {
        return c;
      }

      // Templates have a different output
      c = this.get('job.steps');
      if (c) {
        return c.map(s => {
          const name = Object.keys(s)[0];
          const command = s[name];

          return { name, command };
        });
      }

      return [];
    }
  }),
  actions: {
    nameClick() {
      this.toggleProperty('isOpen');
      this.$('div').toggle('hidden');
    }
  }
});
