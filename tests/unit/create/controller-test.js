import { reject } from 'rsvp';
import { module } from 'qunit';
import { setupTest } from 'ember-qunit';
import test from 'ember-sinon-qunit/test-support/test';

module('Unit | Controller | create', function(hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    let controller = this.owner.lookup('controller:create');

    assert.ok(controller);
  });

  test('it should handle duplicate error on pipeline save', function (assert) {
    const controller = this.owner.lookup('controller:create');
    const done = assert.async();
    const conflictError = { status: 409, data: { existingId: 1 } };
    const stub = this.stub(controller, 'transitionToRoute');

    stub.callsFake(function () {
      assert.ok(stub.calledOnce, 'transitionToRoute was called once');
      assert.ok(stub.calledWithExactly('pipeline', 1), 'invalid data');
      done();
    });

    controller.set('store', {
      createRecord(modelName, data) {
        assert.equal(modelName, 'pipeline');
        assert.equal(data.checkoutUrl, 'dummy');

        return {
          save: () => reject({ errors: [conflictError] })
        };
      }
    });

    controller.send('createPipeline', 'dummy');
  });
});
