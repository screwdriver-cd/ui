import { moduleFor, test } from 'ember-qunit';
import Pretender from 'pretender';
import Service from '@ember/service';

const sessionStub = Service.extend({
  data: {
    authenticated: {
      token: 'faketoken'
    }
  }
});
const createTime = '2016-09-23T16:53:00.274Z';
const created = new Date(createTime).getTime();
const lastUpdated = `${humanizeDuration(Date.now() - created, { round: true, largest: 1 })} ago`;

let server;

moduleFor('service:command', 'Unit | Service | command', {
  beforeEach() {
    server = new Pretender();
    this.register('service:session', sessionStub);
  },

  afterEach() {
    server.shutdown();
  }
});

test('it fetches one set of command version', function (assert) {
  assert.expect(2);

  server.get('http://localhost:8080/v4/commands/foo/bar', () => [
    200,
    {
      'Content-Type': 'application/json'
    },
    JSON.stringify([
      { id: 2, namespace: 'foo', name: 'bar', version: '2.0.0', createTime },
      { id: 1, namespace: 'foo', name: 'bar', version: '1.0.0', createTime }
    ])
  ]);

  let service = this.subject();

  assert.ok(service);

  const t = service.getOneCommand('foo', 'bar');

  t.then((commands) => {
    /* eslint-disable max-len */
    assert.deepEqual(commands, [
      { id: 2, namespace: 'foo', name: 'bar', version: '2.0.0', createTime, lastUpdated },
      { id: 1, namespace: 'foo', name: 'bar', version: '1.0.0', createTime, lastUpdated }
    ]);
    /* eslint-enable max-len */
  });
});

test('it fetches all commands', function (assert) {
  assert.expect(2);

  server.get('http://localhost:8080/v4/commands', () => [
    200,
    {
      'Content-Type': 'application/json'
    },
    JSON.stringify([
      { id: 2, namespace: 'foo', name: 'baz', version: '2.0.0', createTime },
      { id: 1, namespace: 'foo', name: 'bar', version: '1.0.0', createTime }
    ])
  ]);

  let service = this.subject();

  assert.ok(service);

  const t = service.getAllCommands();

  t.then((commands) => {
    assert.deepEqual(commands, [
      /* eslint-disable max-len */
      { id: 2, namespace: 'foo', name: 'baz', version: '2.0.0', createTime, lastUpdated },
      { id: 1, namespace: 'foo', name: 'bar', version: '1.0.0', createTime, lastUpdated }
    ]);
    /* eslint-enable max-len */
  });
});

test('it deletes all versions of a command', function (assert) {
  assert.expect(4);

  server.delete('http://localhost:8080/v4/commands/foo/bar', () => [204]);

  let service = this.subject();

  assert.ok(service);

  const t = service.deleteCommands('foo', 'bar');

  t.then(() => {
    const [request] = server.handledRequests;

    assert.equal(request.status, '204');
    assert.equal(request.method, 'DELETE');
    assert.equal(request.url, 'http://localhost:8080/v4/commands/foo/bar');
  });
});

test('it returns 401 on unauthorized deletion', function (assert) {
  assert.expect(2);

  server.delete('http://localhost:8080/v4/commands/foo/bar', () => [
    401,
    {
      'Content-Type': 'application/json'
    },
    'Unauthorized'
  ]);

  let service = this.subject();

  assert.ok(service);

  const t = service.deleteCommands('foo', 'bar');

  t.then(
    () => {},
    (err) => {
      assert.equal(err, 'You do not have the permissions to remove this command.');
    }
  );
});
