import { inspect } from '@ember/debug';
import { computed } from '@ember/object';
import { sort, empty } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Component from '@ember/component';

export default Component.extend({
  session: service(),
  scmService: service('scm'),
  pipelineSorting: ['appId', 'branch'],
  addCollectionError: null,
  addCollectionSuccess: null,
  sortedPipelines: sort('pipelines', 'pipelineSorting'),
  isEmpty: empty('filteredPipelines'),
  filterSet: computed('query', {
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
  filteredPipelines: computed('sortedPipelines', 'filterSet', {
    get() {
      const scmService = this.get('scmService');
      const pipelines = this.get('sortedPipelines');
      const filterSet = this.get('filterSet');
      let filtered = pipelines;

      filterSet.forEach((filter) => {
        filtered = filtered.filter((p) => {
          const field = inspect(p.get(filter.key));

          // skip filtering if value is empty
          return !filter.value || (field && field.indexOf(filter.value) > -1);
        });
      });

      // add scm contexts into pipelines.
      return filtered.map((pipeline) => {
        const scm = scmService.getScm(pipeline.get('scmContext'));

        pipeline.set('scm', scm.displayName);
        pipeline.set('scmIcon', scm.iconType);

        return pipeline;
      });
    }
  }),
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
