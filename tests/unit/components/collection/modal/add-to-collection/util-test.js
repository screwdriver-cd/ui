import { module, test } from 'qunit';
import {
  createCollectionBody,
  getCollectionsWithoutPipeline
} from 'screwdriver-ui/components/pipeline/modal/add-to-collection/util';

module(
  'Unit | Component | collection/modal/add-to-collection/util',
  function () {
    test('getCollectionsWithoutPipeline returns sorted list of collections', function (assert) {
      assert.deepEqual(
        getCollectionsWithoutPipeline(
          [
            { id: 1, name: 'collection', pipelineIds: [] },
            { id: 2, name: 'abc', pipelineIds: [456] },
            { id: 3, name: 'something', pipelineIds: [456, 987] },
            { id: 4, name: 'xyz', pipelineIds: [456, 123, 987] },
            { id: 5, name: 'zzz', pipelineIds: [456, 987] }
          ],
          123
        ),
        [
          { id: 2, name: 'abc', pipelineIds: [456] },
          { id: 1, name: 'collection', pipelineIds: [] },
          { id: 3, name: 'something', pipelineIds: [456, 987] },
          { id: 5, name: 'zzz', pipelineIds: [456, 987] }
        ]
      );
    });

    test('createCollectionBody creates request body', function (assert) {
      assert.deepEqual(createCollectionBody('Test Collection', '', 123), {
        name: 'Test Collection',
        description: '',
        pipelineIds: [123],
        type: 'normal'
      });
    });
  }
);
