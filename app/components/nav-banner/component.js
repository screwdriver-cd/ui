import { tagName } from '@ember-decorators/component';
import classic from 'ember-classic-decorator';
import { inject as service } from '@ember/service';
import { set, action } from '@ember/object';
import Component from '@ember/component';

@tagName('')
@classic
export default class NavBanner extends Component {
  @service('banner')
  banner;

  @action
  clearMessage() {
    this.set('message', null);
  }

  setBanners() {
    this.banner.fetchBanners().then(banners => {
      if (!this.isDestroying && !this.isDestroyed) {
        set(this, 'banners', banners);
      }
    });
  }

  // Start loading active banners immediately upon inserting the element
  didInsertElement() {
    super.didInsertElement(...arguments);
    this.setBanners();
  }
}
