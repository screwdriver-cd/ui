import EmberObject from '@ember/object';
import { moduleFor, test } from 'ember-qunit';

moduleFor('route:pipeline', 'Unit | Route | pipeline', {
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']
});

test('it exists', function (assert) {
  let route = this.subject();

  assert.ok(route);
  assert.equal(route.titleToken(EmberObject.create({
    appId: 'foo:bar'
  })), 'foo:bar');
});
