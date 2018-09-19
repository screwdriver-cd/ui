import Service from '@ember/service';
import EmberObject from '@ember/object';
import { Promise as EmberPromise } from 'rsvp';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
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
    let route = this.owner.lookup('route:pipeline');

    assert.ok(route);
    assert.equal(route.titleToken(EmberObject.create({
      pipeline: EmberObject.create({
        name: 'foo:bar'
      })
    })), 'foo:bar');
  });

  test('it returns model', function (assert) {
    assert.expect(4);

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

    const route = this.owner.lookup('route:pipeline');

    return route.model({ pipeline_id: 1 }).then((results) => {
      assert.equal(results.pipeline, 'pipeline');
      assert.equal(results.collections, 'collections');
    });
  });

  test('it returns model on collections fetch error', function (assert) {
    assert.expect(4);

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

    const route = this.owner.lookup('route:pipeline');

    return route.model({ pipeline_id: 1 }).then((results) => {
      assert.equal(results.pipeline, 'pipeline');
      assert.deepEqual(results.collections, []);
    });
  });
});
