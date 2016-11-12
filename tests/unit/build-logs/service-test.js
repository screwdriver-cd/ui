import { moduleFor, test } from 'ember-qunit';
// import wait from 'ember-test-helpers/wait';
import Pretender from 'pretender';
let server;

const noMoreLogs = () => {
  server.get('http://localhost:8080/v4/builds/1/steps/banana/logs/', () => [
    200,
    {
      'Content-Type': 'application/json',
      'x-more-data': false
    },
    JSON.stringify([{
      t: Date.now(),
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
      t: Date.now(),
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

moduleFor('service:build-logs', 'Unit | Service | build logs', {
  // Specify the other units that are required for this test.
  // needs: ['service:foo']

  beforeEach() {
    server = new Pretender();
  },

  afterEach() {
    server.shutdown();
  }
});

test('it exists', function (assert) {
  const service = this.subject();

  assert.ok(service);
});

test('it makes a call to logs api and logs return with no remaining', function (assert) {
  assert.expect(4);
  noMoreLogs();
  const service = this.subject();
  const p = service.fetchLogs('1', 'banana');

  p.then(({ lines, done }) => {
    assert.ok(done);
    assert.equal(lines.length, 1);
    assert.equal(lines[0].m, 'hello, world');

    const [request] = server.handledRequests;

    assert.equal(request.url, 'http://localhost:8080/v4/builds/1/steps/banana/logs?from=0');
  });
});

test('it makes a call to logs api and logs return with more remaining', function (assert) {
  assert.expect(4);
  moreLogs();
  const service = this.subject();
  const p = service.fetchLogs('1', 'banana', 50);

  p.then(({ lines, done }) => {
    assert.notOk(done);
    assert.equal(lines.length, 1);
    assert.equal(lines[0].m, 'hello, world');

    const [request] = server.handledRequests;

    assert.equal(request.url, 'http://localhost:8080/v4/builds/1/steps/banana/logs?from=50');
  });
});

test('it makes a call to logs api and no logs return with no more remaining', function (assert) {
  assert.expect(3);
  noNewLogs();
  const service = this.subject();
  const p = service.fetchLogs('1', 'banana');

  p.then(({ lines, done }) => {
    assert.notOk(done);
    assert.equal(lines.length, 0);

    const [request] = server.handledRequests;

    assert.equal(request.url, 'http://localhost:8080/v4/builds/1/steps/banana/logs?from=0');
  });
});

test('it handles log api failure by treating it as there are more logs', function (assert) {
  assert.expect(3);
  badLogs();
  const service = this.subject();
  const p = service.fetchLogs('1', 'banana');

  p.then(({ lines, done }) => {
    assert.notOk(done);
    assert.equal(lines.length, 0);

    const [request] = server.handledRequests;

    assert.equal(request.url, 'http://localhost:8080/v4/builds/1/steps/banana/logs?from=0');
  });
});
