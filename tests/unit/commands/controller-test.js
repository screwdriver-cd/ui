import { module } from 'qunit';
import { setupTest } from 'ember-qunit';
import { run } from '@ember/runloop';
import test from 'ember-sinon-qunit/test-support/test';

module('Unit | Controller | Commands', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const controller = this.owner.lookup('controller:commands');

    assert.ok(controller);
  });

  test('it creates correct breadcrumbs', function (assert) {
    const controller = this.owner.lookup('controller:commands');

    run(() => {
      controller.set('routeParams', {
        namespace: 'testNamespace',
        name: 'testName'
      });

      assert.deepEqual(controller.crumbs, [
        {
          name: 'Commands',
          params: ['commands']
        },
        {
          name: 'testNamespace',
          params: ['commands.namespace', 'testNamespace']
        },
        {
          name: 'testName',
          params: ['commands.detail', 'testNamespace', 'testName']
        }
      ]);
    });
  });
});
