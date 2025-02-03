import { set } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';

export default Component.extend({
  shuttle: service('shuttle'),

  setBanners() {
    this.shuttle.fetchBanners('GLOBAL').then(banners => {
      if (!this.isDestroying && !this.isDestroyed) {
        set(this, 'banners', banners);
      }
    });
  },

  // Start loading active banners immediately upon inserting the element
  didInsertElement() {
    this._super(...arguments);
    this.setBanners();
  }
});
