import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
  noResult: true,
  isLoading: false,
  collaspe: false,
  selectedPipeline: null,
  selectedConnectedPipeline: null,

  actions: {
    toggleCollapse() {
      this.toggleProperty('collaspe');
    },

    async handleSelectedConnectedPipeline(pipeline) {
      console.log('handleSelectedConnectedPipeline', pipeline);
      this.onClickConnectedPipeline(pipeline);
    },

    async handleSelectedPipeline(pipeline) {
      console.log('handleSelectedPipeline', pipeline);
      this.onSelectPipeline(pipeline);
    },

    async handleSearch(pipelineName) {
      let pipelines = [];

      try {
        pipelines = await this.onSearchPipeline(pipelineName);
      } catch (e) {

      } finally {

        return pipelines;
      }
    }
  }
});
