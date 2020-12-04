import { computed } from '@ember/object';
import Component from '@ember/component';
import { statusIcon } from 'screwdriver-ui/utils/build';

export default Component.extend({
  classNameBindings: ['build.status'],
  build: computed('job.builds', {
    get() {
      return this.get('job.builds').objectAt(0);
    }
  }),
  displayName: computed('job.name', {
    get() {
      const nodes = this.get('workflowGraph.nodes');
      const jobName = this.get('job.name')
        .replace('PR-', '')
        .split(':')
        .pop();
      const matchedNode = nodes.find(node => node.name === jobName);
      const displayName = matchedNode.displayName !== undefined ? matchedNode.displayName : jobName;

      return displayName;
    }
  }),
  icon: computed('build.status', {
    get() {
      return statusIcon(this.get('build.status'), true);
    }
  })
});
