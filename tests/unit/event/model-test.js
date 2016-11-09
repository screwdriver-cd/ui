import { moduleForModel, test } from 'ember-qunit';

moduleForModel('event', 'Unit | Model | event', {
  // Specify the other units that are required for this test.
  needs: ['model:build']
});

test('it exists', function (assert) {
  let model = this.subject();

  assert.ok(!!model);
});
