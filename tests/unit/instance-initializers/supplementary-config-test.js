import Application from '@ember/application';
import Resolver from 'ember-resolver';
import { run } from '@ember/runloop';
import { initialize } from 'screwdriver-ui/instance-initializers/supplementary-config';
import { module, test } from 'qunit';
import ENV from 'screwdriver-ui/config/environment';
const NAMESPACE = ENV.APP.SDAPI_NAMESPACE;
const HOSTNAME = ENV.APP.SDAPI_HOSTNAME;
const { SDDOC_URL, SLACK_URL } = ENV.APP;
const { BUILD_RELOAD_TIMER } = ENV.APP;
const { EVENT_RELOAD_TIMER } = ENV.APP;
const { LOG_RELOAD_TIMER } = ENV.APP;

class TestApplication extends Application {
  Resolver = Resolver;
}

module('Unit | Instance Initializer | supplementary config', function (hooks) {
  hooks.beforeEach(function () {
    run(() => {
      this.application = TestApplication.create({ autoboot: false });
      this.appInstance = this.application.buildInstance();
      delete window.SUPPLEMENTARY_CONFIG;
    });
  });

  hooks.afterEach(function () {
    run(this.appInstance, 'destroy');
    run(this.application, 'destroy');
    delete window.SUPPLEMENTARY_CONFIG;
    ENV.APP.SDAPI_NAMESPACE = NAMESPACE;
    ENV.APP.SDAPI_HOSTNAME = HOSTNAME;
    ENV.APP.SDDOC_URL = SDDOC_URL;
    ENV.APP.SLACK_URL = SLACK_URL;
    ENV.APP.BUILD_RELOAD_TIMER = BUILD_RELOAD_TIMER;
    ENV.APP.EVENT_RELOAD_TIMER = EVENT_RELOAD_TIMER;
    ENV.APP.LOG_RELOAD_TIMER = LOG_RELOAD_TIMER;
  });

  test('it uses the pre-configured settings', function (assert) {
    initialize(this.appInstance);

    assert.equal(ENV.APP.SDAPI_NAMESPACE, NAMESPACE);
    assert.equal(ENV.APP.SDAPI_HOSTNAME, HOSTNAME);
    assert.equal(ENV.APP.SDDOC_URL, SDDOC_URL);
    assert.equal(ENV.APP.SLACK_URL, SLACK_URL);
    assert.equal(ENV.APP.BUILD_RELOAD_TIMER, BUILD_RELOAD_TIMER);
    assert.equal(ENV.APP.EVENT_RELOAD_TIMER, EVENT_RELOAD_TIMER);
    assert.equal(ENV.APP.LOG_RELOAD_TIMER, LOG_RELOAD_TIMER);
  });

  test('it uses the supplementary-config settings', function (assert) {
    window.SUPPLEMENTARY_CONFIG = {
      SDAPI_NAMESPACE: 'v5',
      SDAPI_HOSTNAME: 'http://example.com',
      SDDOC_URL: 'http://custom.doc',
      SLACK_URL: 'http://custom.slack',
      BUILD_RELOAD_TIMER: '10000',
      EVENT_RELOAD_TIMER: '15000',
      LOG_RELOAD_TIMER: '5000'
    };

    initialize(this.appInstance);

    assert.equal(ENV.APP.SDAPI_NAMESPACE, 'v5');
    assert.equal(ENV.APP.SDAPI_HOSTNAME, 'http://example.com');
    assert.equal(ENV.APP.SDDOC_URL, 'http://custom.doc');
    assert.equal(ENV.APP.SLACK_URL, 'http://custom.slack');
    assert.equal(ENV.APP.BUILD_RELOAD_TIMER, '10000');
    assert.equal(ENV.APP.EVENT_RELOAD_TIMER, '15000');
    assert.equal(ENV.APP.LOG_RELOAD_TIMER, '5000');
  });
});
