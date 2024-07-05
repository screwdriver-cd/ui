import Controller from '@ember/controller';
import { service } from '@ember/service';
import { action } from '@ember/object';

export default class PipelineOptionsController extends Controller {
  @service session;

  @service router;

  errorMessage = '';

  isSaving = false;

  get pipeline() {
    return this.model.pipeline;
  }

  get jobs() {
    return this.model.jobs;
  }

  @action
  async removePipeline() {
    const currentPipeline = await this.store.findRecord(
      'pipeline',
      this.pipeilne.id
    );

    currentPipeline
      .destroyRecord()
      .then(() => {
        this.router.transitionTo('home');
      })
      .catch(err => {
        this.errorMessage = err.errors[0].detail || '';
      });
  }

  @action
  async updatePipeline({ scmUrl, rootDir }) {
    const { pipeline } = this;

    pipeline.setProperties({
      checkoutUrl: scmUrl,
      rootDir
    });
    this.isSaving = true;

    const currentPipeline = await this.store.findRecord(
      'pipeline',
      this.pipeline.id
    );

    currentPipeline.setProperties({
      ...pipeline
    });

    currentPipeline
      .save()
      .then(() => (this.errorMessage = ''))
      .catch(err => {
        this.errorMessage = err.errors[0].detail || '';
      })
      .finally(() => {
        this.isSaving = false;
      });
  }
}
