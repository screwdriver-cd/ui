import { sort } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { computed, observer } from '@ember/object';
import { debounce } from '@ember/runloop';

export default Component.extend({
  theme: service('emt-themes/ember-bootstrap-v5'),
  classNames: [''],
  data: [],
  model: null,
  search: null,
  query: null,
  collectionType: null,
  collectionDescription: null,
  routes: computed('collectionType', {
    get() {
      const prefix = this.collectionType.toLowerCase();

      return {
        prefix,
        detail: `${prefix}.detail`,
        namespace: `${prefix}.namespace`
      };
    }
  }),
  filteringNamespace: null,
  filteringMaintainer: null,
  sort: 'createTime',
  dir: 'desc',
  init() {
    this._super(...arguments);

    this.set('data', this.refinedModel);
  },
  filteredModel: computed(
    'filteringNamespace',
    'filteringMaintainer',
    'search',
    'trustedOnly',
    'model',
    {
      get() {
        const ns = this.filteringNamespace;
        const maintainer = this.filteringMaintainer;
        const { search, trustedOnly } = this;

        return this.model.filter(m => {
          let result = true;

          if (trustedOnly && !m.trusted) {
            return false;
          }

          if (ns) {
            result = result && m.namespace === ns;
          }

          if (result && maintainer) {
            result = result && m.maintainer === maintainer;
          }

          if (result && search) {
            result =
              result &&
              (m.namespace.toLowerCase().includes(search) ||
                m.name.toLowerCase().includes(search) ||
                m.description.toLowerCase().includes(search) ||
                m.maintainer.toLowerCase().includes(search));
          }

          return result;
        });
      }
    }
  ),
  refinedModel: sort('filteredModel', 'sortBy'),
  sortBy: computed('dir', 'sort', {
    get() {
      return [`${this.sort}:${this.dir}`];
    }
  }),
  namespaces: computed('model', {
    get() {
      return this.model.mapBy('namespace').uniq().sort();
    }
  }),
  maintainers: computed('model', {
    get() {
      return this.model.mapBy('maintainer').uniq().sort();
    }
  }),
  columns: computed(() => [
    {
      title: 'Name',
      component: 'tcCollectionLinker',
      resizable: true,
      width: '20%',
      minResizeWidth: 175
    },
    {
      title: 'Description',
      propertyName: 'description',
      disableSorting: true,
      resizable: true,
      width: '30%',
      minResizeWidth: 350
    },
    {
      title: 'Namespace',
      component: 'tcCollectionNamespaceLinker',
      resizable: true,
      width: '15%',
      minResizeWidth: 150
    },
    {
      title: 'Updated',
      propertyName: 'lastUpdated',
      sortBy: 'createTime',
      resizable: true,
      width: '15%',
      minResizeWidth: 100
    },
    {
      title: 'Released By',
      propertyName: 'maintainer',
      resizable: true,
      width: '20%',
      minResizeWidth: 150
    }
  ]),
  refineModel() {
    this.data = this.refinedModel;
  },
  onSearch() {
    const search = this.query.trim().toLowerCase();

    this.set('search', search);

    if (!search) {
      if (this.filteringNamespace) {
        this.set(
          'maintainers',
          this.filteredModel.mapBy('maintainer').uniq().sort()
        );
      }
      if (this.filteringMaintainer) {
        this.set(
          'namespaces',
          this.filteredModel.mapBy('namespace').uniq().sort()
        );
      }
    }

    this.refineModel();
  },
  // eslint-disable-next-line ember/no-observers
  onQuery: observer('query', function onSearchChange() {
    debounce(this, 'onSearch', 250);
  }),
  actions: {
    onFilterNamespace(ns) {
      this.set('filteringNamespace', ns || null);
      this.set(
        'maintainers',
        this.get(ns ? 'filteredModel' : 'model')
          .mapBy('maintainer')
          .uniq()
          .sort()
      );
      if (!ns) {
        this.set(
          'namespaces',
          this.filteredModel.mapBy('namespace').uniq().sort()
        );
      }
      this.refineModel();
    },
    onFilterMaintainer(m) {
      this.set('filteringMaintainer', m || null);
      this.set(
        'namespaces',
        this.get(m ? 'filteredModel' : 'model')
          .mapBy('namespace')
          .uniq()
          .sort()
      );
      if (!m) {
        this.set(
          'maintainers',
          this.filteredModel.mapBy('maintainer').uniq().sort()
        );
      }
      this.refineModel();
    },
    toggleTrustedOnly(trustedOnly) {
      this.set('trustedOnly', trustedOnly);
      this.refineModel();
    }
  }
});
