import { moduleFor, test } from 'ember-qunit';
import Ember from 'ember';

moduleFor('controller:search', 'Unit | Controller | search', {
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']
});

test('it exists', function (assert) {
  const controller = this.subject();

  assert.ok(controller);
});

test('it calls addToCollection', function (assert) {
  const controller = this.subject();
  let pipelineIds = [1, 2];

  const collectionModelMock = {
    id: 1,
    name: 'collection1',
    description: 'description1',
    pipelineIds,
    get(field) {
      assert.strictEqual(field, 'pipelineIds');

      // The collection currently has pipelineIds 1 and 2
      return pipelineIds;
    },
    set(field, value) {
      assert.strictEqual(field, 'pipelineIds');
      assert.deepEqual(value, [1, 2, 3]);

      pipelineIds = value;
    },
    save() {
      assert.deepEqual(pipelineIds, [1, 2, 3]);

      return Ember.RSVP.resolve({
        id: 1,
        name: 'collection1',
        description: 'description1',
        pipelineIds: [1, 2, 3]
      });
    }
  };

  controller.set('store', {
    findRecord(modelName, pipelineId) {
      assert.strictEqual(modelName, 'collection');
      assert.strictEqual(pipelineId, 1);

      return Ember.RSVP.resolve(collectionModelMock);
    }
  });

  // Add pipeline with id 3 to collection with id 1
  controller.send('addToCollection', 3, 1);
});
