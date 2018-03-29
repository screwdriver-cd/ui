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

moduleFor('service:template', 'Unit | Service | template', {
  // Specify the other units that are required for this test.
  // needs: ['service:foo']
  beforeEach() {
    server = new Pretender();
    this.register('service:session', sessionStub);
  },

  afterEach() {
    server.shutdown();
  }
});

test('it fetches one set of template versions', function (assert) {
  assert.expect(3);

  server.get('http://localhost:8080/v4/templates/foo%2Fbar', () => [
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

  const t = service.getOneTemplate('foo/bar');

  t.then((templates) => {
    assert.deepEqual(templates[0], { id: 2, version: '2.0.0' });
    assert.deepEqual(templates[1], { id: 1, version: '1.0.0' });
  });
});

test('it fetches all templates', function (assert) {
  assert.expect(3);

  server.get('http://localhost:8080/v4/templates', () => [
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

  const t = service.getAllTemplates();

  t.then((templates) => {
    assert.deepEqual(templates[0], { id: 2, version: '2.0.0' });
    assert.deepEqual(templates[1], { id: 1, version: '1.0.0' });
  });
});

test('it deletes all versions of a template', function (assert) {
  assert.expect(4);

  server.delete('http://localhost:8080/v4/templates/foo%2Fbar', () => [204]);

  let service = this.subject();

  assert.ok(service);

  const t = service.deleteTemplates('foo/bar');

  t.then(() => {
    const [request] = server.handledRequests;

    assert.equal(request.status, '204');
    assert.equal(request.method, 'DELETE');
    assert.equal(request.url, 'http://localhost:8080/v4/templates/foo%2Fbar');
  });
});

test('it returns 401 on unauthorized deletion', function (assert) {
  assert.expect(2);

  server.delete('http://localhost:8080/v4/templates/foo%2Fbar', () => [
    401,
    {
      'Content-Type': 'application/json'
    },
    'Unauthorized'
  ]);

  let service = this.subject();

  assert.ok(service);

  const t = service.deleteTemplates('foo/bar');

  t.then(
    () => {},
    (err) => {
      assert.equal(err, 'You do not have the permissions to remove this template');
    }
  );
});
