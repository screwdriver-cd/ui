// import Route from '@ember/routing/route';
import { A as newArray } from '@ember/array';
import RSVP from 'rsvp';
import { isPRJob } from 'screwdriver-ui/utils/build';
import EventsRoute from '../events/route';

export default EventsRoute.extend({
  controllerName: 'pipeline.events',
  setupController(controller, model) {
    this._super(controller, model);
    controller.set('activeTab', 'pulls');
  },
  renderTemplate() {
    this.render('pipeline.events');
  },
  model() {
    this.controllerFor('pipeline.events').set('pipeline', this.get('pipeline'));
    const jobsPromise = this.get('pipeline.jobs');
    let events = [];

    // fetch latest events which belongs to each PR jobs, if the prChain feature is enabled
    if (this.get('pipeline.prChain')) {
      const prNumbers = jobsPromise.then(jobs => jobs.filter(job => isPRJob(job.get('name')))
        .map(job => job.get('name'))
        .map(jobName => jobName.split('PR-')[1].split(':')[0])
        .reduce((prNums, prNum) => {
          if (prNums.includes(prNum)) {
            return prNums;
          }

          return prNums.concat(prNum);
        }, [])
      );

      events = prNumbers.then(prNums => Promise.all(prNums.map(prNum =>
        this.store.query('event', { pipelineId: this.get('pipeline.id'),
          page: 1,
          count: 1,
          prNum
        }))).then((queryReults) => {
        // merge pr-events from separate query results
        const prEvents = newArray();

        queryReults.forEach((prEvent) => {
          prEvents.pushObjects(prEvent.toArray());
        });

        return prEvents;
      }));
    }

    return RSVP.hash({
      jobs: jobsPromise,
      events
    });
  }
});
