import classic from 'ember-classic-decorator';
import { classNameBindings } from '@ember-decorators/component';
import { computed } from '@ember/object';
import Component from '@ember/component';
import { statusIcon } from 'screwdriver-ui/utils/build';

@classic
@classNameBindings('build.status')
export default class PipelinePrView extends Component {
  @computed('job.builds')
  get build() {
    return this.get('job.builds').objectAt(0);
  }

  @computed('job.name', 'workflowGraph.nodes')
  get displayName() {
    const nodes = this.get('workflowGraph.nodes');
    const jobName = this.get('job.name').replace('PR-', '').split(':').pop();
    const matchedNode = nodes.find(node => node.name === jobName);

    if (matchedNode && matchedNode.displayName) {
      return matchedNode.displayName;
    }

    return jobName;
  }

  @computed('build.status')
  get icon() {
    return statusIcon(this.get('build.status'), true);
  }
}
