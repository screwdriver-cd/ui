import { get, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';

export default Component.extend({
  session: service(),
  store: service(),
  banner: service('banner'),

  banners: computed('store', {
    get() {
      if (!get(this, 'session.isAuthenticated') ||
        get(this, 'session.data.authenticated.isGuest')) {
        return [];
      }

      return this.get('store').findAll('banner');
    }
  })
});
