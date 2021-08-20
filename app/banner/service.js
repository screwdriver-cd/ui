import $ from 'jquery';
import { Promise as EmberPromise } from 'rsvp';
import Service, { inject as service } from '@ember/service';
import ENV from 'screwdriver-ui/config/environment';

const bannersUrl = `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/banners`;

export default Service.extend({
  session: service(),

  /**
   * Calls the banner api service to fetch active banners
   * @method fetchBanners
   * @return {Promise}        Resolves to a list of banner structures
   */
  fetchBanners() {
    return new EmberPromise(resolve => {
      // Fetch the banners directly from the API
      $.ajax({
        url: bannersUrl,
        headers: {
          Authorization: `Bearer ${this.session.get(
            'data.authenticated.token'
          )}`
        }
      })
        .done(banners => {
          if (Array.isArray(banners)) {
            const activeBanners = banners.filter(
              banner => banner.isActive === true
            );

            resolve(activeBanners);
          } else {
            resolve([]);
          }
        })
        .fail(() => resolve([]));
    });
  }
});
