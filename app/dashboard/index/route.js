import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Route.extend(AuthenticatedRouteMixin, {
  titleToken: 'Dashboard',
  authenticationRoute: 'login',

  activate() {
    return this.get('store').findAll('collection')
      .then((collections) => {
        const userCollections = collections.toArray();
        const length = userCollections.length;

        if (length) {
          // Get the id of the last object in this array. The last
          // object will be the first collection created by the user.
          const routeId = userCollections[length - 1].id;

          this.replaceWith(`/dashboards/${routeId}`);
        } else {
          this.replaceWith('home');
        }
      })
      .catch(() => {
        this.replaceWith('home');
      });
  }
});
