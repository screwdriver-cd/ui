import { moduleFor, test } from 'ember-qunit';
import Ember from 'ember';
let authType = null;

const sessionServiceMock = Ember.Service.extend({
  authenticate(authenticatorType) {
    authType = authenticatorType;
  }
});

moduleFor('controller:login', 'Unit | Controller | login', {
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

  controller.send('authenticate');
  assert.equal(authType, 'authenticator:screwdriver-api');
});
