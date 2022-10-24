import { reject } from 'rsvp';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import sinon from 'sinon';

module('Unit | Controller | create', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const controller = this.owner.lookup('controller:create');

    assert.ok(controller);
  });

  test('it should handle duplicate error on pipeline save', function (assert) {
    const controller = this.owner.lookup('controller:create');
    const done = assert.async();
    const conflictError = { status: 409, data: { existingId: 1 } };
    const stub = sinon.stub(controller, 'transitionToRoute');

    stub.callsFake(function () {
      assert.ok(stub.calledOnce, 'transitionToRoute was called once');
      assert.ok(stub.calledWithExactly('pipeline', 1), 'invalid data');
      done();
    });

    const createRecordStub = sinon.stub(controller.store, 'createRecord');
    const payload = {
      checkoutUrl: 'dummy',
      rootDir: '',
      autoKeysGeneration: undefined
    };

    createRecordStub
      .withArgs('pipeline', payload)
      .returns({ save: () => reject({ errors: [conflictError] }) });

    controller.send('createPipeline', { scmUrl: 'dummy', rootDir: '' });

    assert.ok(createRecordStub.calledWithExactly('pipeline', payload));
  });
});
