import Component from '@ember/component';
import { computed } from '@ember/object';
import { htmlSafe } from '@ember/string';
import { inject as service } from '@ember/service';
import $ from 'jquery';


/**
 * extractPipelineId from jobName
 * @param  {String} jobName ~sd@1:main
 * @return {String} pipelineId
 */
const extractPipelineId = function(jobName) {
  const re = /~sd@(.*)\:/;

  const result = jobName.match(/~sd@(?<pipelineId>.*)\:/);

  if (result !== null) {
    const { pipelineId } = result.groups;

    return pipelineId;
  }

  return result;
}

export default Component.extend({
  pipeline: null,
  showTooltip: false,
  showTooltipPosition: 'left',
  tooltipData: {
    externalTrigger: {
      pipelineId: 0
    }
  },

  workflowGraph: computed('pipeline', function workflowGraph() {
    return this.pipeline.workflowGraph;
  }),
  startFrom: computed('pipeline', function startFrom() {
    // return this.pipeline.startFrom;
    return ['~pr', '~commit'];
  }),
  actions: {
    graphClicked(job, mouseevent, sizes) {
      const target = mouseevent.target;

      console.log('mouseevent.target.tagName', target.tagName);

      if (target.tagName === 'text') {
        const jobName = $(mouseevent.target).find('title').text();
        const pipelineId = extractPipelineId(jobName);

        this.setProperties({
          showTooltip: true,
          showTooltipPosition: 'left',
          tooltipData: {
            externalTrigger: {
              pipelineId
            },
            mouseevent,
            sizes
          }
        });
      } else {
        this.set('showTooltip', false);
      }

      mouseevent.stopPropagation();
    }
  }
});
