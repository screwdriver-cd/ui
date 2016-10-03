import Ember from 'ember';
import { initialize } from 'screwdriver-ui/instance-initializers/supplimentary-config';
import { module, test } from 'qunit';
import ENV from 'screwdriver-ui/config/environment';
import destroyApp from '../../helpers/destroy-app';
const NAMESPACE = ENV.APP.SDAPI_NAMESPACE;
const HOSTNAME = ENV.APP.SDAPI_HOSTNAME;

module('Unit | Instance Initializer | supplimentary config', {
  beforeEach() {
    Ember.run(() => {
      this.application = Ember.Application.create();
      this.appInstance = this.application.buildInstance();
      delete window.SUPPLIMENTARY_CONFIG;
    });
  },
  afterEach() {
    Ember.run(this.appInstance, 'destroy');
    destroyApp(this.application);
    delete window.SUPPLIMENTARY_CONFIG;
    ENV.APP.SDAPI_NAMESPACE = NAMESPACE;
    ENV.APP.SDAPI_HOSTNAME = HOSTNAME;
  }
});

test('it uses the pre-configured settings', function (assert) {
  initialize(this.appInstance);

  assert.equal(ENV.APP.SDAPI_NAMESPACE, NAMESPACE);
  assert.equal(ENV.APP.SDAPI_HOSTNAME, HOSTNAME);
});

test('it uses the supplimentary-config settings', function (assert) {
  window.SUPPLIMENTARY_CONFIG = {
    SDAPI_NAMESPACE: 'v5',
    SDAPI_HOSTNAME: 'http://example.com'
  };

  initialize(this.appInstance);

  assert.equal(ENV.APP.SDAPI_NAMESPACE, 'v5');
  assert.equal(ENV.APP.SDAPI_HOSTNAME, 'http://example.com');
});
