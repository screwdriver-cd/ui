import Component from '@ember/component';
import { computed } from '@ember/object';
import { and } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { formatMetrics } from 'screwdriver-ui/utils/metric';

export default Component.extend({
  store: service(),
  inViewport: service(),
  tagName: 'tr',
  eventsInfo: null,
  lastEventInfo: null,
  isAuthenticated: false,
  isOrganizing: false,
  isDefaultCollection: false,
  pipeline: null,
  pipelineSelected: false,
  reset: false,
  storeQueryError: false,
  hasBothEventsAndLatestEventInfo: and('eventsInfo', 'lastEventInfo'),
  showCheckbox: and('isOrganizing', 'isAuthenticated'),

  branch: computed('pipeline', function get() {
    const { branch, rootDir } = this.pipeline.scmRepo;

    return rootDir ? `${branch}#${rootDir}` : branch;
  }),
  showRemoveButton: computed('isOrganizing', 'isAuthenticated', 'isDefaultCollection', function showRemoveButton() {
    return !this.isDefaultCollection && !this.isOrganizing && this.isAuthenticated;
  }),

  didInsertElement() {
    if (!this.hasBothEventsAndLatestEventInfo) {
      this.setupInViewport();
    }
  },
  setupInViewport() {
    if (this && this.element) {
      const inViewportHook = this.element.querySelector('.branch');
      const { onEnter } = this.inViewport.watchElement(inViewportHook);

      onEnter(this.didEnterViewport.bind(this));
    }
  },
  async didEnterViewport() {
    if (this && this.element) {
      const inViewportHook = this.element.querySelector('.branch');

      this.inViewport.stopWatching(inViewportHook);
      this.updateEventMetrics();
    }
  },
  async updateEventMetrics() {
    const metrics = await this.store
      .query('metric', {
        pipelineId: this.pipeline.id,
        page: 1,
        count: 20
      })
      .catch(() => {
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
