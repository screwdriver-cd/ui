import Ember from 'ember';

/**
 * fetch and combine the list of all builds for the workflow
 * @method getBuilds
 * @param  {Ember.NativeArray}  jobs List of jobs
 * @return {Promise}
 */
function getBuilds(jobs) {
  const buildList = [];

  jobs.forEach((j) => {
    buildList.push(j.get('builds'));
  });

  // fetch all the builds
  return Ember.RSVP.all(buildList).then((builds) => {
    let combined = [];

    // put all the builds in a single array
    builds.forEach((b) => {
      combined = combined.concat(b.slice());
    });

    return combined;
  });
}

export default Ember.Route.extend({
  beforeModel() {
    this.set('pipeline', this.modelFor('pipeline'));
  },
  model() {
    return this.get('pipeline.jobs')
      // Split jobs from workflow
      .then((jobs) => {
        // filter out the PRs
        const workflowJobs = jobs.filter(j => !/^PR-/.test(j.get('name')));

        // get all the builds and return results
        return getBuilds(workflowJobs).then(builds => ({
          jobs: workflowJobs,
          builds,
          pullRequests: jobs.filter(j => /^PR-/.test(j.get('name')))
        }));
      });
  }
});
