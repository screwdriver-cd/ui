import Controller from '@ember/controller';
import { service } from '@ember/service';
import { action, setProperties, get } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { jwt_decode as decoder } from 'ember-cli-jwt-decode';
import timeRange from 'screwdriver-ui/utils/time-range';

export default class TemplatesPipelineDetailController extends Controller {
  @service store;

  @service template;

  @service session;

  @service router;

  isPipelineTemplatePage = true;

  pipelineTemplateVersions = [];

  pipelineTemplateTags = [];

  workflowGraph = {
    nodes: [],
    edges: []
  };

  @tracked startTime;

  @tracked endTime;

  @tracked errorMessage = '';

  @tracked versionOrTagFromUrl = '';

  @tracked token = this.session.get('data.authenticated.token');

  get isAdmin() {
    const token = get(this, 'token');

    return (decoder(token).scope || []).includes('admin');
  }

  get jobs() {
    const { config } = this.selectedVersionTemplate;
    const configJobs = get(config, 'jobs') || {};
    const jobs = [];

    Object.entries(configJobs).forEach(([jobName, jobConfig]) => {
      jobs.push({
        name: jobName,
        permutations: [jobConfig]
      });
    });

    return jobs;
  }

  get templateName() {
    const templateName = `${this.model.name}/${this.model.namespace}`;

    return templateName;
  }

  get selectedVersionTemplate() {
    const { pipelineTemplateVersions, pipelineTemplateTags } = this.model;

    if (this.versionOrTagFromUrl === '') {
      const pipelineTemplateLatestVersion =
        pipelineTemplateVersions.get('firstObject');

      return pipelineTemplateLatestVersion;
    }

    const tagExists = pipelineTemplateTags.filter(
      t => t.tag === this.versionOrTagFromUrl
    );

    if (tagExists.length > 0) {
      return pipelineTemplateVersions.findBy('version', tagExists[0].version);
    }

    const foundVersion = pipelineTemplateVersions.findBy(
      'version',
      this.versionOrTagFromUrl
    );

    return foundVersion;
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

  get filteredTemplates() {
    const { startTime, endTime } = this;
    const startTimeInDate = new Date(startTime);
    const endTimeInDate = new Date(endTime);

    let filteredVersions = this.model.pipelineTemplateVersions.filter(v => {
      // TODO: polyfill pipeline template metrics data
      v.metrics = {
        jobs: { count: '' },
        builds: { count: '' },
        pipelines: { count: '' }
      };

      const createTimeInDate = new Date(v.createTime);

      return (
        createTimeInDate >= startTimeInDate && createTimeInDate <= endTimeInDate
      );
    });

    return filteredVersions;
  }

  @action
  timeRangeChange(startTime, endTime) {
    setProperties(this, { startTime, endTime });
  }

  @action
  updateTrust() {
    const { namespace, name } = this.selectedVersionTemplate;
    const isTrusted = !!this.selectedVersionTemplate.trusted;

    return (
      this.isAdmin &&
      this.template
        .updateTrustPipelineTemplate(namespace, name, !isTrusted)
        .catch(err => {
          this.errorMessage = err;
        })
    );
  }

  @action
  removeTemplate() {
    const { namespace, name } = this.selectedVersionTemplate;

    return (
      this.isAdmin &&
      this.template
        .deletePipelineTemplate(namespace, name)
        .then(() => {
          this.router.transitionTo('/templates/pipeline');
        })
        .catch(err => {
          this.errorMessage = err;
        })
    );
  }

  @action
  removeVersion() {
    const { namespace, name, version } = this.selectedVersionTemplate;

    return (
      this.isAdmin &&
      this.template
        .deletePipelineTemplateByVersion(namespace, name, version)
        .then(() => {
          this.send('reloadModel');
        })
        .catch(err => {
          this.errorMessage = err;
        })
    );
  }
}
