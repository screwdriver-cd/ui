import Component from '@glimmer/component';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { dom } from '@fortawesome/fontawesome-svg-core';

export default class PipelineChildrenTableComponent extends Component {
  @service('scm') scm;

  @service('shuttle') shuttle;

  @service('pipeline-page-state') pipelinePageState;

  @service('emt-themes/ember-bootstrap-v5') emberModelTableBootstrapTheme;

  @tracked data;

  constructor() {
    super(...arguments);

    this.data = this.pipelinePageState.getChildPipelines().map(pipeline => {
      const scm = this.scm.getScm(pipeline.scmContext);

      return {
        pipeline,
        id: pipeline.id,
        name: pipeline.name,
        branchName: pipeline.scmRepo.branch,
        scmRepo: pipeline.scmRepo,
        scmIcon: scm.iconType,
        scmName: scm.displayName,
        state: pipeline.state,
        onPipelineDeleted: pipelineId => {
          this.data = this.data.filter(d => d.id !== pipelineId);

          const updatedChildPipelines = this.pipelinePageState
            .getChildPipelines()
            .filter(p => p.id !== pipelineId);

          this.pipelinePageState.setChildPipelines(updatedChildPipelines);
        }
      };
    });
  }

  willDestroy() {
    super.willDestroy();

    this.args.onDestroy();
  }

  get theme() {
    const theme = this.emberModelTableBootstrapTheme;

    theme.table = 'table table-condensed table-hover table-sm';

    return theme;
  }

  get columns() {
    return [
      {
        title: 'NAME',
        propertyName: 'name',
        component: 'pipelineCell',
        className: 'pipeline-column'
      },
      {
        title: 'BRANCH',
        propertyName: 'branchName',
        component: 'branchCell',
        className: 'branch-column',
        filterFunction: this.data.map(d => d.branchName)
      },
      {
        title: 'ACCOUNT',
        propertyName: 'scmName',
        component: 'accountCell',
        className: 'account-column',
        filterWithSelect: true
      },
      {
        title: 'STATUS',
        propertyName: 'state',
        component: 'statusCell',
        className: 'status-column',
        filterWithSelect: true,
        predefinedFilterOptions: ['Active', 'Inactive'],
        filterFunction(val, filterVal) {
          return val.toLowerCase() === filterVal.toLowerCase();
        }
      },
      {
        title: 'ACTIONS',
        component: 'actionsCell',
        className: 'actions-column'
      }
    ];
  }

  @action
  initialize(element) {
    dom.i2svg({ node: element });
  }
}
