import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import { inject as service } from '@ember/service';
import { jwtDecode } from 'jwt-decode';
import { tracked } from '@glimmer/tracking';
import { get } from '@ember/object';

export default class NewRoute extends Route.extend(AuthenticatedRouteMixin) {
  @service session;

  @service router;

  @tracked token = this.session.get('data.authenticated.token');

  get isAdmin() {
    const token = get(this, 'token');

    return (jwtDecode(token).scope || []).includes('admin');
  }

  beforeModel() {
    if (!this.isAdmin) {
      this.router.transitionTo('/404');
    }
  }
}
