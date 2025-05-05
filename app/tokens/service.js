import Service, { service } from '@ember/service';

export default class TokensService extends Service {
  @service shuttle;

  tokens;

  tokenNames;

  constructor() {
    super(...arguments);

    this.tokens = [];
    this.tokenNames = [];
  }

  clear() {
    this.tokens = [];
    this.tokenNames = [];
  }

  async fetchTokens(pipelineId) {
    this.clear();

    const url = pipelineId ? `/pipelines/${pipelineId}/tokens` : '/tokens';

    return this.shuttle
      .fetchFromApi('get', url)
      .then(tokens => {
        this.tokens = tokens;
        tokens.forEach(token => {
          this.tokenNames.push(token.name);
        });
      })
      .catch(err => {
        return err.message;
      });
  }

  addToken(newToken) {
    this.tokens.splice(0, 0, newToken);
    this.tokenNames.splice(0, 0, newToken.name);
  }

  updateToken(updatedToken) {
    const index = this.tokens.findIndex(token => token.id === updatedToken.id);

    this.tokens[index] = updatedToken;
    this.tokenNames[index] = updatedToken.name;
  }

  deleteToken(deletedToken) {
    const index = this.tokens.findIndex(token => token.id === deletedToken.id);

    this.tokens.splice(index, 1);
    this.tokenNames.splice(index, 1);
  }
}
