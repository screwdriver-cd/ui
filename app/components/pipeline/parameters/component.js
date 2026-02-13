import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import {
  extractJobParameters,
  extractEventParameters,
  flattenParameters,
  getNormalizedParameterGroups
} from 'screwdriver-ui/utils/pipeline/parameters';

export default class PipelineParametersComponent extends Component {
  @service pipelinePageState;

  @tracked parameters;

  @tracked selectedParameters;

  constructor() {
    super(...arguments);
    const pipeline = this.pipelinePageState.getPipeline();
    const { pipelineParameters, jobParameters } =
      this.args.event && this.args.action !== 'start'
        ? extractEventParameters(this.args.event)
        : {
            pipelineParameters: this.args.pipelineParameters,
            jobParameters: this.args.jobParameters
          };

    this.parameters = getNormalizedParameterGroups(
      pipelineParameters,
      pipeline.parameters,
      jobParameters,
      extractJobParameters(this.pipelinePageState.getJobs()),
      this.args.job ? this.args.job.name : null
    );

    this.selectedParameters = {
      pipeline: { ...pipelineParameters },
      job: { ...jobParameters }
    };

    if (this.args.onUpdateParameters) {
      this.args.onUpdateParameters(flattenParameters(this.selectedParameters));
    }
  }

  get title() {
    return this.args.action
      ? `${this.args.action} pipeline with parameters`.toUpperCase()
      : null;
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

    this.args.onUpdateParameters(flattenParameters(this.selectedParameters));
  }
}
