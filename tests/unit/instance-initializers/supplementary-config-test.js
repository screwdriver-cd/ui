import Application from '@ember/application';
import { run } from '@ember/runloop';
import { initialize } from 'screwdriver-ui/instance-initializers/supplementary-config';
import { module, test } from 'qunit';
import ENV from 'screwdriver-ui/config/environment';
const NAMESPACE = ENV.APP.SDAPI_NAMESPACE;
const HOSTNAME = ENV.APP.SDAPI_HOSTNAME;
const { SDDOC_URL, SLACK_URL } = ENV.APP;

module('Unit | Instance Initializer | supplementary config', function(hooks) {
  hooks.beforeEach(function() {
    run(() => {
      this.TestApplication = Application.extend();
      this.application = this.TestApplication.create({ autoboot: false });
      this.appInstance = this.application.buildInstance();
      delete window.SUPPLEMENTARY_CONFIG;
    });
  });

  hooks.afterEach(function() {
    run(this.appInstance, 'destroy');
    run(this.application, 'destroy');
    delete window.SUPPLEMENTARY_CONFIG;
    ENV.APP.SDAPI_NAMESPACE = NAMESPACE;
    ENV.APP.SDAPI_HOSTNAME = HOSTNAME;
    ENV.APP.SDDOC_URL = SDDOC_URL;
    ENV.APP.SLACK_URL = SLACK_URL;
  });

  test('it uses the pre-configured settings', function(assert) {
    initialize(this.appInstance);

    assert.equal(ENV.APP.SDAPI_NAMESPACE, NAMESPACE);
    assert.equal(ENV.APP.SDAPI_HOSTNAME, HOSTNAME);
    assert.equal(ENV.APP.SDDOC_URL, SDDOC_URL);
    assert.equal(ENV.APP.SLACK_URL, SLACK_URL);
  });

  test('it uses the supplementary-config settings', function(assert) {
    window.SUPPLEMENTARY_CONFIG = {
      SDAPI_NAMESPACE: 'v5',
      SDAPI_HOSTNAME: 'http://example.com',
      SDDOC_URL: 'http://custom.doc',
      SLACK_URL: 'http://custom.slack'
    };

    initialize(this.appInstance);

    assert.equal(ENV.APP.SDAPI_NAMESPACE, 'v5');
    assert.equal(ENV.APP.SDAPI_HOSTNAME, 'http://example.com');
    assert.equal(ENV.APP.SDDOC_URL, 'http://custom.doc');
    assert.equal(ENV.APP.SLACK_URL, 'http://custom.slack');
  });
});
