import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import {
  extractJobParameters,
  extractEventParameters,
  getNormalizedParameterGroups
} from 'screwdriver-ui/utils/pipeline/parameters';

export default class PipelineParametersComponent extends Component {
  @tracked parameters;

  @tracked selectedParameters;

  constructor() {
    super(...arguments);

    const { pipelineParameters, jobParameters } = extractEventParameters(
      this.args.event
    );

    this.parameters = getNormalizedParameterGroups(
      pipelineParameters,
      this.args.pipeline.parameters,
      jobParameters,
      extractJobParameters(this.args.jobs),
      this.args.job ? this.args.job.name : null
    );

    this.selectedParameters = {
      pipeline: { ...pipelineParameters },
      job: { ...jobParameters }
    };
  }

  get title() {
    return `${this.args.action} pipeline with parameters`.toUpperCase();
  }

  @action
  toggleParameterGroup(groupName) {
    const updatedParameters = [];

    this.parameters.forEach(group => {
      if (group.paramGroupTitle === groupName) {
        updatedParameters.push({ ...group, isOpen: !group.isOpen });
      } else {
        updatedParameters.push(group);
      }
    });

    this.parameters = updatedParameters;
  }

  @action
  openSelect(powerSelectObject) {
    setTimeout(() => {
      const container = document.getElementsByClassName('parameters-container');
      const scrollFrame = container[0];
      const optionsBox = document.getElementById(
        `ember-power-select-options-${powerSelectObject.uniqueId}`
      );

      if (optionsBox === null) {
        return;
      }

      const optionsBoxRect = optionsBox.getBoundingClientRect();
      const scrollFrameRect = scrollFrame.getBoundingClientRect();
      const hiddenAreaHeight = optionsBoxRect.bottom - scrollFrameRect.bottom;

      if (hiddenAreaHeight > 0) {
        scrollFrame.scrollBy({ top: hiddenAreaHeight + 10 });
      }
    }, 100);
  }

  @action
  onInput(parameterGroup, parameter, event) {
    this.updateParameter(parameterGroup, parameter, event.target.value);
  }

  @action
  updateParameter(parameterGroup, parameter, value) {
    if (parameterGroup) {
      const jobParameters = { ...this.selectedParameters.job[parameterGroup] };

      jobParameters[parameter.name] = { value };
      this.selectedParameters.job[parameterGroup] = jobParameters;
    } else {
      this.selectedParameters.pipeline[parameter.name] = { value };
    }

    const { pipeline, job } = this.selectedParameters;

    this.args.onUpdateParameters({ ...pipeline, ...job });
  }
}
