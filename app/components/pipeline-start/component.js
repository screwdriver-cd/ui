import { tagName } from '@ember-decorators/component';
import classic from 'ember-classic-decorator';
import { action, computed } from '@ember/object';
import Component from '@ember/component';
import MAX_NUM_OF_PARAMETERS_ALLOWED from 'screwdriver-ui/utils/constants';

@tagName('')
@classic
export default class PipelineStart extends Component {
  direction = 'down';

  @computed('pipelineParameters', 'jobParameters')
  get hasParameters() {
    return (
      Object.keys(this.pipelineParameters).length > 0 ||
      Object.keys(this.jobParameters).length > 0
    );
  }

  @computed('pipelineParameters', 'jobParameters')
  get hasLargeNumberOfParameters() {
    const paramCount =
      Object.keys(this.pipelineParameters).length +
      Object.values(this.jobParameters).reduce((count, parameters) => {
        if (count) {
          return count + Object.keys(parameters).length;
        }

        return Object.keys(parameters).length;
      }, 0);

    return paramCount > MAX_NUM_OF_PARAMETERS_ALLOWED;
  }

  init() {
    super.init(...arguments);
    this.setProperties({
      pipelineParameters: this.getDefaultPipelineParameters(),
      jobParameters: this.getDefaultJobParameters()
    });
  }

  getDefaultPipelineParameters() {
    return this.pipeline?.parameters || {};
  }

  getDefaultJobParameters() {
    return this.pipeline?.jobParameters || {};
  }

  @computed('prNum', 'jobs')
  get startArgs() {
    const jobs = this.jobs || [];
    const { prNum } = this;

    if (!prNum) {
      return [];
    }

    // Pass arguments with PR number and jobs to reload when starting PR event.
    return [prNum, jobs];
  }

  toggleCaretDirection() {
    let direction = 'down';

    if (this.direction === 'down') {
      direction = 'up';
    }
    this.set('direction', direction);
  }

  @action
  startBuild(parameters) {
    const args = this.startArgs;
    const startFunc = this.startNewBuild;

    startFunc.apply(null, [...args, parameters]);
  }

  @action
  toggleDropdown(toggleAction) {
    this.toggleCaretDirection();
    if (typeof toggleAction === 'function') {
      toggleAction();
    }
  }

  @action
  toggleModal() {
    this.toggleCaretDirection();
    this.toggleProperty('isShowingModal');
  }

  @action
  resetForm() {
    this.setProperties({
      pipelineParameters: this.getDefaultPipelineParameters(),
      jobParameters: this.getDefaultJobParameters(),
      direction: 'down',
      isShowingModal: false
    });
  }
}
