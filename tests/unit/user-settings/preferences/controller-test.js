import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { settled } from '@ember/test-helpers';
import { Promise as EmberPromise } from 'rsvp';
import sinon from 'sinon';

module('Unit | Controller | user-settings/preferences', function (hooks) {
  setupTest(hooks);

  // Specify the other units that are required for this test.
  // needs: ['controller:foo']

  hooks.beforeEach(function () {
    this.owner.unregister('service:userSettings');
    this.owner.unregister('service:store');
  });

  test('it exists', function (assert) {
    let controller = this.owner.lookup('controller:user-settings/preferences');

    assert.ok(controller);
  });

  test('it calls resetUserSettings', async function (assert) {
    assert.expect(4);

    const controller = this.owner.lookup(
      'controller:user-settings/preferences'
    );
    const userSettingsServiceMock = Service.extend({
      getUserPreference() {
        const record = {
          save() {
            assert.ok('save called');

            return EmberPromise.resolve();
          },
          unloadRecord() {
            assert.ok('unloadRecord called');

            return EmberPromise.resolve();
          }
        };

        return record;
      }
    });

    this.owner.register('service:userSettings', userSettingsServiceMock);

    const storeStub = Service.extend({
      deleteRecord(/* record */) {
        assert.ok('deleteRecord called');

        return new EmberPromise(resolve => resolve({}));
      }
    });

    this.owner.register('service:store', storeStub);

    await settled();

    const resetUserSettingsActionStub = sinon.spy(
      controller.actions,
      'resetUserSettings'
    );

    controller.send('resetUserSettings');

    assert.ok(
      resetUserSettingsActionStub.calledOnce,
      'action resetUserSettings called once'
    );
  });
});
