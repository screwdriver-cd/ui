import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed, set } from '@ember/object';
import { dom } from '@fortawesome/fontawesome-svg-core';
import { next } from '@ember/runloop';

export default Component.extend({
  direction: 'Down',
  dropdownOpen: false,
  theme: service('emt-themes/ember-bootstrap-v5'),
  data: [
    {
      job: 1,
      history: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 2,
      history: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 3,
      history: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 4,
      history: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 5,
      history: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 6,
      history: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 7,
      history: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 8,
      history: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 9,
      history: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 10,
      history: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 11,
      history: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 12,
      history: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 13,
      history: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 14,
      history: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 15,
      history: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 16,
      history: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 17,
      history: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 18,
      history: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 19,
      history: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 20,
      history: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 21,
      history: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 22,
      history: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 23,
      history: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 24,
      history: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 25,
      history: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 26,
      history: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 27,
      history: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 28,
      history: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 29,
      history: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 30,
      history: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 31,
      history: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 32,
      history: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 33,
      history: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 34,
      history: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 35,
      history: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 36,
      history: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 37,
      history: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 38,
      history: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 39,
      history: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 40,
      history: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 41,
      history: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 42,
      history: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 43,
      history: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 44,
      history: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 45,
      history: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 46,
      history: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 47,
      history: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 48,
      history: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 49,
      history: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 50,
      history: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 51,
      history: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 52,
      history: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    }
  ],
  columns: [
    {
      title: 'Job Name',
      propertyName: 'job'
    },
    {
      title: 'Build ID',
      propertyName: 'history'
    },
    {
      title: 'Status',
      propertyName: 'status'
    },
    {
      title: 'Start time',
      propertyName: 'startTime'
    },
    {
      title: 'Duration',
      propertyName: 'duration'
    },
    {
      title: 'Coverage',
      propertyName: 'coverage'
    },
    {
      title: 'Actions',
      propertyName: 'actions'
    }
  ],

  async init() {
    this._super(...arguments);

    const customTheme = {
      table: 'table table-condensed table-sm',
      footerSummaryNumericPagination: 'col-7',
      paginationWrapperNumeric: 'col-3',
      tableSummaryMsg: 'Showing %@ - %@ of %@ builds',
      sortAscIcon: 'fa fa-fw fa-sort-up',
      sortDescIcon: 'fa fa-fw fa-sort-down'
    };

    this.theme.setProperties(customTheme);

    this.set('filters', {
      job: '',
      status: ''
    });
  },

  didUpdate() {
    this._super(...arguments);

    next(() => {
      if (this.element) {
        dom.i2svg({ node: this.element });
      }
    });
  },

  filteredData: computed(
    'data.@each.{job,status}',
    'filters.{job,status}',
    function () {
      let { data } = this;

      let { filters } = this;

      return data.filter(item => {
        let matchesJob =
          !filters.job || item.job.toString().includes(filters.job);

        let matchesStatus =
          !filters.status || item.status.includes(filters.status);

        return matchesJob && matchesStatus;
      });
    }
  ),

  toggleChevronDirection() {
    let direction = 'Down';

    if (this.direction === 'Down') {
      direction = 'Up';
    }
    this.set('direction', direction);
  },

  actions: {
    updateStatus(newStatus) {
      set(this.filters, 'status', newStatus);
      this.toggleChevronDirection();
    },

    toggleDropdown(toggleAction) {
      this.toggleChevronDirection();
      if (typeof toggleAction === 'function') {
        toggleAction();
      }
    },

    handleBlur(event) {
      if (!event.relatedTarget || !this.element.contains(event.relatedTarget)) {
        this.toggleChevronDirection();
      }
    }
  }
});
