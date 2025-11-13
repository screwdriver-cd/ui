// import Route from '@ember/routing/route';
import { A as newArray } from '@ember/array';
import RSVP from 'rsvp';
import { inject as service } from '@ember/service';
import EventsRoute from '../events/route';

export default EventsRoute.extend({
  store: service(),
  optInRouteMapping: service(),
  controllerName: 'pipeline.events',
  setupController(controller, model) {
    this._super(controller, model);
    controller.setProperties({
      activeTab: 'pulls',
      selected: null
    });
    this.pipelineService.setBuildsLink('pipeline.pulls');
  },
  beforeModel(transition) {
    const { pipeline } = this.modelFor('pipeline');

    if (
      this.optInRouteMapping.switchFromV2 ||
      localStorage.getItem('oldUi') === 'true'
    ) {
      this.set('pipeline', pipeline);
      this.optInRouteMapping.switchFromV2 = false;

      return;
    }

    if (transition.from) {
      switch (transition.from.name) {
        case 'pipeline.events':
        case 'pipeline.events.index':
        case 'pipeline.events.show':
          this.set('pipeline', pipeline);
          this.optInRouteMapping.switchFromV2 = false;
          break;
        default:
          this.replaceWith('v2.pipeline.pulls', pipeline.id);
          break;
      }
    }
  },
  async model() {
    const pipelineId = this.get('pipeline.id');
    const pipelineEventsController = this.controllerFor('pipeline.events');

    pipelineEventsController.setProperties({
      pipeline: this.pipeline,
      showPRJobs: true
    });

    const jobsPromise = this.get('pipeline.jobs');

    let events = [];

    // fetch latest events which belongs to each PR jobs
    // extracts prNumers, the name of PR jobs starts with `PR-$prNum:`
    const prNumbers = jobsPromise.then(jobs =>
      jobs
        .filter(job => job.get('isPR'))
        .map(job => job.get('name'))
        .map(jobName => parseInt(jobName.slice('PR-'.length), 10))
        .reduce((prNums, prNum) => {
          if (prNums.includes(prNum)) {
            return prNums;
          }

          return prNums.concat(prNum);
        }, [])
    );

    // iterate to fetch latest PR event which belongs to each PRs
    events = prNumbers.then(prNums =>
      Promise.all(
        prNums.map(prNum =>
          this.store.query('event', {
            pipelineId: this.get('pipeline.id'),
            page: 1,
            count: 1,
            prNum
          })
        )
      ).then(queryReults => {
        // merge PR events from separate query results
        const prEvents = newArray();

        queryReults.forEach(prEvent => {
          prEvents.pushObjects(prEvent.toArray());
        });

        return prEvents;
      })
    );

    return RSVP.hash({
      jobs: jobsPromise,
      events,
      stages: this.shuttle.fetchStages(pipelineId),
      pipelinePreference: await this.pipelineService.getUserPipelinePreference(
        pipelineId
      ),
      desiredJobNameLength: await this.userSettings.getDisplayJobNameLength()
    });
  },
  actions: {
    refreshModel: function refreshModel() {
      return this.pipeline
        .hasMany('jobs')
        .reload()
        .then(() => this.refresh());
    }
  }
});
