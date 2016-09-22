import Ember from 'ember';
import ApplicationRouteMixin from 'ember-simple-auth/mixins/application-route-mixin';
export default Ember.Route.extend(ApplicationRouteMixin, {
  title(tokens) {
    let arr = Array.isArray(tokens) ? tokens : [];

    arr.push('screwdriver.cd');

    return arr.join(' > ');
  }
});
