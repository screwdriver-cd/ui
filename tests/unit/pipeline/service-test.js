import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Service from '@ember/service';

let pipelines;

const storeServiceStub = Service.extend({
  query() {
    return pipelines;
  }
});

module('Unit | Service | pipeline', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    this.owner.unregister('service:store');
    this.owner.register('service:store', storeServiceStub);
  });

  test('it exists', function (assert) {
    const service = this.owner.lookup('service:pipeline');

    assert.ok(service);
  });

  test('it handles updating job state', function (assert) {
    pipelines = EmberObject.create([
      {
        id: 123456,
        name: 'screwdriver-cd/screwdriver'
      }
    ]);

    const service = this.owner.lookup('service:pipeline');
    const value = service.getSiblingPipeline('screwdriver-cd/screwdriver');

    assert.equal(value, pipelines);
  });
});
