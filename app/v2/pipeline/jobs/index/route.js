import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { isPRJob } from 'screwdriver-ui/utils/build';
import ENV from 'screwdriver-ui/config/environment';
import { action } from '@ember/object';
import getErrorMessage from 'screwdriver-ui/utils/error-messages';

export default class NewPipelineJobsIndexRoute extends Route {
  @service router;

  @service shuttle;

  async model() {
    const { pipeline } = this.modelFor('v2.pipeline');
    const numBuilds = ENV.APP.NUM_BUILDS_LISTED;

    let jobs = await this.shuttle.fetchJobs(pipeline.id).catch(err => {
      const errorMessage = getErrorMessage(err);

      this.controllerFor('v2.pipeline.jobs.index').set(
        'errorMessage',
        errorMessage
      );

      return [];
    });
    // Filter out PR jobs

    jobs = jobs.filter(j => !isPRJob(j.name));

    // Resolve all job promises
    const resolvedJobs = await Promise.all(
      jobs.map(async job => {
        const builds = await this.shuttle
          .fetchFromApi(
            'get',
            `/jobs/${job.id}/builds?fetchSteps=false&count=${numBuilds}&page=1&sort=descending`
          )
          .catch(err => {
            const errorMessage = getErrorMessage(err);

            this.controllerFor('v2.pipeline.jobs.index').set(
              'errorMessage',
              errorMessage
            );

            return [];
          });

        builds.reverse();

        return { ...job, builds };
      })
    );

    if (this.controllerFor('v2.pipeline.jobs.index').errorMessage !== '') {
      this.router.transitionTo('/404');

      return {};
    }

    return { pipeline, jobs: resolvedJobs };
  }

  @action
  async refreshModel() {
    this.refresh();
  }
}
