import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import EmberObject from '@ember/object';

module('Unit | Controller | pipeline', function (hooks) {
  setupTest(hooks);

  test('Collection expects 1 pipelineIds', function (assert) {
    assert.expect(1);
    const controller = this.owner.lookup('controller:pipeline');

    const pipelineId = 1;

    const collection = EmberObject.create({
      pipelineIds: [],
      save() {
        assert.equal(
          this.pipelineIds.length,
          1,
          'Collection now has 1 pipelineId'
        );
      }
    });

    controller.send('addToCollection', pipelineId, collection);
  });

  test('Collection expects 1 uniq pipelineId', function (assert) {
    assert.expect(1);
    const controller = this.owner.lookup('controller:pipeline');

    const pipelineId = 1;

    const collection = EmberObject.create({
      pipelineIds: [1],
      save() {
        assert.equal(
          this.pipelineIds.length,
          1,
          'Collection now has 1 uniq pipelineId'
        );
      }
    });

    controller.send('addToCollection', pipelineId, collection);
  });

  test('Collection expects 2 pipelineIds', function (assert) {
    assert.expect(1);
    const controller = this.owner.lookup('controller:pipeline');

    const pipelineId = 2;

    const collection = EmberObject.create({
      pipelineIds: [1],
      save() {
        assert.equal(
          this.pipelineIds.length,
          2,
          'Collection now has 2 pipelineId'
        );
      }
    });

    controller.send('addToCollection', pipelineId, collection);
  });
});
