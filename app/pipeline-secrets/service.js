import Service, { service } from '@ember/service';

export default class PipelineSecretsService extends Service {
  @service shuttle;

  secrets;

  inheritedSecrets;

  secretNames;

  constructor() {
    super(...arguments);

    this.secrets = new Map();
    this.inheritedSecrets = new Map();
    this.secretNames = [];
  }

  clear() {
    this.secrets.clear();
    this.inheritedSecrets.clear();
    this.secretNames = [];
  }

  async fetchSecrets(pipelineId, parentPipelineId) {
    this.clear();

    const pipelineSecretsPromise = this.shuttle.fetchFromApi(
      'get',
      `/pipelines/${pipelineId}/secrets`
    );

    if (parentPipelineId) {
      const inheritedSecretsPromise = this.shuttle.fetchFromApi(
        'get',
        `/pipelines/${parentPipelineId}/secrets`
      );

      return Promise.all([pipelineSecretsPromise, inheritedSecretsPromise])
        .then(([secrets, inheritedSecrets]) => {
          secrets.forEach(secret => {
            this.secrets.set(secret.name, secret);
          });
          inheritedSecrets.forEach(secret => {
            this.inheritedSecrets.set(secret.name, secret);
          });
          this.extractSecretNames(secrets);
        })
        .catch(err => {
          return err.message;
        });
    }

    return pipelineSecretsPromise
      .then(secrets => {
        secrets.forEach(secret => {
          this.secrets.set(secret.name, secret);
        });
        this.extractSecretNames(secrets);
      })
      .catch(err => {
        return err.message;
      });
  }

  extractSecretNames(secrets) {
    this.secretNames = secrets.map(secret => secret.name);
  }

  addSecret(secret) {
    const { name } = secret;

    this.secrets.set(name, secret);
    this.secretNames.push(name);
  }

  replaceSecret(secret) {
    this.secrets.set(secret.name, secret);
  }

  deleteSecret(secret) {
    const { name } = secret;

    if (this.inheritedSecrets.has(name)) {
      this.secrets.set(name, this.inheritedSecrets.get(name));
    } else {
      this.secrets.delete(name);
      this.secretNames.splice(this.secretNames.indexOf(name), 1);
    }
  }
}
