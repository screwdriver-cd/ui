import Service from '@ember/service';

export default class OptInRouteMappingService extends Service {
  routeMappings;

  constructor() {
    super(...arguments);

    this.routeMappings = new Map();

    this.routeMappings.set(
      'pipeline.child-pipelines',
      'v2.pipeline.child-pipelines'
    );
    this.routeMappings.set(
      'v2.pipeline.child-pipelines',
      'pipeline.child-pipelines'
    );
    this.routeMappings.set('pipeline.jobs.index', 'v2.pipeline.jobs');
    this.routeMappings.set('v2.pipeline.jobs', 'pipeline.jobs.index');

    this.routeMappings.set('pipeline.events.show', 'v2.pipeline.events.show');
    this.routeMappings.set('v2.pipeline.events.show', 'pipeline.events.show');

    this.routeMappings.set('pipeline.events.index', 'v2.pipeline.events.index');
    this.routeMappings.set('v2.pipeline.events.index', 'pipeline.events.index');

    this.routeMappings.set('pipeline.pulls', 'v2.pipeline.pulls.show');
    this.routeMappings.set('v2.pipeline.pulls.show', 'pipeline.pulls');

    this.routeMappings.set('pipeline.options', 'v2.pipeline.settings.index');
    this.routeMappings.set('v2.pipeline.settings.index', 'pipeline.options');
    this.routeMappings.set('v2.pipeline.settings.cache', 'pipeline.options');
    this.routeMappings.set('v2.pipeline.settings.jobs', 'pipeline.options');
    this.routeMappings.set('v2.pipeline.settings.metrics', 'pipeline.options');
    this.routeMappings.set(
      'v2.pipeline.settings.preferences',
      'pipeline.options'
    );
  }
}
