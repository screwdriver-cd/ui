import Service, { service } from '@ember/service';

export default class BannersService extends Service {
  @service shuttle;

  globalBanners;

  pipelineBanners;

  displayingBanners;

  bannerCallback;

  constructor() {
    super(...arguments);

    this.pipelineBanners = new Map();
  }

  registerCallback(callback) {
    this.bannerCallback = callback;
  }

  async getGlobalBanners() {
    if (!this.globalBanners) {
      await this.shuttle
        .fetchFromApi('get', '/banners?isActive=true&scope=GLOBAL')
        .then(banners => {
          this.globalBanners = banners;
        });
    }

    this.displayingBanners = this.globalBanners;
    this.bannerCallback(this.displayingBanners);
  }

  async getPipelineBanners(pipelineId) {
    const pipelineBanners = this.pipelineBanners.has(pipelineId)
      ? this.pipelineBanners.get(pipelineId)
      : await this.shuttle
          .fetchFromApi(
            'get',
            `/banners?isActive=true&scope=PIPELINE&scopeId=${pipelineId}`
          )
          .then(banners => {
            this.pipelineBanners.set(pipelineId, banners);

            return banners;
          });

    this.displayingBanners = pipelineBanners.concat(this.globalBanners);
    this.bannerCallback(this.displayingBanners);
  }
}
