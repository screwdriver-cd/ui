import Component from '@ember/component';

export default Component.extend({
  tagName: '',
  searchTerm: '',

  actions: {
    searchPipelines() {
      this.searchPipelines(this.searchTerm);
    },
    selectSearchedPipeline(pipelineId) {
      this.selectSearchedPipeline(pipelineId);
    }
  }
});
