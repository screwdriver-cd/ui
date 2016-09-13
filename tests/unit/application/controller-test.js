import { moduleFor, test } from 'ember-qunit';
import Ember from 'ember';
let called = 0;

const sessionServiceMock = Ember.Service.extend({
  invalidate() {
    called += 1;
  }
});

moduleFor('controller:application', 'Unit | Controller | application', {
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']
  beforeEach() {
    this.register('service:session', sessionServiceMock);
    this.inject.service('session', { as: 'session' });
  }
});

test('it exists', function (assert) {
  let controller = this.subject();

  assert.ok(controller);
});

test('it calls session.authenticate', function (assert) {
  let controller = this.subject();

  controller.send('invalidateSession');
  assert.equal(called, 1);
});
