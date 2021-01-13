import { sort } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { computed } from '@ember/object';
import Table from 'ember-light-table';

export default Component.extend({
  template: service(),
  command: service(),
  classNames: [''],
  table: null,
  model: null,
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

    let table = Table.create({ columns: this.columns, rows: this.refinedModel });

    let sortColumn = table.get('allColumns').findBy('valuePath', this.sort);

    // Setup initial sort column
    if (sortColumn) {
      sortColumn.set('sorted', true);
    }

    this.set('table', table);
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
        const { trustedOnly } = this;

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
      return this.model
        .mapBy('namespace')
        .uniq()
        .sort();
    }
  }),
  maintainers: computed('model', {
    get() {
      return this.model
        .mapBy('maintainer')
        .uniq()
        .sort();
    }
  }),
  columns: computed(function columns() {
    return [
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
        width: '15%',
        minResizeWidth: 100
      },
      {
        label: 'Released By',
        sortable: true,
        valuePath: 'maintainer',
        resizable: true,
        width: '20%',
        minResizeWidth: 150
      }
    ];
  }),
  refineModel() {
    this.table.setRows(this.refinedModel);
  },
  actions: {
    search() {
      if (this.collectionType === 'Commands') {
        this.command
          .getAllCommands({ search: this.query })
          .then(model => this.setProperties({ model }));
      } else if (this.collectionType === 'Templates') {
        this.template
          .getAllTemplates({ search: this.query })
          .then(model => this.setProperties({ model }));
      }
      this.table.setRows(this.model);
    },
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
        this.get(ns ? 'filteredModel' : 'model')
          .mapBy('maintainer')
          .uniq()
          .sort()
      );
      if (!ns) {
        this.set(
          'namespaces',
          this.filteredModel
            .mapBy('namespace')
            .uniq()
            .sort()
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
          this.filteredModel
            .mapBy('maintainer')
            .uniq()
            .sort()
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
