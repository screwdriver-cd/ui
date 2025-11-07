import { visit } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'screwdriver-ui/tests/helpers';

import { PIPELINE_ID } from '../mock/pipeline';
import { mockMetrics } from '../mock/metrics';

module('Acceptance | metrics', function (hooks) {
  const mockApi = setupApplicationTest(hooks);

  test('visiting /pipelines/:id/metrics', async function (assert) {
    const url = `/pipelines/${PIPELINE_ID}/metrics`;

    mockApi.get(`${url}`, () => [200, mockMetrics]);

    await visit(`${url}`);

    assert.dom('.chart-c3').exists({ count: 3 });
    assert.dom('.range-selection button').exists({ count: 7 });
    assert.dom('.custom-date-selection input').exists({ count: 1 });
    assert.dom('.filters-selection input').exists({ count: 1 });
    assert.dom('.chart-pipeline-info .measure').exists({ count: 5 });
    assert.dom('.chart-c3 svg').exists({ count: 6 });
    assert.dom('.chart-c3 .c3-event-rects').exists({ count: 3 });
    assert.dom('.chart-cta').exists({ count: 1 });
    assert.dom('.chart-cta select').exists({ count: 1 });
  });
});
