import { moduleFor, test } from 'ember-qunit';

moduleFor('controller:error', 'Unit | Controller | error page', {
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']
});

test('it gets the right image for 5xx', function (assert) {
  let controller = this.subject();

  controller.set('statusCode', 500);
  assert.equal(controller.get('backgroundImage'), '500-error-page.png');
});

test('it gets the right image for 4xx', function (assert) {
  let controller = this.subject();

  controller.set('statusCode', 404);
  assert.equal(controller.get('backgroundImage'), '404-error-page.png');
});
