import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Pretender from 'pretender';
import Service from '@ember/service';

const sessionStub = Service.extend({
  data: {
    authenticated: {
      token: 'faketoken'
    }
  }
});
let server;

const EXAMPLE_CONFIG_PAYLOAD = {
  errors: [],
  jobs: {},
  workflow: ['main']
};

const EXAMPLE_TEMPLATE_PAYLOAD = {
  errors: [],
  template: {}
};

module('Unit | Service | validator', function(hooks) {
  setupTest(hooks);

  // Specify the other units that are required for this test.
  // needs: ['service:foo']
  hooks.beforeEach(function() {
    this.owner.register('service:session', sessionStub);
    server = new Pretender();

    server.post('http://localhost:8080/v4/validator', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify(EXAMPLE_CONFIG_PAYLOAD)
    ]);

    server.post('http://localhost:8080/v4/validator/template', (request) => {
      if (request.requestBody === '{"yaml":"name: joker"}') {
        return [
          400,
          { 'Content-Type': 'application/json' },
          JSON.stringify({ error: 'villains' })
        ];
      }

      return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(EXAMPLE_TEMPLATE_PAYLOAD)
      ];
    });
  });

  hooks.afterEach(function() {
    server.shutdown();
  });

  test('it determines if something looks like a template', function (assert) {
    const service = this.owner.lookup('service:validator');

    assert.ok(service.isTemplate('name: bananas'));
    assert.notOk(service.isTemplate('workflow: bananas'));
  });

  test('it uploads a template to the validator', function (assert) {
    const service = this.owner.lookup('service:validator');

    server.handledRequest = function (verb, path, request) {
      assert.equal(verb, 'POST');
      assert.equal(request.withCredentials, true);
      assert.ok(request.requestHeaders.Authorization);
    };

    return service.getValidationResults('name: batman').then((response) => {
      assert.deepEqual(response, EXAMPLE_TEMPLATE_PAYLOAD);
    });
  });

  test('it uploads a config to the validator', function (assert) {
    const service = this.owner.lookup('service:validator');

    server.handledRequest = function (verb, path, request) {
      assert.equal(verb, 'POST');
      assert.equal(request.withCredentials, true);
      assert.ok(request.requestHeaders.Authorization);
    };

    return service.getValidationResults('workflow: [batman]').then((response) => {
      assert.deepEqual(response, EXAMPLE_CONFIG_PAYLOAD);
    });
  });

  test('it handles validator failure', function (assert) {
    const service = this.owner.lookup('service:validator');

    return service.getValidationResults('name: joker').catch((response) => {
      assert.equal(response, '400 villains');
    });
  });
});
