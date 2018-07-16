import { moduleFor } from 'ember-qunit';
import { run } from '@ember/runloop';
import test from 'ember-sinon-qunit/test-support/test';

moduleFor('controller:commands', 'Unit | Controller | Commands', {
  // Specify the other units that are required for this test.
  // needs: [],
});

test('it exists', function (assert) {
  let controller = this.subject();

  assert.ok(controller);
});

test('it creates correct breadcrumbs', function (assert) {
  const controller = this.subject();

  run(() => {
    controller.set('routeParams', {
      namespace: 'testNamespace',
      name: 'testName'
    });

    assert.deepEqual(controller.get('crumbs'), [{
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
    }]);
  });
});
