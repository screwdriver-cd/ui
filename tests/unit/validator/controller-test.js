import { moduleFor, test } from 'ember-qunit';

moduleFor('controller:validator', 'Unit | Controller | validator', {
  // Specify the other units that are required for this test.
  needs: ['service:validator']
});

// Replace this with your real tests.
test('it exists', function (assert) {
  const controller = this.subject();

  assert.ok(controller);
});
