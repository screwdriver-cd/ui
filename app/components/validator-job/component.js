import classic from 'ember-classic-decorator';
import { classNameBindings } from '@ember-decorators/component';
import { action, computed } from '@ember/object';
import Component from '@ember/component';

@classic
@classNameBindings('hasParseError', 'collapsible')
export default class ValidatorJob extends Component {
  isOpen = false;

  collapsible = true;

  @computed('job.environment.SD_TEMPLATE_FULLNAME')
  get getTemplateName() {
    return this.get('job.environment.SD_TEMPLATE_FULLNAME');
  }

  @computed(
    'job.environment.{SD_TEMPLATE_NAME,SD_TEMPLATE_NAMESPACE,SD_TEMPLATE_VERSION}'
  )
  get getTemplateLink() {
    const namespace = this.get('job.environment.SD_TEMPLATE_NAMESPACE');
    const name = this.get('job.environment.SD_TEMPLATE_NAME');
    const version = this.get('job.environment.SD_TEMPLATE_VERSION');

    return `/templates/${namespace}/${name}/${version}`;
  }

  @computed('job.environment.SD_TEMPLATE_VERSION')
  get getTemplateVersion() {
    return this.get('job.environment.SD_TEMPLATE_VERSION');
  }

  @computed('job.commands.0.name')
  get hasParseError() {
    return this.get('job.commands.0.name') === 'config-parse-error';
  }

  @computed('job.{commands,steps}')
  get steps() {
    let c = this.get('job.commands');

    if (c) {
      return c;
    }

    // Templates have a different output
    c = this.get('job.steps');
    if (c) {
      return c.map(s => {
        const name = Object.keys(s)[0];
        const command = s[name].command || s[name];
        const locked = s[name].locked || null;

        return { name, command, locked };
      });
    }

    return [];
  }

  @computed('job', 'steps')
  get sdCommands() {
    const commands = this.steps;
    const regex =
      /sd-cmd\s+exec\s+([\w-]+\/[\w-]+)(?:@((?:(?:\d+)(?:\.\d+)?(?:\.\d+)?)|(?:[a-zA-Z][\w-]+)))?/g;

    let sdCommands = [];

    if (commands === []) {
      return [];
    }

    commands.forEach(c => {
      let matchRes = regex.exec(c.command);

      while (matchRes !== null) {
        let commandExist = sdCommands.find(
          // eslint-disable-next-line no-loop-func
          command =>
            command.command === matchRes[1] && command.version === matchRes[2]
        );

        if (commandExist === undefined) {
          sdCommands.push({ command: matchRes[1], version: matchRes[2] });
        }
        matchRes = regex.exec(c.command);
      }
    });

    return sdCommands;
  }

  didInsertElement() {
    super.didInsertElement(...arguments);

    if (!this.isOpen) {
      this.element
        .querySelectorAll('div')
        .forEach(el => el.classList.add('hidden'));
    }
  }

  @action
  nameClick() {
    this.toggleProperty('isOpen');
    this.element
      .querySelectorAll('div')
      .forEach(el => el.classList.toggle('hidden'));
  }
}
