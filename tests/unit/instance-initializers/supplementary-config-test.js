import Application from '@ember/application';
import { run } from '@ember/runloop';
import { initialize } from 'screwdriver-ui/instance-initializers/supplementary-config';
import { module, test } from 'qunit';
import ENV from 'screwdriver-ui/config/environment';
import destroyApp from '../../helpers/destroy-app';
const NAMESPACE = ENV.APP.SDAPI_NAMESPACE;
const HOSTNAME = ENV.APP.SDAPI_HOSTNAME;
const SDDOC_URL = ENV.APP.SDDOC_URL;

module('Unit | Instance Initializer | supplementary config', {
  beforeEach() {
    run(() => {
      this.application = Application.create();
      this.appInstance = this.application.buildInstance();
      delete window.SUPPLEMENTARY_CONFIG;
    });
  },
  afterEach() {
    run(this.appInstance, 'destroy');
    destroyApp(this.application);
    delete window.SUPPLEMENTARY_CONFIG;
    ENV.APP.SDAPI_NAMESPACE = NAMESPACE;
    ENV.APP.SDAPI_HOSTNAME = HOSTNAME;
    ENV.APP.SDDOC_URL = SDDOC_URL;
  }
});

test('it uses the pre-configured settings', function (assert) {
  initialize(this.appInstance);

  assert.equal(ENV.APP.SDAPI_NAMESPACE, NAMESPACE);
  assert.equal(ENV.APP.SDAPI_HOSTNAME, HOSTNAME);
  assert.equal(ENV.APP.SDDOC_URL, SDDOC_URL);
});

test('it uses the supplementary-config settings', function (assert) {
  window.SUPPLEMENTARY_CONFIG = {
    SDAPI_NAMESPACE: 'v5',
    SDAPI_HOSTNAME: 'http://example.com',
    SDDOC_URL: 'http://custom.doc'
  };

  initialize(this.appInstance);

  assert.equal(ENV.APP.SDAPI_NAMESPACE, 'v5');
  assert.equal(ENV.APP.SDAPI_HOSTNAME, 'http://example.com');
  assert.equal(ENV.APP.SDDOC_URL, 'http://custom.doc');
});
