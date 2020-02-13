import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Service from '@ember/service';
import Pretender from 'pretender';
import Ember from 'ember';

let server;
const now = Date.now();

const noMoreLogs = () => {
  server.get('http://localhost:8080/v4/builds/1/steps/banana/logs/', () => [
    200,
    {
      'Content-Type': 'application/json',
      'x-more-data': false
    },
    JSON.stringify([
      {
        t: now,
        n: 0,
        m: 'hello, world'
      }
    ])
  ]);
};

const moreLogs = () => {
  server.get('http://localhost:8080/v4/builds/1/steps/banana/logs/', () => [
    200,
    {
      'Content-Type': 'application/json',
      'x-more-data': true
    },
    JSON.stringify([
      {
        t: now,
        n: 0,
        m: 'hello, world'
      }
    ])
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
  stepName: 'banana',
  started: true
};

module('Unit | Service | build logs', function(hooks) {
  setupTest(hooks);

  // Specify the other units that are required for this test.
  // needs: ['service:foo']

  hooks.beforeEach(function() {
    server = new Pretender();
    this.owner.register('service:session', sessionServiceMock);
    this.session = this.owner.lookup('service:session');
    this.session.set('isAuthenticated', true);
    this.owner.lookup('service:build-logs').resetCache();
  });

  hooks.afterEach(function() {
    server.shutdown();
  });

  test('it exists', function(assert) {
    const service = this.owner.lookup('service:build-logs');

    assert.ok(service);
  });

  test('it rejects if the user is not authenticated', function(assert) {
    assert.expect(2);
    noMoreLogs();
    this.session.set('isAuthenticated', false);

    const service = this.owner.lookup('service:build-logs');
    const p = service.fetchLogs(serviceConfig);

    p.catch(e => {
      assert.ok(e instanceof Error, e);
      assert.equal('User is not authenticated', e.message);
    });
  });

  test('it makes a call to logs api and logs return with no remaining', async function(assert) {
    assert.expect(4);
    noMoreLogs();
    const service = this.owner.lookup('service:build-logs');
    const { lines, done } = await service.fetchLogs(serviceConfig);

    assert.ok(done);
    assert.equal(lines.length, 1);
    assert.equal(lines[0].m, 'hello, world');

    const [request] = server.handledRequests;

    assert.equal(
      request.url,
      'http://localhost:8080/v4/builds/1/steps/banana/logs?from=0&pages=10&sort=ascending'
    );
  });

  test('it makes a call to logs api and logs return with more remaining', async function(assert) {
    assert.expect(4);
    moreLogs();
    const service = this.owner.lookup('service:build-logs');
    const { lines, done } = await service.fetchLogs({ logNumber: 50, ...serviceConfig });

    assert.notOk(done);
    assert.equal(lines.length, 1);
    assert.equal(lines[0].m, 'hello, world');

    const [request] = server.handledRequests;

    assert.equal(
      request.url,
      'http://localhost:8080/v4/builds/1/steps/banana/logs?from=50&pages=10&sort=ascending'
    );
  });

  test('it makes a call to logs api and no logs return with no more remaining', async function(assert) {
    assert.expect(3);
    noNewLogs();
    const service = this.owner.lookup('service:build-logs');
    const { lines, done } = await service.fetchLogs(serviceConfig);

    assert.notOk(done);
    assert.equal(lines.length, 0);

    const [request] = server.handledRequests;

    assert.equal(
      request.url,
      'http://localhost:8080/v4/builds/1/steps/banana/logs?from=0&pages=10&sort=ascending'
    );
  });

  test('it handles log api failure by treating it as there are more logs', async function(assert) {
    assert.expect(3);
    badLogs();
    const service = this.owner.lookup('service:build-logs');

    try {
      const { lines, done } = await service.fetchLogs(serviceConfig);

      assert.notOk(done);
      assert.equal(lines.length, 0);

      const [request] = server.handledRequests;

      assert.equal(
        request.url,
        'http://localhost:8080/v4/builds/1/steps/banana/logs?from=0&pages=10&sort=ascending'
      );
    } catch (err) {
      Ember.Logger.error('err', err);
    }
  });

  test('it handles fetching multiple pages', async function(assert) {
    assert.expect(3);
    noNewLogs();
    const service = this.owner.lookup('service:build-logs');
    const { lines, done } = await service.fetchLogs({
      logNumber: 0,
      pageSize: 100,
      ...serviceConfig
    });

    assert.notOk(done);
    assert.equal(lines.length, 0);

    const [request] = server.handledRequests;

    assert.equal(
      request.url,
      'http://localhost:8080/v4/builds/1/steps/banana/logs?from=0&pages=100&sort=ascending'
    );
  });

  test('it can reset the cache', function(assert) {
    assert.expect(2);
    const service = this.owner.lookup('service:build-logs');

    assert.ok(service.get('cache'));
    assert.equal(Object.keys(service.get('cache')).length, 0);
  });

  test('it creates and revokes object url', function(assert) {
    // assert.expect(5);
    const service = this.owner.lookup('service:build-logs');

    service.setCache(serviceConfig.buildId, serviceConfig.stepName, {
      logs: [
        {
          t: now,
          n: 0,
          m: 'hello, world'
        }
      ]
    });

    const url = service.buildLogBlobUrl(serviceConfig.buildId, serviceConfig.stepName);

    assert.ok(url);
    assert.equal(service.getCache(serviceConfig.buildId, serviceConfig.stepName, 'blobUrl'), url);
    assert.equal(
      service.get('blobKeys')[0].toString(),
      [serviceConfig.buildId, serviceConfig.stepName].toString()
    );

    service.revokeLogBlobUrls();
    assert.equal(service.get('blobKeys').length, 0);
    assert.equal(
      service.getCache(serviceConfig.buildId, serviceConfig.stepName, 'blobUrl'),
      undefined
    );
  });
});
