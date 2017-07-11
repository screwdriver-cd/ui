import Ember from 'ember';
import { moduleFor } from 'ember-qunit';
import test from 'ember-sinon-qunit/test-support/test';

moduleFor('controller:create', 'Unit | Controller | create', {
  // Specify the other units that are required for this test.
  // needs: [],
});

test('it exists', function (assert) {
  let controller = this.subject();

  assert.ok(controller);
});

test('it should handle duplicate error on pipeline save', function (assert) {
  const controller = this.subject();
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
        save: () => Ember.RSVP.reject({ errors: [conflictError] })
      };
    }
  });

  controller.send('createPipeline', 'dummy');
});
