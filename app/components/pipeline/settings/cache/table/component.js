import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { dom } from '@fortawesome/fontawesome-svg-core';
import {
  getDisplayName,
  getStageName
} from 'screwdriver-ui/utils/pipeline/job';

export default class PipelineSettingsCacheTableComponent extends Component {
  @service('shuttle') shuttle;

  @service('pipeline-page-state') pipelinePageState;

  @service('emt-themes/ember-bootstrap-v5') emberModelTableBootstrapTheme;

  @tracked data;

  @tracked isClearJobsCacheModalOpen = false;

  @tracked selectedJobs = new Set();

  clearedJobIds = new Set();

  constructor() {
    super(...arguments);

    const stages = new Set();

    this.setJobsData();
    this.data.forEach(job => {
      if (job.stage) {
        stages.add(job.stage);
      }
    });

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
    return [
      {
        component: this.theme.rowSelectCheckboxComponent,
        mayBeHidden: false,
        componentForSortCell: this.theme.rowSelectAllCheckboxComponent,
        className: 'row-select-column'
      },
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
        title: 'CLEAR CACHE',
        component: 'actionCell',
        className: 'action-column'
      }
    ];
  }

  setJobsData() {
    const pipelineId = this.pipelinePageState.getPipelineId();

    this.data = this.pipelinePageState
      .getJobs()
      .filter(job => {
        if (job.prParentJobId) {
          return false;
        }

        return !this.clearedJobIds.has(job.id);
      })
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(job => {
        return {
          id: job.id,
          name: getDisplayName(job),
          pipelineId,
          stage: getStageName(job),
          onCacheActionComplete: () => {
            this.clearedJobIds.add(job.id);
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
    this.selectedJobs = new Set(
      displaySettings.selectedItems
        .map(job => {
          return {
            id: job.id,
            name: job.name
          };
        })
        .filter(job => !this.clearedJobIds.has(job.id))
    );
  }

  get isClearJobsCacheButtonDisabled() {
    return this.selectedJobs.size === 0;
  }

  @action
  openClearJobsCacheModal() {
    this.isClearJobsCacheModalOpen = true;
  }

  @action
  closeClearJobsCacheModal(wasSuccessful, clearedJobIds) {
    this.isClearJobsCacheModalOpen = false;

    if (clearedJobIds.length > 0) {
      clearedJobIds.forEach(jobId => {
        this.clearedJobIds.add(jobId);
      });

      const unclearedJobs = new Set();

      this.selectedJobs.forEach(job => {
        if (!this.clearedJobIds.has(job.id)) {
          unclearedJobs.add(job);
        }
      });

      this.selectedJobs = unclearedJobs;

      this.setJobsData();
    }
  }
}
