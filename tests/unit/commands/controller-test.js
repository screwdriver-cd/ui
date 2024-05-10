import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import { run } from '@ember/runloop';

module('Unit | Controller | Commands', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const controller = this.owner.lookup('controller:commands');

    assert.ok(controller);
  });

  test('it creates correct breadcrumbs', function (assert) {
    const controller = this.owner.lookup('controller:commands');
    /* eslint-disable */

    run(() => {
      controller.set('model', {
        paramsFor: arg => {
          if (arg === 'commands.namespace') {
            return { namespace: 'testNamespace' };
          }
          if (arg === 'commands.detail') {
            return { name: 'testName' };
          }
        }
      });
      /* eslint-enable */
      assert.deepEqual(controller.crumbs, [
        {
          name: 'Commands',
          route: 'commands',
          params: ['commands']
        },
        {
          name: 'testNamespace',
          route: 'commands.namespace',
          params: ['testNamespace']
        },
        {
          name: 'testName',
          route: 'commands.detail',
          params: ['testNamespace', 'testName']
        }
      ]);
    });
  });
});
