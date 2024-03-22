import Controller from '@ember/controller';
import { service } from '@ember/service';
import { computed, action, setProperties } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { jwt_decode as decoder } from 'ember-cli-jwt-decode';
import timeRange from 'screwdriver-ui/utils/time-range';

export default class TemplatesPipelineDetailController extends Controller {
  @service store;

  @service session;

  @computed('pipelineTemplateVersion', 'pipelineTemplateVersions')
  get selectedPipelineTemplate() {
    const { pipelineTemplateVersion } = this;
    const currentPipelineVersion = this.pipelineTemplateVersions.find(v => {
      return v.version === pipelineTemplateVersion;
    });

    return currentPipelineVersion;
  }

  @tracked token = this.session.get('data.authenticated.token');

  get isAdmin() {
    const token = this.get('token');

    return (decoder(token).scope || []).includes('admin');
  }

  constructor() {
    super(...arguments);

    const { startTime, endTime } = timeRange(new Date(), '1yr');

    // these are used for querying, so they are in ISO8601 format
    setProperties(this, {
      startTime,
      endTime
    });
  }

  @action
  removeVersion() {
    // TODO
  }

  @action
  timeRangeChange() {
    // TODO
  }

  @action
  updateTrust() {
    // TODO
  }

  @action
  removeTemplate() {
    // TODO
  }
}
