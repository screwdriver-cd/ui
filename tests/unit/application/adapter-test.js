import { moduleFor, test } from 'ember-qunit';
import Pretender from 'pretender';
import DS from 'ember-data';
let server;

moduleFor('adapter:application', 'Unit | Adapter | application', {
  // Specify the other units that are required for this test.
  needs: ['service:session'],

  beforeEach() {
    server = new Pretender();
  },

  afterEach() {
    server.shutdown();
  }
});

test('it exists', function (assert) {
  let adapter = this.subject();

  assert.ok(adapter);
});

test('it uses cors for ajax', function (assert) {
  assert.expect(3);

  server.get('fakeurl', () => [200, { 'content-type': 'application/json' }, '{"foo": "bar"}']);

  server.handledRequest = function (verb, path, request) {
    assert.equal(verb, 'GET');
    assert.equal(request.withCredentials, true);
  };

  let adapter = this.subject();

  return adapter.ajax('fakeurl', 'GET').then(response => {
    assert.deepEqual(response, { foo: 'bar' });
  });
});

test('it wraps non-array payload with model name', function (assert) {
  let adapter = this.subject();

  const requestData = {
    url: 'http://localhost:8080/v3/builds/12345'
  };

  const payload = adapter.handleResponse(200, {}, { id: 1234 }, requestData);

  assert.deepEqual(payload, {
    build: { id: 1234 }
  });
});

test('it wraps array payload with model name', function (assert) {
  let adapter = this.subject();

  const requestData = {
    url: 'http://localhost:8080/v3/builds'
  };

  const payload = adapter.handleResponse(200, {}, [{ id: 1234 }], requestData);

  assert.deepEqual(payload, {
    builds: [{ id: 1234 }]
  });
});

test('it adds links to pipelines', function (assert) {
  let adapter = this.subject();

  const requestData = {
    url: 'http://localhost:8080/v3/pipelines/1234324'
  };

  const payload = adapter.handleResponse(200, {}, { id: 1234 }, requestData);

  assert.deepEqual(payload, {
    pipeline: { id: 1234, links: { jobs: 'jobs', secrets: 'secrets' } }
  });
});

test('it adds links to jobs', function (assert) {
  let adapter = this.subject();

  const requestData = {
    url: 'http://localhost:8080/v3/pipelines/1234/jobs'
  };

  const payload = adapter.handleResponse(200, {}, [{ id: 1234 }], requestData);

  assert.deepEqual(payload, {
    jobs: [{ id: 1234, links: { builds: 'builds' } }]
  });
});

test('it adds links to jobs', function (assert) {
  let adapter = this.subject();

  const requestData = {
    url: 'http://localhost:8080/v3/pipelines/1234/jobs'
  };

  const payload = adapter.handleResponse(200, {}, [], requestData);

  assert.deepEqual(payload, {
    jobs: []
  });
});

test('it wraps errors', function (assert) {
  let adapter = this.subject();

  const requestData = {
    url: 'http://localhost:8080/v3/pipelines/1234/jobs'
  };

  const payload = adapter.handleResponse(404, {}, { error: 'bananas' }, requestData);

  assert.ok(payload instanceof DS.AdapterError);
});
