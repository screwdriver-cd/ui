import { moduleFor, test } from 'ember-qunit';

moduleFor('route:pipeline/secrets', 'Unit | Route | pipeline/secrets', {
  // Specify the other units that are required for this test.
  needs: ['service:session']
});

test('it exists', function (assert) {
  let route = this.subject();

  assert.ok(route);
  assert.equal(route.titleToken, 'Secrets');
});
