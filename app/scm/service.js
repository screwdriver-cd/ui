import $ from 'jquery';
import Service, { inject as service } from '@ember/service';
import ENV from 'screwdriver-ui/config/environment';
import { get } from '@ember/object';
const scmUrl = `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/auth/contexts`;

/**
 * Get scm icon type.
 * @method getIconType
 * @param  {String}  scmContext  scmContext (e.g. github:github.com)
 * @return {String}  iconType (using Font Awesome Icons)
 */
function getIconType(scmContext) {
  const iconTypes = {
    github: 'github',
    bitbucket: 'bitbucket',
    gitlab: 'gitlab'
  };

  const [scm] = scmContext.split(':');

  return iconTypes[scm];
}

export default Service.extend({
  session: service(),
  store: service(),

  /**
   * Get all scms from sd api server,
   * and create record into ember data.
   * @method createScms
   * @return {DS.RecordArray} Array of scm object.
   */
  createScms() {
    const { session, store } = this;
    const scms = this.getScms();

    if (get(scms, 'length') !== 0) {
      return scms;
    }

    return $.getJSON(scmUrl)
      .then(scmContexts => {
        scmContexts.forEach(scmContext => {
          let isSignedIn = false;

          if (get(session, 'isAuthenticated')) {
            const jwtContext = get(session, 'data.authenticated.scmContext');

            if (jwtContext === scmContext.context) {
              isSignedIn = true;
            }
          }

          // Create ember data of scm info
          store.createRecord('scm', {
            context: scmContext.context,
            displayName: scmContext.displayName,
            iconType: getIconType(scmContext.context),
            isSignedIn,
            autoDeployKeyGeneration: scmContext.autoDeployKeyGeneration,
            readOnly: scmContext.readOnly || false
          });
        });

        return store.peekAll('scm');
      })
      .catch(() => []);
  },

  /**
   * Get all scm object from inner ember data table.
   * @method getScms
   * @return {DS.RecordArray} Array of scm object.
   */
  getScms() {
    return this.store.peekAll('scm');
  },

  /**
   * Get specific scm object from inner ember data table.
   * @method getScm
   * @param  {String}  scmContext  scmContext (e.g. github:github.com)
   * @return {Object}              scm object
   */
  getScm(scmContext) {
    let ret = {};

    this.getScms().forEach(scm => {
      if (scm.get('context') === scmContext) {
        ret = {
          context: scm.get('context'),
          displayName: scm.get('displayName'),
          iconType: getIconType(scmContext),
          autoDeployKeyGeneration: scm.get('autoDeployKeyGeneration'),
          readOnly: scm.get('readOnly')
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
    this.getScms().forEach(scm => {
      if (scm.get('context') === scmContext) {
        scm.set('isSignedIn', true);
      } else {
        scm.set('isSignedIn', false);
      }
    });
  }
});
