import classic from 'ember-classic-decorator';
import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import { get, action } from '@ember/object';

@classic
export default class OptionsRoute extends Route {
  @service
  session;

  routeAfterAuthentication = 'pipeline.options';

  model() {
    // Guests should not access this page
    if (get(this, 'session.data.authenticated.isGuest')) {
      this.transitionTo('pipeline');
    }

    const { pipeline } = this.modelFor('pipeline');

    // Prevent double render when jobs list updates asynchronously
    return pipeline.get('jobs').then(jobs => ({ pipeline, jobs }));
  }

  @action
  willTransition() {
    // Reset error message when switching pages
    this.controller.set('errorMessage', '');
  }
}
