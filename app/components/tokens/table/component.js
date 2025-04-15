import Component from '@glimmer/component';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { dom } from '@fortawesome/fontawesome-svg-core';

export default class TokensTableComponent extends Component {
  @tracked data;

  @service('emt-themes/ember-bootstrap-v5') emberModelTableBootstrapTheme;

  tokens;

  constructor() {
    super(...arguments);

    this.tokens = this.args.tokens;
  }

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

    this.mapTokens();
  }

  @action
  updateTokens(element, [tokens]) {
    tokens.push(...this.tokens);
    this.tokens = tokens;

    this.mapTokens();
  }

  mapTokens() {
    this.data = this.tokens.map(token => {
      return {
        id: token.id,
        name: token.name,
        description: token.description,
        lastUsed: token.lastUsed,
        type: this.args.type,
        onUpdated: this.onTokenUpdated,
        onDeleted: this.onTokenDeleted,
        tokens: this.tokens
      };
    });
  }

  @action
  onTokenUpdated(updatedToken) {
    this.tokens = this.data.map(token => {
      return token.id === updatedToken.id ? updatedToken : token;
    });

    this.mapTokens();
  }

  @action
  onTokenDeleted(deletedToken) {
    this.tokens = this.data.filter(token => token.id !== deletedToken.id);

    this.mapTokens();
  }
}
