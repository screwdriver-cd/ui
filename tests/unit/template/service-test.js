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

let server;

module('Unit | Service | template', function(hooks) {
  setupTest(hooks);

  // Specify the other units that are required for this test.
  // needs: ['service:foo']
  hooks.beforeEach(function() {
    server = new Pretender();
    this.owner.register('service:session', sessionStub);
  });

  hooks.afterEach(function() {
    server.shutdown();
  });

  test('it fetches one set of template versions', function(assert) {
    assert.expect(2);

    server.get('http://localhost:8080/v4/templates/foo%2Fbar', () => [
      200,
      {
        'Content-Type': 'application/json'
      },
      JSON.stringify([
        { id: 2, namespace: 'foo', name: 'bar', version: '2.0.0', createTime },
        { id: 1, namespace: 'foo', name: 'bar', version: '1.0.0', createTime }
      ])
    ]);

    let service = this.owner.lookup('service:template');

    assert.ok(service);

    const t = service.getOneTemplate('foo/bar');

    t.then(templates => {
      /* eslint-disable max-len */
      assert.deepEqual(templates, [
        {
          id: 2,
          namespace: 'foo',
          name: 'bar',
          version: '2.0.0',
          fullName: 'foo/bar',
          createTime,
          lastUpdated
        },
        {
          id: 1,
          namespace: 'foo',
          name: 'bar',
          version: '1.0.0',
          fullName: 'foo/bar',
          createTime,
          lastUpdated
        }
      ]);
      /* eslint-enable max-len */
    });
  });

  test('it fetches one set of template versions with metrics', function(assert) {
    assert.expect(2);

    server.get('http://localhost:8080/v4/templates/foo%2Fbar/metrics', () => [
      200,
      {
        'Content-Type': 'application/json'
      },
      JSON.stringify([
        {
          id: 2,
          namespace: 'foo',
          name: 'bar',
          version: '2.0.0',
          createTime,
          metrics: { jobs: { count: 7 }, builds: { count: 7 } }
        },
        {
          id: 1,
          namespace: 'foo',
          name: 'bar',
          version: '1.0.0',
          createTime,
          metrics: { jobs: { count: 3 }, builds: { count: 9 } }
        }
      ])
    ]);

    let service = this.owner.lookup('service:template');

    assert.ok(service);

    const t = service.getOneTemplateWithMetrics('foo/bar');

    t.then(templates => {
      /* eslint-disable max-len */
      assert.deepEqual(templates, [
        {
          id: 2,
          namespace: 'foo',
          name: 'bar',
          version: '2.0.0',
          fullName: 'foo/bar',
          createTime,
          lastUpdated,
          metrics: { jobs: { count: 7 }, builds: { count: 7 } }
        },
        {
          id: 1,
          namespace: 'foo',
          name: 'bar',
          version: '1.0.0',
          fullName: 'foo/bar',
          createTime,
          lastUpdated,
          metrics: { jobs: { count: 3 }, builds: { count: 9 } }
        }
      ]);
      /* eslint-enable max-len */
    });
  });

  test('it fetches all templates', function(assert) {
    assert.expect(2);

    server.get('http://localhost:8080/v4/templates', () => [
      200,
      {
        'Content-Type': 'application/json'
      },
      JSON.stringify([
        { id: 3, namespace: 'boo', name: 'baz', version: '2.0.0', createTime },
        { id: 2, namespace: 'foo', name: 'baz', version: '2.0.0', createTime },
        { id: 1, namespace: 'foo', name: 'bar', version: '1.0.0', createTime }
      ])
    ]);

    let service = this.owner.lookup('service:template');

    assert.ok(service);

    const t = service.getAllTemplates();

    t.then(templates => {
      assert.deepEqual(templates, [
        /* eslint-disable max-len */
        {
          id: 3,
          fullName: 'boo/baz',
          namespace: 'boo',
          name: 'baz',
          version: '2.0.0',
          createTime,
          lastUpdated
        },
        {
          id: 2,
          fullName: 'foo/baz',
          namespace: 'foo',
          name: 'baz',
          version: '2.0.0',
          createTime,
          lastUpdated
        },
        {
          id: 1,
          fullName: 'foo/bar',
          namespace: 'foo',
          name: 'bar',
          version: '1.0.0',
          createTime,
          lastUpdated
        }
      ]);
      /* eslint-enable max-len */
    });
  });

  test('it deletes all versions of a template', function(assert) {
    assert.expect(4);

    server.delete('http://localhost:8080/v4/templates/foo%2Fbar', () => [204]);

    let service = this.owner.lookup('service:template');

    assert.ok(service);

    const t = service.deleteTemplates('foo/bar');

    t.then(() => {
      const [request] = server.handledRequests;

      assert.equal(request.status, '204');
      assert.equal(request.method, 'DELETE');
      assert.equal(request.url, 'http://localhost:8080/v4/templates/foo%2Fbar');
    });
  });

  test('it returns 403 on unauthorized deletion', function(assert) {
    assert.expect(2);

    server.delete('http://localhost:8080/v4/templates/foo%2Fbar', () => [
      403,
      {
        'Content-Type': 'application/json'
      },
      'Unauthorized'
    ]);

    let service = this.owner.lookup('service:template');

    assert.ok(service);

    const t = service.deleteTemplates('foo/bar');

    t.then(
      () => {},
      err => {
        assert.equal(err, 'You do not have the permissions to remove this template.');
      }
    );
  });

  test('it returns 403 on unauthorized update', function(assert) {
    assert.expect(2);

    server.put('http://localhost:8080/v4/templates/foo%2Fbar/trusted', () => [
      403,
      {
        'Content-Type': 'application/json'
      },
      'Unauthorized'
    ]);

    let service = this.owner.lookup('service:template');

    assert.ok(service);

    const t = service.updateTrust('foo/bar', true);

    t.then(
      () => {},
      err => {
        assert.equal(err, 'You do not have the permissions to update this template.');
      }
    );
  });

  test('it updates the trusted property of a template', function(assert) {
    assert.expect(4);

    server.put('http://localhost:8080/v4/templates/foo%2Fbar/trusted', () => [204]);

    let service = this.owner.lookup('service:template');

    assert.ok(service);

    const t = service.updateTrust('foo/bar', true);

    t.then(() => {
      const [request] = server.handledRequests;

      assert.equal(request.status, '204');
      assert.equal(request.method, 'PUT');
      assert.equal(request.url, 'http://localhost:8080/v4/templates/foo%2Fbar/trusted');
    });
  });
});
