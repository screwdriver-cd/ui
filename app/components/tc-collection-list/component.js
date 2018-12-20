import Component from '@ember/component';
import { computed, observer } from '@ember/object';
import Table from 'ember-light-table';
import { debounce } from '@ember/runloop';

export default Component.extend({
  classNames: [''],
  table: null,
  model: null,
  search: null,
  query: null,
  collectionType: null,
  collectionDescription: null,
  routes: computed('collectionType', {
    get() {
      const prefix = this.get('collectionType').toLowerCase();

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

    let table = new Table(this.get('columns'), this.get('refinedModel'));
    let sortColumn = table.get('allColumns').findBy('valuePath', this.get('sort'));

    // Setup initial sort column
    if (sortColumn) {
      sortColumn.set('sorted', true);
    }

    this.set('table', table);
  },
  filteredModel: computed('filteringNamespace', 'filteringMaintainer', 'search', 'model', {
    get() {
      const ns = this.get('filteringNamespace');
      const maintainer = this.get('filteringMaintainer');
      const search = this.get('search');

      return this.get('model').filter((m) => {
        let result = true;

        if (ns) {
          result = result && m.namespace === ns;
        }

        if (result && maintainer) {
          result = result && m.maintainer === maintainer;
        }

        if (result && search) {
          result = result && (
            m.namespace.includes(search) ||
            m.name.includes(search) ||
            m.description.includes(search) ||
            m.maintainer.includes(search)
          );
        }

        return result;
      });
    }
  }),
  refinedModel: computed.sort('filteredModel', 'sortBy'),
  sortBy: computed('dir', 'sort', {
    get() {
      return [`${this.get('sort')}:${this.get('dir')}`];
    }
  }),
  namespaces: computed('model', {
    get() {
      return this.get('model').mapBy('namespace').uniq().sort();
    }
  }),
  maintainers: computed('model', {
    get() {
      return this.get('model').mapBy('maintainer').uniq().sort();
    }
  }),
  columns: computed(() => [
    {
      label: 'Name',
      valuePath: 'name',
      cellComponent: 'tc-collection-linker',
      resizable: true,
      width: '20%',
      minResizeWidth: 175
    },
    {
      label: 'Description',
      sortable: false,
      valuePath: 'description',
      resizable: true,
      width: '30%',
      minResizeWidth: 350
    },
    {
      label: 'Namespace',
      valuePath: 'namespace',
      cellComponent: 'tc-collection-linker',
      resizable: true,
      width: '15%',
      minResizeWidth: 150
    },
    {
      label: 'Updated',
      valuePath: 'lastUpdated',
      resizable: true,
      width: '10%',
      minResizeWidth: 100
    },
    {
      label: 'Version',
      sortable: false,
      valuePath: 'version',
      resizable: true,
      width: '10%',
      minResizeWidth: 100
    },
    {
      label: 'Released By',
      sortable: true,
      valuePath: 'maintainer',
      resizable: true,
      width: '15%',
      minResizeWidth: 150
    }
  ]),
  refineModel() {
    this.get('table').setRows(this.get('refinedModel'));
  },
  onSearch() {
    const search = this.get('query').trim();

    this.set('search', search);

    if (!search) {
      if (this.get('filteringNamespace')) {
        this.set('maintainers', this.get('filteredModel').mapBy('maintainer').uniq().sort());
      }
      if (this.get('filteringMaintainer')) {
        this.set('namespaces', this.get('filteredModel').mapBy('namespace').uniq().sort());
      }
    }

    this.refineModel();
  },
  onQuery: observer('query', function onSearchChange() {
    debounce(this, 'onSearch', 250);
  }),
  actions: {
    sortByColumn(column) {
      if (column.sorted) {
        let vp = column.get('valuePath');

        this.setProperties({
          dir: column.ascending ? 'asc' : 'desc',
          sort: vp === 'lastUpdated' ? 'createTime' : vp
        });
        this.refineModel();
      }
    },
    onFilterNamespace(ns) {
      this.set('filteringNamespace', ns || null);
      this.set(
        'maintainers',
        this.get(
          ns ? 'filteredModel' : 'model'
        ).mapBy('maintainer').uniq().sort()
      );
      if (!ns) {
        this.set('namespaces', this.get('filteredModel').mapBy('namespace').uniq().sort());
      }
      this.refineModel();
    },
    onFilterMaintainer(m) {
      this.set('filteringMaintainer', m || null);
      this.set(
        'namespaces',
        this.get(
          m ? 'filteredModel' : 'model'
        ).mapBy('namespace').uniq().sort()
      );
      if (!m) {
        this.set('maintainers', this.get('filteredModel').mapBy('maintainer').uniq().sort());
      }
      this.refineModel();
    }
  }
});
