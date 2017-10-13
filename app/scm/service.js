import Ember from 'ember';
import ENV from 'screwdriver-ui/config/environment';
// eslint-disable-next-line camelcase
import { jwt_decode } from 'ember-cli-jwt-decode';
const scmUrl = `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/auth/contexts`;

/**
* Get scm icon type.
* @method getIconType
* @param  {String}  scmContext  scmContext (e.g. github:github.com) 
* @return {String}  iconType (using Font Awesome Icons)
*/
function getIconType(scmContext) {
  const iconTypes = {
    github: 'fa-github',
    bitbucket: 'fa-bitbucket',
    gitlab: 'fa-gitlab'
  };

  const [scm] = scmContext.split(':');

  return iconTypes[scm];
}

export default Ember.Service.extend({
  session: Ember.inject.service('session'),
  store: Ember.inject.service(),

  /**
   * Get all scms from sd api server,
   * and create record into ember data.
   * @method createScms
   * @return {DS.RecordArray} Array of scm object.
   */
  createScms() {
    const session = this.get('session');
    const store = this.get('store');
    const scms = this.getScms();

    if (scms.get('length') !== 0) {
      return scms;
    }

    return Ember.$.getJSON(scmUrl).then((scmContexts) => {
      scmContexts.forEach((scmContext) => {
        let isSignedIn = false;

        if (session.get('isAuthenticated')) {
          const jwt = jwt_decode(session.get('data.authenticated.token'));

          if (jwt.scmContext === scmContext.context) {
            isSignedIn = true;
          }
        }

        // Create ember data of scm info
        store.createRecord('scm', {
          context: scmContext.context,
          displayName: scmContext.displayName,
          iconType: getIconType(scmContext.context),
          isSignedIn
        });
      });

      return store.peekAll('scm');
    }).catch(() => []);
  },

  /**
   * Get all scm object from inner ember data table.
   * @method getScms
   * @return {DS.RecordArray} Array of scm object.
   */
  getScms() {
    return this.get('store').peekAll('scm');
  },

  /**
   * Get specific scm object from inner ember data table.
   * @method getScm
   * @param  {String}  scmContext  scmContext (e.g. github:github.com) 
   * @return {Object}              scm object
   */
  getScm(scmContext) {
    let ret = {};

    this.getScms().forEach((scm) => {
      if (scm.get('context') === scmContext) {
        ret = {
          context: scm.get('context'),
          displayName: scm.get('displayName'),
          iconType: getIconType(scmContext)
        };
      }
    });

    return ret;
  },

  /**
   * Change status of 'isSignedIn' property true.
   * @method setSignedIn
   * @param  {String}  scmContext  scmContext (e.g. github:github.com) 
   */
  setSignedIn(scmContext) {
    this.getScms().forEach((scm) => {
      if (scm.get('context') === scmContext) {
        scm.set('isSignedIn', true);
      } else {
        scm.set('isSignedIn', false);
      }
    });
  }
});
