import { moduleFor, test } from 'ember-qunit';

moduleFor('route:application', 'Unit | Route | application', {
  // Specify the other units that are required for this test.
  needs: ['service:session']
});

test('it exists', function (assert) {
  let route = this.subject();

  assert.ok(route);
});

test('it calculates title', function (assert) {
  let route = this.subject();

  assert.equal(route.title(), 'screwdriver.cd');
  assert.equal(route.title([]), 'screwdriver.cd');
  assert.equal(route.title(['a', 'b', 'c']), 'a > b > c > screwdriver.cd');
});
