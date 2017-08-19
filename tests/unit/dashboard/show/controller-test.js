import { moduleFor, test } from 'ember-qunit';
import sinonTest from 'ember-sinon-qunit/test-support/test';
import Ember from 'ember';
import injectSessionStub from '../../../helpers/inject-session';

moduleFor('controller:dashboard/show', 'Unit | Controller | dashboard/show', {
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']
});

// Replace this with your real tests.
test('it exists', function (assert) {
  injectSessionStub(this);
  const controller = this.subject();

  assert.ok(controller);
});

test('it calls removePipeline', function (assert) {
  injectSessionStub(this);
  const controller = this.subject();
  let pipelineIds = [1, 2, 3];

  const collectionModelMock = {
    id: 1,
    name: 'collection1',
    description: 'description1',
    pipelineIds,
    get(field) {
      assert.strictEqual(field, 'pipelineIds');

      // The collections currently has pipelineIds 1, 2 and 3
      return pipelineIds;
    },
    set(field, value) {
      assert.strictEqual(field, 'pipelineIds');
      assert.deepEqual(value, [1, 2]);

      pipelineIds = value;
    },
    save() {
      assert.deepEqual(pipelineIds, [1, 2]);

      return Ember.RSVP.resolve({
        id: 1,
        name: 'collection1',
        description: 'description1',
        pipelineIds: [1, 2]
      });
    }
  };

  controller.set('store', {
    findRecord(modelName, collectionId) {
      assert.strictEqual(modelName, 'collection');
      assert.strictEqual(collectionId, 1);

      return Ember.RSVP.resolve(collectionModelMock);
    }
  });

  // Remove pipeline with id 3 from collection with id 1
  controller.send('removePipeline', 3, 1);
});

sinonTest('it calls onDeleteCollection', function (assert) {
  const controller = this.subject();
  const stub = this.stub(controller, 'transitionToRoute');

  controller.send('onDeleteCollection');

  assert.ok(stub.calledOnce, 'transitionToRoute was called once');
  assert.ok(stub.calledWithExactly('/'), 'transition to home');
});
