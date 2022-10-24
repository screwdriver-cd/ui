import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { and } from '@ember/object/computed';
import { formatMetrics } from 'screwdriver-ui/utils/metric';

export default Component.extend({
  store: service(),
  inViewport: service(),
  eventsInfo: null,
  lastEventInfo: null,
  isAuthenticated: undefined,
  isOrganizing: false,
  isDefaultCollection: false,
  pipeline: null,
  pipelineSelected: false,
  classNames: ['pipeline-card'],
  reset: false,
  storeQueryError: false,
  hasBothEventsAndLatestEventInfo: and('eventsInfo', 'lastEventInfo'),
  showCheckbox: and('isOrganizing', 'isAuthenticated'),

  branch: computed('pipeline.scmRepo', function get() {
    const { branch, rootDir } = this.pipeline.scmRepo;

    return rootDir ? `${branch}#${rootDir}` : branch;
  }),
  showRemoveButton: computed(
    'isOrganizing',
    'isAuthenticated',
    'isDefaultCollection',
    function showRemoveButton() {
      return (
        !this.isDefaultCollection && !this.isOrganizing && this.isAuthenticated
      );
    }
  ),

  didInsertElement() {
    this._super(...arguments);
    if (!this.hasBothEventsAndLatestEventInfo) {
      this.setupInViewport();
    }
  },
  setupInViewport() {
    if (this && this.element) {
      const inViewportHook = this.element.querySelector(
        '.pipeline-card-content'
      );
      const { onEnter } = this.inViewport.watchElement(inViewportHook);

      onEnter(this.didEnterViewport.bind(this));
    }
  },
  async didEnterViewport() {
    if (this && this.element) {
      const inViewportHook = this.element.querySelector(
        '.pipeline-card-content'
      );

      this.inViewport.stopWatching(inViewportHook);
      this.updateEventMetrics();
    }
  },
  async updateEventMetrics() {
    const metrics = await this.pipeline.get('metrics').catch(() => {
      this.setProperties({
        storeQueryError: true
      });
    });

    const result = formatMetrics(metrics);
    const { eventsInfo, lastEventInfo } = result;

    this.setProperties({
      eventsInfo,
      lastEventInfo
    });
  },
  actions: {
    removePipeline() {
      this.removePipeline(this.pipeline.id, this.pipeline.name);
    },
    togglePipeline() {
      const pipelineId = this.pipeline.id;

      if (this.reset) {
        this.setProperties({
          pipelineSelected: false,
          reset: false
        });
      }

      if (this.pipelineSelected) {
        this.set('pipelineSelected', false);
        this.deselectPipeline(pipelineId);
      } else {
        this.set('pipelineSelected', true);
        this.selectPipeline(pipelineId);
      }
    }
  }
});
