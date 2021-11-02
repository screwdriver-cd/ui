import Component from '@ember/component';
import { computed } from '@ember/object';
import $ from 'jquery';

/**
 * extractPipelineId from jobName
 * @param  {String} jobName ~sd@1:main
 * @return {String} pipelineId
 */
const extractPipelineId = function extractPipelineId(jobName) {
  const result = jobName.match(/~sd@(?<pipelineId>.*):/);

  if (result !== null) {
    const { pipelineId } = result.groups;

    return pipelineId;
  }

  return result;
};

export default Component.extend({
  tagName: '',
  pipeline: null,
  showTooltip: false,
  showTooltipPosition: 'left',

  tooltipData: {
    externalTrigger: {
      pipelineId: 0
    }
  },

  workflowGraph: computed.reads('pipeline.workflowGraph'),
  startFrom: computed('pipeline', () => ['~pr', '~commit']),

  actions: {
    graphClicked(job, mouseevent, sizes) {
      const { target } = mouseevent;

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
