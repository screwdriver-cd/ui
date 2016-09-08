import { moduleForModel, test } from 'ember-qunit';

moduleForModel('secret', 'Unit | Serializer | secret', {
  // Specify the other units that are required for this test.
  needs: ['serializer:secret']
});

// Replace this with your real tests.
test('it serializes records', function (assert) {
  let record = this.subject();

  let serializedRecord = record.serialize();

  assert.ok(serializedRecord);
});
