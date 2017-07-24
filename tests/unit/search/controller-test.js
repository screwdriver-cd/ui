import { moduleFor, test } from 'ember-qunit';
import Ember from 'ember';

moduleFor('controller:search', 'Unit | Controller | search', {
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']
});

// Replace this with your real tests.
test('it exists', function (assert) {
  let controller = this.subject();

  assert.ok(controller);
});

test('it calls createCollection', function (assert) {
  let controller = this.subject();

  controller.set('store', {
    createRecord(modelName, data) {
      assert.equal(modelName, 'collection');
      assert.equal(data.name, 'Test');
      assert.equal(data.description, 'Test Collection');

      return {
        save: () => Ember.RSVP.resolve({
          id: 1,
          name: 'Test',
          description: 'Test Collection',
          pipelineIds: []
        })
      };
    }
  });

  controller.send('createCollection', 'Test', 'Test Collection');
});
