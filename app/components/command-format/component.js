import { tagName } from '@ember-decorators/component';
import classic from 'ember-classic-decorator';
import { computed } from '@ember/object';
import Component from '@ember/component';

@tagName('')
@classic
export default class CommandFormat extends Component {
  @computed('command.format')
  get isHabitat() {
    return this.command?.format === 'habitat';
  }

  @computed('command.format')
  get isDocker() {
    return this.command?.format === 'docker';
  }

  @computed('command.format')
  get isBinary() {
    return this.command?.format === 'binary';
  }
}
