import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import { inject as service } from '@ember/service';
import { get } from '@ember/object';

export default class TemplatesPipelineDetailIndexRoute extends Route.extend(
  AuthenticatedRouteMixin
) {
  @service template;
  @service router;
  @service store;

  async loadOnePipelineTemplateVersions(namespace, name) {
    const pipelineTemplateVersions =
      await this.template.getPipelineTemplateVersions(namespace, name);

    console.log('pipelineTemplateVersions', pipelineTemplateVersions);

    return pipelineTemplateVersions;
  }

  async model() {
    const pipelineDetailsParams = this.paramsFor('templates.pipeline.detail');
    const { namespace, name } = pipelineDetailsParams;

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

    const pipelineTemplateLatestVersion = pipelineTemplateVersions.get('firstObject');

    return {
      name,
      namespace, 
      pipelineTemplateLatestVersion,
      pipelineTemplateVersions
    };
  }

  async setupController(controller, model) {
    const { name, namespace, pipelineTemplateLatestVersion, pipelineTemplateVersions } = model;
    const pipelineName = `${namespace}/${name}`;
    const { config } = pipelineTemplateLatestVersion;
    const { parameters, shared, annotations } = config; 
    const workflowGraph = {
      nodes: [],
      edges: []
    }; 

    const configJobs = get(config, 'jobs') || {};
    const jobs = [];

    Object.entries(configJobs).forEach(([jobName, jobConfig]) => {
      jobs.push({
        name: jobName,
        permutations: [jobConfig],
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
      pipelineName,
      workflowGraph, 
      annotations,
      parameters,
      // filteredTemplates: model
    });
  }
}
