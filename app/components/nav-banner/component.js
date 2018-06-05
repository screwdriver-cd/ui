import { get, set } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';

export default Component.extend({
  banner: service('banner'),

  actions: {
    clearMessage() {
      this.set('message', null);
    }
  },

  setBanners() {
    this.get('banner').fetchBanners().then((banners) => {
      if (!get(this, 'isDestroying') && !get(this, 'isDestroyed')) {
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
