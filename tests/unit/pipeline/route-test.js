import Service from '@ember/service';
import { Promise as EmberPromise } from 'rsvp';
import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import { run } from '@ember/runloop';

module('Unit | Route | pipeline', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    run(() => {
      // Need this to mock store
      // https://github.com/emberjs/ember-qunit/issues/325
      this.owner.unregister('service:store');
    });
  });

  test('it exists', function (assert) {
    const route = this.owner.lookup('route:pipeline');

    assert.ok(route);
  });

  test('it returns model', function (assert) {
    assert.expect(7);

    const storeStub = Service.extend({
      findRecord(record, id) {
        assert.ok(id === 1);

        return new EmberPromise(resolve => resolve('pipeline'));
      },
      findAll(record) {
        assert.ok(record === 'collection');

        return new EmberPromise(resolve => resolve('collections'));
      }
    });

    this.owner.register('service:store', storeStub);

    const shuttleService = Service.extend({
      fetchBanners: (scope, scopeId) => {
        assert.equal(scope, 'PIPELINE');
        assert.equal(scopeId, 1);

        return new EmberPromise(resolve => resolve('banners'));
      }
    });

    this.owner.register('service:shuttle', shuttleService);

    const route = this.owner.lookup('route:pipeline');

    return route.model({ pipeline_id: 1 }).then(results => {
      assert.equal(results.pipeline, 'pipeline');
      assert.equal(results.collections, 'collections');
      assert.equal(results.banners, 'banners');
    });
  });

  test('it returns model on collections fetch error', function (assert) {
    assert.expect(7);

    const storeStub = Service.extend({
      findRecord(record, id) {
        assert.ok(id === 1);

        return new EmberPromise(resolve => resolve('pipeline'));
      },
      findAll(record) {
        assert.ok(record === 'collection');

        return new EmberPromise((resolve, reject) => reject());
      }
    });

    this.owner.register('service:store', storeStub);

    const shuttleService = Service.extend({
      fetchBanners: (scope, scopeId) => {
        assert.equal(scope, 'PIPELINE');
        assert.equal(scopeId, 1);

        return new EmberPromise(resolve => resolve('banners'));
      }
    });

    this.owner.register('service:shuttle', shuttleService);

    const route = this.owner.lookup('route:pipeline');

    return route.model({ pipeline_id: 1 }).then(results => {
      assert.equal(results.pipeline, 'pipeline');
      assert.deepEqual(results.collections, []);
      assert.equal(results.banners, 'banners');
    });
  });

  test('it returns model on banners fetch error', function (assert) {
    assert.expect(7);

    const storeStub = Service.extend({
      findRecord(record, id) {
        assert.ok(id === 1);

        return new EmberPromise(resolve => resolve('pipeline'));
      },
      findAll(record) {
        assert.ok(record === 'collection');

        return new EmberPromise(resolve => resolve('collections'));
      }
    });

    this.owner.register('service:store', storeStub);

    const shuttleService = Service.extend({
      fetchBanners: (scope, scopeId) => {
        assert.equal(scope, 'PIPELINE');
        assert.equal(scopeId, 1);

        return new EmberPromise((resolve, reject) => reject());
      }
    });

    this.owner.register('service:shuttle', shuttleService);

    const route = this.owner.lookup('route:pipeline');

    return route.model({ pipeline_id: 1 }).then(results => {
      assert.equal(results.pipeline, 'pipeline');
      assert.equal(results.collections, 'collections');
      assert.deepEqual(results.banners, []);
    });
  });
});
