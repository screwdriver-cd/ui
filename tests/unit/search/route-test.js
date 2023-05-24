import { module, test } from 'qunit';
import Service from '@ember/service';
import { Promise as EmberPromise } from 'rsvp';
import { setupTest } from 'ember-qunit';
import { run } from '@ember/runloop';

module('Unit | Route | search', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    run(() => {
      // Need this to mock store
      // https://github.com/emberjs/ember-qunit/issues/325
      this.owner.unregister('service:store');
    });
  });

  test('it exists', function (assert) {
    const route = this.owner.lookup('route:search');

    assert.ok(route);
  });

  test('it returns model even on collections fetch error', function (assert) {
    assert.expect(5);

    const storeStub = Service.extend({
      query(record, conf) {
        assert.ok(conf.page === 1);
        assert.ok(conf.search === 'search');

        return new EmberPromise(resolve => resolve('results'));
      },
      findAll(record) {
        assert.ok(record === 'collection');

        return new EmberPromise((resolve, reject) => reject());
      }
    });

    this.owner.register('service:store', storeStub);

    const route = this.owner.lookup('route:search');

    return route.model({ query: 'search' }).then(results => {
      assert.equal(results.pipelines, 'results');
      assert.deepEqual(results.collections, []);
    });
  });
});
