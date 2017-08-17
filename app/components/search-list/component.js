import Ember from 'ember';

export default Ember.Component.extend({
  session: Ember.inject.service(),
  pipelineSorting: ['appId', 'branch'],
  sortedPipelines: Ember.computed.sort('pipelines', 'pipelineSorting'),
  filterSet: Ember.computed('query', {
    get() {
      const q = this.get('query') || '';
      const keywords = q.split(/\s+/);
      const filters = keywords.map((k) => {
        let pair = k.split(/:/);

        if (k.match(/[A-Za-z]+:[^ :]+/)) {
          return { key: pair[0], value: pair[1] };
        }

        // By default, search appId by keywords
        return { key: 'appId', value: k };
      });

      return filters;
    }
  }),
  filteredPipelines: Ember.computed('sortedPipelines', 'filterSet', {
    get() {
      const pipelines = this.get('sortedPipelines');
      const filterSet = this.get('filterSet');
      let filtered = pipelines;

      filterSet.forEach((filter) => {
        filtered = filtered.filter((p) => {
          const field = Ember.inspect(p.get(filter.key));

          // skip filtering if value is empty
          return !filter.value || (field && field.indexOf(filter.value) > -1);
        });
      });

      return filtered;
    }
  }),
  isEmpty: Ember.computed.empty('filteredPipelines'),
  addCollectionError: null,
  addCollectionSuccess: null,
  actions: {
    addToCollection(pipelineId, collection) {
      return this.get('onAddToCollection')(+pipelineId, collection.id)
        .then(() => {
          this.set('addCollectionError', null);
          this.set('addCollectionSuccess',
            `Successfully added Pipeline to ${collection.get('name')}`);
        })
        .catch(() => {
          this.set('addCollectionError', `Could not add Pipeline to ${collection.get('name')}`);
          this.set('addCollectionSuccess', null);
        });
    }
  }
});
