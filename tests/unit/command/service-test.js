import { moduleFor, test } from 'ember-qunit';
import Pretender from 'pretender';

let server;

moduleFor('service:command', 'Unit | Service | command', {
  beforeEach() {
    server = new Pretender();
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
