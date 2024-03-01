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
    const controller = this.owner.lookup(
      'controller:user-settings/preferences'
    );

    assert.ok(controller);
  });

  test('it calls resetUserSettings', async function (assert) {
    assert.expect(5);

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
      },
      peekAll() {
        assert.ok('peekAll called');

        return new EmberPromise(resolve => resolve([]));
      }
    });

    this.owner.register('service:store', storeStub);

    const controller = this.owner.lookup(
      'controller:user-settings/preferences'
    );

    const resetUserSettingsActionStub = sinon.spy(
      controller.actions,
      'resetUserSettings'
    );

    await settled();

    controller.send('resetUserSettings');

    assert.ok(
      resetUserSettingsActionStub.calledOnce,
      'action resetUserSettings called once'
    );
  });

  test('it unloads pipeline settings when resetUserSettings executes', async function (assert) {
    assert.expect(6);

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
      },
      peekAll() {
        assert.ok('peekAll called');

        return new EmberPromise(resolve =>
          resolve([
            {
              unloadRecord() {
                assert.ok('unload record called');
              }
            }
          ])
        );
      }
    });

    this.owner.register('service:store', storeStub);

    const controller = this.owner.lookup(
      'controller:user-settings/preferences'
    );

    const resetUserSettingsActionStub = sinon.spy(
      controller.actions,
      'resetUserSettings'
    );

    await settled();

    controller.send('resetUserSettings');

    assert.ok(
      resetUserSettingsActionStub.calledOnce,
      'action resetUserSettings called once'
    );
  });
});
