import { resolve } from 'rsvp';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import EmberObject from '@ember/object';
import sinon from 'sinon';
import injectSessionStub from '../../../helpers/inject-session';

module('Unit | Controller | dashboard/show', function (hooks) {
  setupTest(hooks);

  // Replace this with your real tests.
  test('it exists', function (assert) {
    injectSessionStub(this);
    const controller = this.owner.lookup('controller:dashboard/show');

    assert.ok(controller);
  });

  test('it calls removePipeline', function (assert) {
    injectSessionStub(this);
    const controller = this.owner.lookup('controller:dashboard/show');

    const pipelineIds = [1, 2, 3];

    const mock = EmberObject.create({
      id: 2,
      name: 'collection1',
      description: 'description1',
      pipelineIds,
      save() {
        assert.deepEqual(this.pipelineIds, [1, 2]);

        return resolve(this);
      }
    });

    controller.set('model', {
      collection: {
        id: 2
      }
    });

    controller.store.findRecord = (modelName, collectionId) => {
      assert.strictEqual(modelName, 'collection');
      assert.strictEqual(collectionId, 2);

      return resolve(mock);
    };

    // Remove pipeline with id 3 from collection with id 1
    controller.send('removePipeline', 3);
  });

  test('it calls onDeleteCollection', function (assert) {
    const controller = this.owner.lookup('controller:dashboard/show');
    const stub = sinon.stub(controller, 'transitionToRoute');

    controller.send('onDeleteCollection');

    assert.ok(stub.calledOnce, 'transitionToRoute was called once');
    assert.ok(stub.calledWithExactly('home'), 'transition to home');
  });
});
