import Ember from 'ember';
import ENV from 'screwdriver-ui/config/environment';

export default Ember.Service.extend({
  /**
   * @method arrangeIntoTree
   * @param {Array}   paths   An array of full paths
   */
  arrangeIntoTree(paths, cb) {
    return cb([]);
  },
  /**
   * Calls the store api service to fetch build artifact manifest
   * @method fetchLogs
   * @param  {Integer}  buildId      Build id
   * @return {Promise}               Resolves to a JSON representaion of the file structure
   */
  fetchManifest(buildId) {
    // const url = `${ENV.APP.SDSTORE_HOSTNAME}/${ENV.APP.SDSTORE_NAMESPACE}` +
    //   `/builds/${buildId}/ARTIFACTS/manifest.txt`;
    console.log('buildId:', buildId);

    const url = `${ENV.APP.SDSTORE_HOSTNAME}/${ENV.APP.SDSTORE_NAMESPACE}` +
      '/builds/1881/ARTIFACTS/manifest.txt';

    console.log('url:', url);

    return new Ember.RSVP.Promise((resolve) => {
      Ember.$.ajax({
        url,
        type: 'GET'
      })
      .done((data) => {
        const paths = data.split('\n');

        console.log('paths:', paths);

        return this.arrangeIntoTree(paths, tree => resolve(tree));
      })
      .fail(resolve([]));
    });
  }
});
