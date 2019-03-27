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

  server.get('https://sd.cd/fake',
    () => [200, { 'content-type': 'application/json' }, '{"foo": "bar"}']);

  server.handledRequest = function (verb, path, request) {
    assert.equal(verb, 'GET');
    assert.equal(request.withCredentials, true);
  };

  let adapter = this.subject();

  return adapter.ajax('https://sd.cd/fake', 'GET').then((response) => {
    assert.deepEqual(response, { foo: 'bar' });
  });
});

test('it wraps non-array payload with model name', function (assert) {
  let adapter = this.subject();

  const requestData = {
    url: 'http://localhost:8080/v4/builds/12345'
  };

  const payload = adapter.handleResponse(200, {}, { id: 1234 }, requestData);

  assert.deepEqual(payload, {
    build: { id: 1234 }
  });
});

test('it wraps array payload with model name', function (assert) {
  let adapter = this.subject();

  const requestData = {
    url: 'http://localhost:8080/v4/builds'
  };

  const payload = adapter.handleResponse(200, {}, [{ id: 1234 }], requestData);

  assert.deepEqual(payload, {
    builds: [{ id: 1234 }]
  });
});

test('it adds links to pipelines', function (assert) {
  let adapter = this.subject();

  const requestData = {
    url: 'http://localhost:8080/v4/pipelines/1234324'
  };

  const payload = adapter.handleResponse(200, {}, { id: 1234 }, requestData);

  assert.deepEqual(payload, {
    pipeline: {
      id: 1234,
      links: {
        jobs: 'jobs',
        secrets: 'secrets',
        events: 'events',
        tokens: 'tokens',
        metrics: 'metrics'
      }
    }
  });
});

test('it adds links to jobs', function (assert) {
  let adapter = this.subject();

  const requestData = {
    url: 'http://localhost:8080/v4/pipelines/1234/jobs'
  };

  const payload = adapter.handleResponse(200, {}, [{ id: 1234 }], requestData);

  assert.deepEqual(payload, {
    jobs: [{ id: 1234, links: { builds: 'builds?count=10&page=1' } }]
  });
});

test('it adds links to jobs', function (assert) {
  let adapter = this.subject();

  const requestData = {
    url: 'http://localhost:8080/v4/pipelines/1234/jobs'
  };

  const payload = adapter.handleResponse(200, {}, [], requestData);

  assert.deepEqual(payload, {
    jobs: []
  });
});

test('it wraps errors', function (assert) {
  let adapter = this.subject();

  const requestData = {
    url: 'http://localhost:8080/v4/pipelines/1234/jobs'
  };

  const payload = adapter.handleResponse(404, {}, { error: 'bananas' }, requestData);

  assert.ok(payload instanceof DS.AdapterError);
});

test('it wraps error objects', function (assert) {
  let adapter = this.subject();

  const requestData = {
    url: 'http://localhost:8080/v4/pipelines/1234/jobs'
  };

  const payload = adapter.handleResponse(404, {}, {
    error: {
      statusCode: 400,
      error: 'unfortunate',
      message: 'a series of unfortunate events'
    }
  }, requestData);

  assert.ok(payload instanceof DS.AdapterError);
});

test('it takes care of empty payload', function (assert) {
  let adapter = this.subject();

  const requestData = {
    url: 'http://localhost:8080/v4/pipelines/1234'
  };

  const payload = adapter.handleResponse(204, {}, null, requestData);

  assert.deepEqual(payload, {});
});

test('it returns pipelinetoken endpoint when model is token with pipelineId', function (assert) {
  let adapter = this.subject();

  const modelname = 'token';
  const snapshot = { adapterOptions: { pipelineId: '1' } };
  const id = '123';
  const baseUrl = 'http://localhost:8080/v4/pipelines/1/tokens';
  const urlForFindAll = adapter.urlForFindAll(modelname, snapshot);
  const urlForCreateRecord = adapter.urlForCreateRecord(modelname, snapshot);
  const urlForUpdateRecord = adapter.urlForUpdateRecord(id, modelname, snapshot);
  const urlForDeleteRecord = adapter.urlForDeleteRecord(id, modelname, snapshot);

  assert.deepEqual(urlForFindAll, baseUrl);
  assert.deepEqual(urlForCreateRecord, baseUrl);
  assert.deepEqual(urlForUpdateRecord, `${baseUrl}/${id}`);
  assert.deepEqual(urlForDeleteRecord, `${baseUrl}/${id}`);
});

test('it returns endpoint for metric and event given pipeline id', function (assert) {
  const adapter = this.subject();
  const metricsUrl = 'http://localhost:8080/v4/pipelines/1/metrics';
  const eventsUrl = 'http://localhost:8080/v4/pipelines/1/events';

  assert.equal(adapter.urlForQuery({ pipelineId: 1 }, 'metric'), metricsUrl);
  assert.equal(adapter.urlForQuery({ pipelineId: 1 }, 'event'), eventsUrl);
});
