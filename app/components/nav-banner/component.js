import { get, set, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';

export default Component.extend({
  session: service(),
  // store: service(),
  banner: service('banner'),

  // banners: computed('store', {
  //   get() {
  //     if (!get(this, 'session.isAuthenticated') ||
  //       get(this, 'session.data.authenticated.isGuest')) {
  //       return [];
  //     }
  //
  //     return this.get('store').findAll('banner');
  //   }
  // }),

  actions: {
    clearMessage() {
      this.set('message', null);
    }
  },

  fetchBanners() {
    this.get('banner').fetchBanners().then((banners) => {
      console.log(banners);
      set(this, 'banners', banners);
    });
  },

  // Start loading active banners immediately upon inserting the element
  didInsertElement() {
    this._super(...arguments);
    this.fetchBanners();
  }
});
