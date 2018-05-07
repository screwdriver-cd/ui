import $ from 'jquery';
import { Promise as EmberPromise } from 'rsvp';
import Service, { inject as service } from '@ember/service';
import ENV from 'screwdriver-ui/config/environment';

export default Service.extend({
  session: service(),

  /**
   * Calls the banner api service to fetch active banners
   * @method fetchBanners
   * @return {Promise}        Resolves to a list of banner structures
   */
  fetchBanners() {
    // Fetch the banners directly from the API
    const bannersUrl = `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}` +
      '/banners';

    return new EmberPromise((resolve, reject) => {
      if (!this.get('session.isAuthenticated')) {
        return reject(new Error('User is not authenticated'));
      }

      return $.ajax({
        url: bannersUrl,
        headers: { Authorization: `Bearer ${this.get('session').get('data.authenticated.token')}` }
      })
        .done(banners => banners.filter(banner => banner.isActive === true));
    });
  }
});
