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
  getTemplateVersion: computed('job', {
    get() {
      return this.get('job.environment.SD_TEMPLATE_VERSION');
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
      const regex = /sd-cmd\s+exec\s+([\w-]+\/[\w-]+)(?:@((?:(?:\d+)(?:\.\d+)?(?:\.\d+)?)|(?:[a-zA-Z][\w-]+)))?/g;
      let sdCommands = [];

      if (commands === []) {
        return [];
      }

      commands.forEach(c => {
        let matchRes = regex.exec(c.command);

        while (matchRes !== null) {
          let commandExist = sdCommands.find(
            // eslint-disable-next-line no-loop-func
            command => command.command === matchRes[1] && command.version === matchRes[2]
          );

          if (commandExist === undefined) {
            sdCommands.push({ command: matchRes[1], version: matchRes[2] });
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
