import Component from '@glimmer/component';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { dom } from '@fortawesome/fontawesome-svg-core';

export default class PipelineSecretsAndTokensTableComponent extends Component {
  @service('pipeline-page-state') pipelinePageState;

  @service('pipeline-secrets') pipelineSecrets;

  @service('emt-themes/ember-bootstrap-v5') emberModelTableBootstrapTheme;

  @tracked data;

  get columns() {
    return [
      {
        title: 'KEY',
        propertyName: 'name',
        className: 'key-column',
        filteredBy: 'name'
      },
      {
        title: 'ALLOWED IN PR',
        propertyName: 'allowedInPr',
        className: 'allow-in-pr-column',
        component: 'allowedInPrCell',
        filteredBy: 'allowInPr',
        filterWithSelect: true,
        predefinedFilterOptions: ['Yes', 'No'],
        filterFunction: (_val, filterVal, row) => {
          if (filterVal === 'Yes') {
            return row.allowInPr === true;
          }

          return row.allowInPr === false;
        }
      },
      {
        title: 'INHERITED',
        propertyName: 'inherited',
        className: 'inherited-column',
        component: 'inheritedCell',
        filteredBy: 'inherited',
        filterWithSelect: true,
        predefinedFilterOptions: ['Yes', 'No'],
        filterFunction: (_val, filterVal, row) => {
          if (filterVal === 'Yes') {
            return row.inherited === true;
          }

          return row.inherited === false;
        }
      },
      {
        title: 'ACTIONS',
        className: 'actions-column',
        component: 'actionsCell'
      }
    ];
  }

  get theme() {
    const theme = this.emberModelTableBootstrapTheme;

    theme.table = 'table table-condensed table-hover table-sm';

    return theme;
  }

  @action
  async initialize(element) {
    dom.i2svg({ node: element });
  }

  @action
  mapSecrets() {
    const { inheritedSecrets } = this.pipelineSecrets;
    const secrets = Array.from(this.pipelineSecrets.secrets.values()).sort(
      (a, b) => a.name.localeCompare(b.name)
    );

    this.data = secrets.map(secret => {
      return {
        id: secret.id,
        name: secret.name,
        allowInPr: secret.allowInPR,
        pipelineId: secret.pipelineId,
        inherited: inheritedSecrets.has(secret.name),
        overridden: inheritedSecrets.has(secret.name)
          ? secret.pipelineId === this.pipelinePageState.getPipelineId()
          : false,
        onSuccess: this.mapSecrets
      };
    });
  }
}
