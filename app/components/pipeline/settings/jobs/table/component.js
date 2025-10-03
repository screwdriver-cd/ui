import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { dom } from '@fortawesome/fontawesome-svg-core';
import {
  getDisplayName,
  getStageName
} from 'screwdriver-ui/utils/pipeline/job';

export default class PipelineSettingsJobsTableComponent extends Component {
  @service session;

  @service('pipeline-page-state') pipelinePageState;

  @service('emt-themes/ember-bootstrap-v5') emberModelTableBootstrapTheme;

  @tracked data;

  @tracked selectedJobs = [];

  @tracked isToggleMultipleModalOpen = false;

  usersFilter;

  stagesFilter;

  jobIdsDisplaying;

  constructor() {
    super(...arguments);

    const users = new Set([this.session.data.authenticated.username]);
    const stages = new Set();

    this.setJobsData();
    this.data.forEach(job => {
      if (job.user) {
        users.add(job.user);
      }
      if (job.stage) {
        stages.add(job.stage);
      }
    });

    this.usersFilter = Array.from(users).sort((a, b) => a.localeCompare(b));
    this.stagesFilter = Array.from(stages).sort((a, b) => a.localeCompare(b));
  }

  willDestroy() {
    super.willDestroy();

    this.args.onDestroy();
  }

  get theme() {
    const theme = this.emberModelTableBootstrapTheme;

    theme.table = 'table table-condensed table-hover table-sm';
    theme.selectAllRowsIcon = 'fa fa-fw fa-regular fa-square-check';
    theme.deselectAllRowsIcon = 'fa fa-fw fa-regular fa-square';
    theme.selectSomeRowsIcon = 'fa fa-fw fa-regular fa-square-minus';
    theme.selectRowIcon = 'fa fa-fw fa-regular fa-square-check';
    theme.deselectRowIcon = 'fa fa-fw fa-regular fa-square';

    return theme;
  }

  get columns() {
    const columns = [
      {
        title: 'JOB',
        propertyName: 'name',
        className: 'job-column',
        filteredBy: 'name'
      },
      {
        title: 'STAGE',
        propertyName: 'stage',
        className: 'stage-column',
        filterWithSelect: true,
        predefinedFilterOptions: this.stagesFilter
      },
      {
        title: 'USER',
        propertyName: 'user',
        className: 'user-column',
        filterWithSelect: true,
        predefinedFilterOptions: this.usersFilter
      },
      {
        title: 'MESSAGE',
        propertyName: 'message',
        className: 'message-column'
      },
      {
        title: 'DATE',
        className: 'date-column',
        component: 'dateCell'
      }
    ];

    const jobStateColumn = {
      title: 'ENABLED',
      className: 'enabled-column',
      component: 'toggleCell'
    };

    if (this.args.isToggleMultiple) {
      columns.splice(0, 0, {
        component: this.theme.rowSelectCheckboxComponent,
        mayBeHidden: false,
        componentForSortCell: this.theme.rowSelectAllCheckboxComponent,
        className: 'row-select-column'
      });
    } else {
      jobStateColumn.propertyName = 'state';
      jobStateColumn.filterWithSelect = true;
      jobStateColumn.predefinedFilterOptions = ['ENABLED', 'DISABLED'];
    }

    columns.push(jobStateColumn);

    return columns;
  }

  get numberOfSelectedJobs() {
    return this.selectedJobs.length;
  }

  get toggleAction() {
    return this.args.isEnable ? 'Enable' : 'Disable';
  }

  get toggleText() {
    return `${this.toggleAction} selected jobs`;
  }

  setJobsData() {
    this.jobIdsDisplaying = new Set();
    this.data = this.pipelinePageState
      .getJobs()
      .filter(job => {
        if (job.prParentJobId) {
          return false;
        }

        if (this.args.isToggleMultiple) {
          const jobState = this.args.isEnable ? 'DISABLED' : 'ENABLED';

          return job.state === jobState;
        }

        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(job => {
        this.jobIdsDisplaying.add(job.id);

        return {
          id: job.id,
          name: getDisplayName(job),
          state: job.state,
          stage: getStageName(job),
          message: job.stateChangeMessage,
          date: job.stateChangeTime,
          user: job.stateChanger,
          onJobUpdated: () => {
            this.setJobsData();
          }
        };
      });
  }

  @action
  async initialize(element) {
    dom.watch({
      autoReplaceSvgRoot: element,
      observeMutationsRoot: element
    });
  }

  @action
  onDisplayDataChanged(displaySettings) {
    if (this.args.isToggleMultiple) {
      this.selectedJobs = displaySettings.selectedItems
        .filter(job => this.jobIdsDisplaying.has(job.id))
        .map(job => {
          return {
            id: job.id,
            name: job.name,
            state: job.state
          };
        });
    }
  }

  @action
  toggleMultipleJobs() {
    this.isToggleMultipleModalOpen = true;
  }

  @action
  closeToggleMultipleModal(updated) {
    this.isToggleMultipleModalOpen = false;

    if (updated) {
      this.setJobsData();
      this.selectedJobs = [];
    }
  }
}
