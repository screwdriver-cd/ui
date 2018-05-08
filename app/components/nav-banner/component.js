import { set } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';

export default Component.extend({
  session: service(),
  banner: service('banner'),

  actions: {
    clearMessage() {
      this.set('message', null);
    }
  },

  fetchBanners() {
    this.get('banner').fetchBanners().then((banners) => {
      set(this, 'banners', banners);
    });
  },

  // Start loading active banners immediately upon inserting the element
  didInsertElement() {
    this._super(...arguments);
    this.fetchBanners();
  }
});
