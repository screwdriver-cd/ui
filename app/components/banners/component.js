import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class BannersComponent extends Component {
  @service banners;

  @tracked bannersForDisplay;

  @tracked displayingBanner;

  @tracked bannerIndex = 0;

  @action
  async initializeBanners() {
    this.banners.registerCallback(this.onBannersUpdated);

    await this.banners.getGlobalBanners();
  }

  @action
  getDisplayIndex() {
    return this.bannerIndex + 1;
  }

  @action
  onBannersUpdated(banners) {
    this.bannersForDisplay = banners;
    this.displayingBanner = banners[0];
  }

  @action
  previousBanner() {
    this.bannerIndex =
      this.bannerIndex === 0
        ? this.bannersForDisplay.length - 1
        : this.bannerIndex - 1;
    this.displayingBanner = this.bannersForDisplay[this.bannerIndex];
  }

  @action
  nextBanner() {
    this.bannerIndex =
      this.bannerIndex === this.bannersForDisplay.length - 1
        ? 0
        : this.bannerIndex + 1;
    this.displayingBanner = this.bannersForDisplay[this.bannerIndex];
  }
}
