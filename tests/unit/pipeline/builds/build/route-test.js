import { moduleFor, test } from 'ember-qunit';
import Ember from 'ember';

moduleFor('route:pipeline/builds/build', 'Unit | Route | pipeline/builds/build', {
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']
});

test('it exists', function (assert) {
  let route = this.subject();

  assert.ok(route);
  assert.equal(route.titleToken({
    job: Ember.Object.create({ name: 'main' }),
    build: Ember.Object.create({ sha: 'abcd1234567890' })
  }), 'main > #abcd12');
});
