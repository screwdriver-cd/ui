import { computed } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
  classNameBindings: ['hasParseError', 'collapsible'],
  isOpen: true,
  collapsible: true,
  getTemplateName: computed('job', {
    get() {
      return this.get('job.environment.SD_TEMPLATE_FULLNAME');
    }
  }),
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
  sdCommands: computed('job', {
    get() {
      const commands = this.steps;
      const regex = /sd-cmd\s+exec\s+([\w-]+\/[\w-]+)/g;
      let sdCommands = [];
      let matchRes;

      if (commands === []) {
        return [];
      }

      commands.forEach(c => {
        matchRes = regex.exec(c.command);
        while (matchRes !== null) {
          if (!sdCommands.includes(matchRes[1])) {
            sdCommands.push(matchRes[1]);
          }
          matchRes = regex.exec(c.command);
        }
      });

      return sdCommands;
    }
  }),
  actions: {
    nameClick() {
      this.toggleProperty('isOpen');
      this.$('div').toggle('hidden');
    }
  }
});
