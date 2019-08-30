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
const createTime = '2016-09-23T16:53:00.274Z';
const created = new Date(createTime).getTime();
const lastUpdated = `${humanizeDuration(Date.now() - created, { round: true, largest: 1 })} ago`;
const dummyCommands = [
  { id: 2, namespace: 'foo', name: 'bar', version: '2.0.0', createTime },
  { id: 1, namespace: 'foo', name: 'bar', version: '1.0.0', createTime }
];
const dummyCommandsResult = dummyCommands.map(c => {
  c.lastUpdated = lastUpdated;

  return c;
});
const dummyCommandTags = [
  { id: 2, namespace: 'foo', name: 'bar', tag: 'latest', version: '2.0.0', createTime },
  { id: 1, namespace: 'foo', name: 'bar', tag: 'stable', version: '1.0.0', createTime }
];
const dummyCommandTagsResult = dummyCommandTags.map(c => {
  c.lastUpdated = lastUpdated;

  return c;
});

let server;

module('Unit | Service | command', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    server = new Pretender();
    this.owner.register('service:session', sessionStub);
  });

  hooks.afterEach(function() {
    server.shutdown();
  });

  test('it fetches one set of command version', function(assert) {
    assert.expect(2);

    server.get('http://localhost:8080/v4/commands/foo/bar', () => [
      200,
      {
        'Content-Type': 'application/json'
      },
      JSON.stringify(dummyCommands)
    ]);

    let service = this.owner.lookup('service:command');

    assert.ok(service);

    const t = service.getOneCommand('foo', 'bar');

    t.then(commands => {
      assert.deepEqual(commands, dummyCommandsResult);
    });
  });

  test('it fetches one set of command tags', function(assert) {
    assert.expect(2);

    server.get('http://localhost:8080/v4/commands/foo/bar/tags', () => [
      200,
      {
        'Content-Type': 'application/json'
      },
      JSON.stringify(dummyCommandTags)
    ]);

    let service = this.owner.lookup('service:command');

    assert.ok(service);

    const t = service.getCommandTags('foo', 'bar');

    t.then(commands => {
      assert.deepEqual(commands, dummyCommandTagsResult);
    });
  });

  test('it fetches all commands', function(assert) {
    assert.expect(2);

    server.get('http://localhost:8080/v4/commands', () => [
      200,
      {
        'Content-Type': 'application/json'
      },
      JSON.stringify(dummyCommands)
    ]);

    let service = this.owner.lookup('service:command');

    assert.ok(service);

    const t = service.getAllCommands();

    const filteredCommands = [
      { id: 2, namespace: 'foo', name: 'bar', version: '2.0.0', createTime, lastUpdated }
    ];

    t.then(commands => {
      assert.deepEqual(commands, filteredCommands);
    });
  });

  test('it deletes all versions of a command', function(assert) {
    assert.expect(4);

    server.delete('http://localhost:8080/v4/commands/foo/bar', () => [204]);

    let service = this.owner.lookup('service:command');

    assert.ok(service);

    const t = service.deleteCommands('foo', 'bar');

    t.then(() => {
      const [request] = server.handledRequests;

      assert.equal(request.status, '204');
      assert.equal(request.method, 'DELETE');
      assert.equal(request.url, 'http://localhost:8080/v4/commands/foo/bar');
    });
  });

  test('it returns 403 on unauthorized deletion', function(assert) {
    assert.expect(2);

    server.delete('http://localhost:8080/v4/commands/foo/bar', () => [
      403,
      {
        'Content-Type': 'application/json'
      },
      'Unauthorized'
    ]);

    let service = this.owner.lookup('service:command');

    assert.ok(service);

    const t = service.deleteCommands('foo', 'bar');

    t.then(
      () => {},
      err => {
        assert.equal(err, 'You do not have the permissions to remove this command.');
      }
    );
  });

  test('it returns 403 on unauthorized update', function(assert) {
    assert.expect(2);

    server.put('http://localhost:8080/v4/commands/foo/bar/trusted', () => [
      403,
      {
        'Content-Type': 'application/json'
      },
      'Unauthorized'
    ]);

    let service = this.owner.lookup('service:command');

    assert.ok(service);

    const t = service.updateTrust('foo', 'bar', true);

    t.then(
      () => {},
      err => {
        assert.equal(err, 'You do not have the permissions to update this command.');
      }
    );
  });

  test('it updates the trusted property of a command', function(assert) {
    assert.expect(4);

    server.put('http://localhost:8080/v4/commands/foo/bar/trusted', () => [204]);

    let service = this.owner.lookup('service:command');

    assert.ok(service);

    const t = service.updateTrust('foo', 'bar', true);

    t.then(() => {
      const [request] = server.handledRequests;

      assert.equal(request.status, '204');
      assert.equal(request.method, 'PUT');
      assert.equal(request.url, 'http://localhost:8080/v4/commands/foo/bar/trusted');
    });
  });
});
