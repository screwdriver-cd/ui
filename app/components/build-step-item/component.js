import classic from 'ember-classic-decorator';
import { tagName } from '@ember-decorators/component';
import { computed } from '@ember/object';
import Component from '@ember/component';

@classic
@tagName('')
export default class BuildStepItem extends Component {
  @computed('stepName', 'selectedStep')
  get activeItem() {
    return this.stepName === this.selectedStep ? 'active' : '';
  }

  @computed('stepCode', 'stepStart')
  get status() {
    const code = this.stepCode;
    const startTime = this.stepStart;

    if (!startTime) {
      return 'queued';
    }

    if ((code === undefined || code === null) && startTime) {
      return 'running';
    }

    return code === 0 ? 'success' : 'failure';
  }

  @computed('status')
  get icon() {
    switch (this.status) {
      case 'running':
        return 'spinner';
      case 'success':
        return 'check';
      case 'failure':
        return 'times';
      default:
        return 'circle';
    }
  }

  @computed('stepStart', 'stepEnd')
  get duration() {
    const start = this.stepStart;
    const end = this.stepEnd;

    if (end && start) {
      const duration = Date.parse(end) - Date.parse(start);

      return humanizeDuration(duration, { round: true, largest: 2 });
    }

    return null;
  }
}
