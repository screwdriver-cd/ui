import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import { inject as service } from '@ember/service';
import { get, setProperties } from '@ember/object';

export default class TemplatesPipelineDetailRoute extends Route.extend(
  AuthenticatedRouteMixin
) {
  @service template;

  @service router;

  @service store;

  constructor() {
    super(...arguments);
    console.log('TemplatesPipelineDetailRoute');
  }

  async loadOnePipelineTemplateVersions(namespace, name) {
    const pipelineTemplateVersions =
      await this.template.getPipelineTemplateVersions(namespace, name);

    console.log('pipelineTemplateVersions', pipelineTemplateVersions);

    return pipelineTemplateVersions;
  }

  async model() {
    const pipelineDetailsParams = this.paramsFor('templates.pipeline.detail');
    const { namespace, name } = pipelineDetailsParams;
    const fullName = `${namespace}/${name}`;

    console.log('pipelineDetailsParams', pipelineDetailsParams);

    let pipelineTemplateVersions;

    try {
      pipelineTemplateVersions = await this.loadOnePipelineTemplateVersions(
        namespace,
        name
      );
    } catch (err) {
      // console.log('err', err);
      // throw(err);

      this.router.transitionTo('/404');
    }

    const pipelineTemplateLatestVersion =
      pipelineTemplateVersions.get('firstObject');

    return {
      name,
      namespace,
      fullName,
      pipelineTemplateLatestVersion,
      pipelineTemplateVersions
    };
  }

  async setupController(controller, model) {
    const {
      name,
      namespace,
      fullName,
      pipelineTemplateLatestVersion,
      pipelineTemplateVersions
    } = model;

    const { config } = pipelineTemplateLatestVersion;

    setProperties(pipelineTemplateLatestVersion, {
      fullName
    });

    // polyfill pipeline template workflowGraph
    const workflowGraph = {
      nodes: [],
      edges: []
    };

    const configJobs = get(config, 'jobs') || {};
    const jobs = [];

    Object.entries(configJobs).forEach(([jobName, jobConfig]) => {
      jobs.push({
        name: jobName,
        permutations: [jobConfig]
      });
    });

    // Object.entries(configJobs).forEach(([jobName, jobConfig]) => {
    //   jobs.push(
    //     this.store.createRecord('job', {
    //       name: jobName,
    //       permutations: [jobConfig],
    //       archived: false
    //     })
    //   );
    // });

    console.log('jobs', jobs);

    this.controllerFor('templates.pipeline.detail').setProperties({
      jobs,
      pipelineName: fullName,
      workflowGraph,
      selectedVersionTemplate: pipelineTemplateLatestVersion,
      filteredTemplates: pipelineTemplateVersions
    });
  }
}
