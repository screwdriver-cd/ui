import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';

import { run } from '@ember/runloop';

module('Unit | Model | job', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const model = run(() =>
      this.owner.lookup('service:store').createRecord('job')
    );

    assert.ok(!!model);
  });

  test('it returns pr parent job name', function (assert) {
    const model = run(() =>
      this.owner.lookup('service:store').createRecord('job', {
        name: 'PR-123:deploy'
      })
    );

    run(() => {
      // job is a PR job
      assert.equal(model.get('prParentJobName'), 'deploy');
      // job is not a PR job
      model.set('name', 'publish');
      assert.equal(model.get('prParentJobName'), null);
    });
  });
});
