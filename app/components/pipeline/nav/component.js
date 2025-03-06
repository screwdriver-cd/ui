import Component from '@glimmer/component';
import { service } from '@ember/service';

export default class PipelineNavComponent extends Component {
  @service pipelinePageState;

  get hasChildPipelines() {
    return !!this.pipelinePageState.getPipeline().childPipelines;
  }
}
