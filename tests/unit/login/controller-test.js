import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
let authType = null;

const sessionServiceMock = Service.extend({
  authenticate(authenticatorType) {
    authType = authenticatorType;
  }
});

module('Unit | Controller | login', function(hooks) {
  setupTest(hooks);

  // Specify the other units that are required for this test.
  // needs: ['controller:foo']

  hooks.beforeEach(function() {
    this.owner.register('service:session', sessionServiceMock);
    this.session = this.owner.lookup('service:session');
  });

  test('it exists', function(assert) {
    let controller = this.owner.lookup('controller:login');

    assert.ok(controller);
  });

  test('it calls session.authenticate', function(assert) {
    let controller = this.owner.lookup('controller:login');

    controller.send('authenticate');
    assert.equal(authType, 'authenticator:screwdriver-api');
  });
});
