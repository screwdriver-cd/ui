import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Serializer | build history', function (hooks) {
  setupTest(hooks);

  // Replace this with your real tests.
  test('it exists', function (assert) {
    let store = this.owner.lookup('service:store');

    let serializer = store.serializerFor('build-history');

    assert.ok(serializer);
  });

  test('it serializes records', function (assert) {
    let store = this.owner.lookup('service:store');

    let record = store.createRecord('build-history', {});

    let serializedRecord = record.serialize();

    assert.ok(serializedRecord);
  });

  test('modelNameFromPayloadKey is build-history', function (assert) {
    let store = this.owner.lookup('service:store');

    let serializer = store.serializerFor('build-history');

    assert.equal(serializer.modelNameFromPayloadKey(), 'build-history');
  });
});
