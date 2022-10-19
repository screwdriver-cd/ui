import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { run } from '@ember/runloop';

module('Unit | Controller | application', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    run(() => {
      // Need this to mock any core services
      // https://github.com/emberjs/ember-qunit/issues/325
      this.owner.unregister('service:session');
    });
  });

  test('it exists', function (assert) {
    const controller = this.owner.lookup('controller:application');

    assert.ok(controller);
  });

  test('it calls session.invalidateSession', function (assert) {
    assert.expect(3);

    const sessionServiceMock = Service.extend({
      data: {},
      invalidate() {
        assert.ok(true);
      }
    });

    this.owner.register('service:session', sessionServiceMock);

    const controller = this.owner.lookup('controller:application');

    assert.equal(controller.session.get('data.sessionChanged'), undefined);

    controller.send('invalidateSession');
    assert.equal(controller.session.get('data.sessionChanged'), false);
  });

  test('it calls session.authenticate', function (assert) {
    assert.expect(4);

    const controller = this.owner.lookup('controller:application');

    const sessionServiceMock = Service.extend({
      data: { authenticated: {} },
      authenticate() {
        assert.ok(true);

        return { then: cb => cb() };
      }
    });

    this.owner.register('service:session', sessionServiceMock);

    controller.send('authenticate');
    assert.equal(controller.session.get('data.sessionChanged'), undefined);

    controller.session.set('data.authenticated.scmContext', 'new');
    controller.send('authenticate');
    assert.equal(controller.session.get('data.sessionChanged'), true);
  });

  test('it calls search in controller', function (assert) {
    const controller = this.owner.lookup('controller:application');

    controller.transitionToRoute = (path, params) => {
      assert.equal(path, 'search');
      assert.deepEqual(params, { queryParams: { query: 'myquery' } });
    };

    controller.send('search', 'myquery');
  });
});
