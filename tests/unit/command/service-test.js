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
  assert.expect(3);

  server.get('http://localhost:8080/v4/commands/foo/bar', () => [
    200,
    {
      'Content-Type': 'application/json'
    },
    JSON.stringify([
      { id: 2, version: '2.0.0' }, { id: 1, version: '1.0.0' }
    ])
  ]);

  let service = this.subject();

  assert.ok(service);

  const t = service.getOneCommand('foo', 'bar');

  t.then((commands) => {
    assert.deepEqual(commands[0], { id: 2, version: '2.0.0' });
    assert.deepEqual(commands[1], { id: 1, version: '1.0.0' });
  });
});

test('it fetches all commands', function (assert) {
  assert.expect(3);

  server.get('http://localhost:8080/v4/commands', () => [
    200,
    {
      'Content-Type': 'application/json'
    },
    JSON.stringify([
      { id: 2, version: '2.0.0' }, { id: 1, version: '1.0.0' }
    ])
  ]);

  let service = this.subject();

  assert.ok(service);

  const t = service.getAllCommands();

  t.then((commands) => {
    assert.deepEqual(commands[0], { id: 2, version: '2.0.0' });
    assert.deepEqual(commands[1], { id: 1, version: '1.0.0' });
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
