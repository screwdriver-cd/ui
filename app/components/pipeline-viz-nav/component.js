import Component from '@ember/component';

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
      this.onClickConnectedPipeline(pipeline);
    },

    async handleSelectedPipeline(pipeline) {
      this.onSelectPipeline(pipeline);
    },

    async handleSearch(pipelineName) {
      try {
        const pipelines = await this.onSearchPipeline(pipelineName);

        return pipelines;
      } catch (e) {
        return [];
      }
    }
  }
});
