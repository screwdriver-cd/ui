import { moduleFor, test } from 'ember-qunit';
import Ember from 'ember';

moduleFor('route:pipeline', 'Unit | Route | pipeline', {
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']
});

test('it exists', function (assert) {
  let route = this.subject();

  assert.ok(route);
  assert.equal(route.titleToken(Ember.Object.create({
    appId: 'foo:bar'
  })), 'foo:bar');
});
