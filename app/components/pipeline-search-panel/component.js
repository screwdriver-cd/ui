import Component from '@ember/component';

export default Component.extend({
  searchTerm: '',

  actions: {
    searchPipelines() {
      this.searchPipelines(this.searchTerm);
    },
    cancelSearch() {
      this.cancelSearch();
    },
    selectSearchedPipeline(pipelineId) {
      this.selectSearchedPipeline(pipelineId);
    }
  }
});
