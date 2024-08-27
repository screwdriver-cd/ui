import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { dom } from '@fortawesome/fontawesome-svg-core';
import { next } from '@ember/runloop';
import { statusIcon } from 'screwdriver-ui/utils/build';

export default class NewUIBuildsTable extends Component {
  @tracked direction = 'Down';

  @tracked dropdownOpen = false;

  @service('emt-themes/ember-bootstrap-v5') themeInstance;

  @tracked data = [
    {
      job: 1,
      buildid: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 2,
      buildid: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 3,
      buildid: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 4,
      buildid: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 5,
      buildid: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 6,
      buildid: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 7,
      buildid: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 8,
      buildid: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 9,
      buildid: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 10,
      buildid: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 11,
      buildid: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 12,
      buildid: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 13,
      buildid: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 14,
      buildid: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 15,
      buildid: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 16,
      buildid: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 17,
      buildid: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 18,
      buildid: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 19,
      buildid: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 20,
      buildid: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 21,
      buildid: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 22,
      buildid: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 23,
      buildid: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 24,
      buildid: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 25,
      buildid: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 26,
      buildid: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 27,
      buildid: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 28,
      buildid: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 29,
      buildid: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 30,
      buildid: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 31,
      buildid: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 32,
      buildid: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 33,
      buildid: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 34,
      buildid: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 35,
      buildid: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 36,
      buildid: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 37,
      buildid: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 38,
      buildid: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 39,
      buildid: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 40,
      buildid: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 41,
      buildid: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 42,
      buildid: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 43,
      buildid: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 44,
      buildid: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 45,
      buildid: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 46,
      buildid: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 47,
      buildid: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 48,
      buildid: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 49,
      buildid: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 50,
      buildid: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 51,
      buildid: 'xx',
      status: 'Success',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    },
    {
      job: 52,
      buildid: 'xx',
      status: 'Failed',
      startTime: 'xxx',
      duration: 'xxxx',
      coverage: 'xxxx',
      actions: 'xxxx'
    }
  ];

  @tracked columns = [
    {
      title: 'Job Name',
      propertyName: 'job'
    },
    {
      title: 'Build ID',
      propertyName: 'buildid'
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
  ];

  get icon() {
    return statusIcon(this.args.commitShaDetails.status, true);
  }

  constructor() {
    super(...arguments);

    const customTheme = {
      table: 'table table-condensed table-sm',
      footerSummaryNumericPagination: 'col-7',
      paginationWrapperNumeric: 'col-3',
      tableSummaryMsg: 'Showing %@ - %@ of %@ builds',
      sortAscIcon: 'fa fa-fw fa-sort-up',
      sortDescIcon: 'fa fa-fw fa-sort-down'
    };

    this.themeInstance.setProperties(customTheme);
  }

  @tracked filters = {
    job: '',
    status: ''
  };

  @action
  convertIcons(element) {
    next(() => {
      if (element) {
        setTimeout(() => {
          dom.i2svg({ node: element });
        }, 0);
      }
    });
  }

  @action
  attachHeaderListeners(element) {
    let headers = element.querySelectorAll('.models-table-wrapper th');

    headers.forEach(header => {
      header.addEventListener('click', () => {
        this.convertIcons(header);
      });
    });
  }

  get filteredData() {
    let { data, filters } = this;

    return data.filter(item => {
      let matchesJob =
        !filters.job || item.job.toString().includes(filters.job);

      let matchesStatus =
        !filters.status || item.status.includes(filters.status);

      return matchesJob && matchesStatus;
    });
  }

  @action
  updateJobFilter(event) {
    this.filters = {
      ...this.filters,
      job: event.target.value
    };
  }

  @action
  updateStatusFilter(event) {
    this.filters = {
      ...this.filters,
      status: event.target.value
    };
  }

  @action
  toggleChevronDirection() {
    if (this.direction === 'Down') {
      this.direction = 'Up';
    } else {
      this.direction = 'Down';
    }
  }

  @action
  updateStatus(newStatus) {
    this.filters = {
      ...this.filters,
      status: newStatus
    };
    this.toggleChevronDirection();
  }

  @action
  toggleDropdown(toggleAction) {
    this.toggleChevronDirection();
    if (typeof toggleAction === 'function') {
      toggleAction();
    }
  }

  @action
  handleBlur(event) {
    if (!event.relatedTarget) {
      this.toggleChevronDirection();
    }
  }
}
