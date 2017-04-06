import { moduleFor, test } from 'ember-qunit';
import Pretender from 'pretender';
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

moduleFor('service:validator', 'Unit | Service | validator', {
  // Specify the other units that are required for this test.
  // needs: ['service:foo']
  beforeEach() {
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
  },
  afterEach() {
    server.shutdown();
  }
});

test('it determines if something looks like a template', function (assert) {
  const service = this.subject();

  assert.ok(service.isTemplate('name: bananas'));
  assert.notOk(service.isTemplate('workflow: bananas'));
});

test('it uploads a template to the validator', function (assert) {
  const service = this.subject();

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
  const service = this.subject();

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
  const service = this.subject();

  return service.getValidationResults('name: joker').catch((response) => {
    assert.equal(response, '400 villains');
  });
});
