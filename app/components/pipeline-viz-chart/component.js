import Component from '@ember/component';
import { computed } from '@ember/object';
import { htmlSafe } from '@ember/string';
import { inject as service } from '@ember/service';

export default Component.extend({
  pipelines: [],
  pipeline: undefined,
  workflowGraph: computed('pipeline', function workflowGraph() {
    return this.pipeline.workflowGraph;
  }),
  startFrom: computed('pipeline', function startFrom() {
    // return this.pipeline.startFrom;
    return ['~pr', '~commit'];
  }),
  actions: {}
});
