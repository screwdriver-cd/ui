import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { run } from '@ember/runloop';

module('Unit | Model | token', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    let model = run(() =>
      this.owner.lookup('service:store').createRecord('token')
    );
    // let store = this.store();

    assert.ok(!!model);
  });
});
