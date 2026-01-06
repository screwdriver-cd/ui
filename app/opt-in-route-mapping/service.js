import Service from '@ember/service';

export default class OptInRouteMappingService extends Service {
  routeMappings;

  prEventId;

  constructor() {
    super(...arguments);

    this.returnUrl = null;
    this.eventMeta = null;

    this.routeMappings = new Map();

    this.routeMappings.set(
      'pipeline.child-pipelines',
      'v2.pipeline.child-pipelines'
    );
    this.routeMappings.set('pipeline.jobs.index', 'v2.pipeline.jobs');
    this.routeMappings.set('pipeline.events.show', 'v2.pipeline.events.show');
    this.routeMappings.set('pipeline.events.index', 'v2.pipeline.events.index');
    this.routeMappings.set('pipeline.pulls', 'v2.pipeline.pulls.show');
    this.routeMappings.set('pipeline.options', 'v2.pipeline.settings.index');
    this.routeMappings.set('pipeline.secrets', 'v2.pipeline.secrets.index');
  }
}
