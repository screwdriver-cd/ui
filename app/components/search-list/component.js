import Ember from 'ember';

export default Ember.Component.extend({
  pipelineSorting: ['appId', 'branch'],
  sortedPipelines: Ember.computed.sort('pipelines', 'pipelineSorting'),
  filteredPipelines: Ember.computed('query', 'sortedPipelines', {
    get() {
      const pipelines = this.get('sortedPipelines');
      const q = this.get('query') || '';
      const filtered = pipelines.filter(p => p.get('appId').indexOf(q) > -1);

      return filtered;
    }
  }),
  isEmpty: Ember.computed.empty('filteredPipelines')
});
