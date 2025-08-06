import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { dom } from '@fortawesome/fontawesome-svg-core';
import {
  getDisplayName,
  getStageName
} from 'screwdriver-ui/utils/pipeline/job';

export default class PipelineSettingsMetricsTableComponent extends Component {
  @service('pipeline-page-state') pipelinePageState;

  @service('emt-themes/ember-bootstrap-v5') emberModelTableBootstrapTheme;

  @tracked data;

  @tracked selectedJobs = [];

  @tracked isToggleMultipleModalOpen = false;

  jobs;

  downtimeJobIds;

  jobIdsDisplaying;

  constructor() {
    super(...arguments);

    const stages = new Set();

    this.jobs = new Map();

    this.pipelinePageState
      .getJobs()
      .filter(job => {
        return !job.prParentJobId;
      })
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach(job => {
        this.jobs.set(job.id, job);

        if (job.stage) {
          stages.add(job.stage);
        }
      });

    this.getDowntimeJobIds();
    this.setJobsData();
    this.stagesFilter = Array.from(stages).sort((a, b) => a.localeCompare(b));
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
      }
    ];

    const jobIncludedColumn = {
      title: 'INCLUDED',
      className: 'included-column',
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
      jobIncludedColumn.propertyName = 'included';
      jobIncludedColumn.filterWithSelect = true;
      jobIncludedColumn.predefinedFilterOptions = ['EXCLUDED', 'INCLUDED'];
      jobIncludedColumn.filterFunction = (val, filterVal, row) => {
        if (filterVal === 'EXCLUDED') {
          return row.included === false;
        }

        return row.included;
      };
    }

    columns.push(jobIncludedColumn);

    return columns;
  }

  getDowntimeJobIds() {
    this.downtimeJobIds =
      this.pipelinePageState.getPipeline().settings.metricsDowntimeJobs || [];

    if (this.downtimeJobIds.length === 0) {
      this.jobs.forEach((job, jobId) => {
        this.downtimeJobIds.push(jobId);
      });
    }
  }

  reloadData() {
    this.getDowntimeJobIds();
    this.setJobsData();
  }

  setJobsData() {
    this.jobIdsDisplaying = new Set();
    this.data = [];
    this.jobs.forEach((job, jobId) => {
      if (this.args.isToggleMultiple) {
        if (this.args.isInclude) {
          if (this.downtimeJobIds.includes(jobId)) {
            return;
          }
        } else if (!this.downtimeJobIds.includes(jobId)) {
          return;
        }
      }

      this.jobIdsDisplaying.add(jobId);
      this.data.push({
        id: jobId,
        name: getDisplayName(job),
        stage: getStageName(job),
        included: this.downtimeJobIds.includes(jobId),
        onJobUpdated: () => {
          this.reloadData();
        }
      });
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
      this.reloadData();
      this.selectedJobs = [];
    }
  }
}
