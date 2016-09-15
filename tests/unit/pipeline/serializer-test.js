import { moduleForModel, test } from 'ember-qunit';

moduleForModel('pipeline', 'Unit | Serializer | pipeline', {
  // Specify the other units that are required for this test.
  needs: ['serializer:pipeline', 'model:secret', 'model:job']
});

// Replace this with your real tests.
test('it serializes records', function (assert) {
  let record = this.subject();

  let serializedRecord = record.serialize();

  assert.ok(serializedRecord);
});
