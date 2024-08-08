import { module, test } from 'qunit';
import { getFilteredGraph } from 'screwdriver-ui/v2/pipeline/events/show/util';

module('Unit | Utility | v2/pipeline/events/show', function () {
  test('getFilteredGraph removes nodes that trigger external pipelines', function (assert) {
    assert.deepEqual(
      getFilteredGraph({
        nodes: [{ name: 'sd@123' }, { name: 'main' }, { name: 'build' }],
        edges: [
          { src: 'main', dest: 'build' },
          { src: 'build', dest: 'sd@123' }
        ]
      }),
      {
        nodes: [{ name: 'main' }, { name: 'build' }],
        edges: [{ src: 'main', dest: 'build' }]
      }
    );
  });
});
