import Component from '@glimmer/component';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { dom } from '@fortawesome/fontawesome-svg-core';

export default class TokensTableComponent extends Component {
  @service('tokens') tokensService;

  @service('emt-themes/ember-bootstrap-v5') emberModelTableBootstrapTheme;

  @tracked data;

  get columns() {
    return [
      {
        title: 'NAME',
        propertyName: 'name',
        className: 'name-column',
        filteredBy: 'name'
      },
      {
        title: 'DESCRIPTION',
        propertyName: 'description',
        className: 'description-column',
        filteredBy: 'description'
      },
      {
        title: 'LAST USED',
        className: 'last-used-column',
        component: 'lastUsedCell'
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
  mapTokens() {
    this.data = this.tokensService.tokens.map(token => {
      return {
        id: token.id,
        name: token.name,
        description: token.description,
        lastUsed: token.lastUsed,
        type: this.args.type,
        onSuccess: this.mapTokens
      };
    });
  }
}
