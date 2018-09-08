import { moduleFor, test } from 'ember-qunit';
import Service from '@ember/service';
import Pretender from 'pretender';
let server;
const now = Date.now();

const noMoreLogs = () => {
  server.get('http://localhost:8080/v4/builds/1/steps/banana/logs/', () => [
    200,
    {
      'Content-Type': 'application/json',
      'x-more-data': false
    },
    JSON.stringify([{
      t: now,
      n: 0,
      m: 'hello, world'
    }])
  ]);
};

const moreLogs = () => {
  server.get('http://localhost:8080/v4/builds/1/steps/banana/logs/', () => [
    200,
    {
      'Content-Type': 'application/json',
      'x-more-data': true
    },
    JSON.stringify([{
      t: now,
      n: 0,
      m: 'hello, world'
    }])
  ]);
};

const noNewLogs = () => {
  server.get('http://localhost:8080/v4/builds/1/steps/banana/logs/', () => [
    200,
    {
      'Content-Type': 'application/json',
      'x-more-data': true
    },
    '[]'
  ]);
};

const badLogs = () => {
  server.get('http://localhost:8080/v4/builds/1/steps/banana/logs/', () => [
    404,
    {
      'Content-Type': 'application/json'
    },
    ''
  ]);
};

const sessionServiceMock = Service.extend({
  isAuthenticated: true,
  data: {
    authenticated: {
      token: 'banana'
    }
  }
});

const serviceConfig = {
  buildId: '1',
  stepName: 'banana'
};

moduleFor('service:build-logs', 'Unit | Service | build logs', {
  // Specify the other units that are required for this test.
  // needs: ['service:foo']

  beforeEach() {
    server = new Pretender();
    this.register('service:session', sessionServiceMock);
    this.inject.service('session', { as: 'session' });
    this.session.set('isAuthenticated', true);
  },

  afterEach() {
    server.shutdown();
  }
});

test('it exists', function (assert) {
  const service = this.subject();

  assert.ok(service);
});

test('it rejects if the user is not authenticated', function (assert) {
  assert.expect(2);
  noMoreLogs();
  this.session.set('isAuthenticated', false);

  const service = this.subject();
  const p = service.fetchLogs(serviceConfig);

  p.catch((e) => {
    assert.ok(e instanceof Error, e);
    assert.equal('User is not authenticated', e.message);
  });
});

test('it makes a call to logs api and logs return with no remaining', function (assert) {
  assert.expect(4);
  noMoreLogs();
  const service = this.subject();
  const p = service.fetchLogs(serviceConfig);

  p.then(({ lines, done }) => {
    assert.ok(done);
    assert.equal(lines.length, 1);
    assert.equal(lines[0].m, 'hello, world');

    const [request] = server.handledRequests;

    assert.equal(request.url,
      'http://localhost:8080/v4/builds/1/steps/banana/logs?from=0&pages=10&sort=ascending');
  });
});

test('it makes a call to logs api and logs return with more remaining', function (assert) {
  assert.expect(4);
  moreLogs();
  const service = this.subject();
  const p = service.fetchLogs({ logNumber: 50, ...serviceConfig });

  p.then(({ lines, done }) => {
    assert.notOk(done);
    assert.equal(lines.length, 1);
    assert.equal(lines[0].m, 'hello, world');

    const [request] = server.handledRequests;

    assert.equal(request.url,
      'http://localhost:8080/v4/builds/1/steps/banana/logs?from=50&pages=10&sort=ascending');
  });
});

test('it makes a call to logs api and no logs return with no more remaining', function (assert) {
  assert.expect(3);
  noNewLogs();
  const service = this.subject();
  const p = service.fetchLogs(serviceConfig);

  p.then(({ lines, done }) => {
    assert.notOk(done);
    assert.equal(lines.length, 0);

    const [request] = server.handledRequests;

    assert.equal(request.url,
      'http://localhost:8080/v4/builds/1/steps/banana/logs?from=0&pages=10&sort=ascending');
  });
});

test('it handles log api failure by treating it as there are more logs', function (assert) {
  assert.expect(3);
  badLogs();
  const service = this.subject();
  const p = service.fetchLogs(serviceConfig);

  p.then(({ lines, done }) => {
    assert.notOk(done);
    assert.equal(lines.length, 0);

    const [request] = server.handledRequests;

    assert.equal(request.url,
      'http://localhost:8080/v4/builds/1/steps/banana/logs?from=0&pages=10&sort=ascending');
  });
});

test('it handles fetching multiple pages', function (assert) {
  assert.expect(3);
  noNewLogs();
  const service = this.subject();
  const p = service.fetchLogs({ logNumber: 0, pageSize: 100, ...serviceConfig });

  p.then(({ lines, done }) => {
    assert.notOk(done);
    assert.equal(lines.length, 0);

    const [request] = server.handledRequests;

    assert.equal(request.url,
      'http://localhost:8080/v4/builds/1/steps/banana/logs?from=0&pages=100&sort=ascending');
  });
});
