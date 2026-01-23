import { module, test } from 'qunit';
import {
  getDuration,
  getDurationText,
  getExternalPipelineId,
  getFirstCreateTime,
  getFailureCount,
  getRunningDurationText,
  getStartDate,
  getSuccessCount,
  getTruncatedMessage,
  getTruncatedSha,
  getWarningCount,
  isCommitterDifferent,
  isExternalTrigger
} from 'screwdriver-ui/components/pipeline/event/card/util';

module('Unit | Component | pipeline/event/card/util', function () {
  test('getTruncatedSha returns correct value', function (assert) {
    assert.equal(getTruncatedSha({ sha: 'deadbeef12345' }), 'deadbee');
  });

  test('getTruncatedMessage returns correct value', function (assert) {
    assert.equal(
      getTruncatedMessage({ commit: { message: 'Super duper string' } }, 5),
      'Super...'
    );
    assert.equal(
      getTruncatedMessage({ commit: { message: 'Super duper string' } }, 50),
      'Super duper string'
    );
  });

  test('getStartDate returns start date in requested format', function (assert) {
    const startDate = getStartDate(
      {
        createTime: '2021-04-01T16:34:53.230Z'
      },
      {
        timestampFormat: 'UTC'
      }
    );

    assert.equal(startDate, '04/01/2021, 04:34 PM UTC');
  });

  test('getFirstCreateTime returns start date', function (assert) {
    assert.equal(getFirstCreateTime(null), null);
    assert.equal(getFirstCreateTime([]), null);

    const expectedDateString = '2024-03-05T18:16:07.760Z';
    const builds = [
      {
        createTime: '2024-03-05T18:30:07.760Z',
        endTime: '2024-03-05T18:31:07.760Z'
      },
      {
        createTime: '2024-03-05T18:25:07.760Z',
        endTime: '2024-03-05T18:26:07.760Z'
      },
      {
        createTime: expectedDateString,
        endTime: '2024-03-05T18:17:07.760Z'
      }
    ];

    assert.deepEqual(getFirstCreateTime(builds), new Date(expectedDateString));
  });

  test('getDuration returns correct duration', function (assert) {
    const virtualJobIds = new Set();

    assert.equal(getDuration(null, virtualJobIds), 0);
    assert.equal(getDuration([], virtualJobIds), 0);

    const builds = [
      {
        createTime: '2024-03-05T18:30:07.760Z',
        endTime: '2024-03-05T18:31:07.760Z'
      },
      {
        createTime: '2024-03-05T18:25:07.760Z',
        endTime: '2024-03-05T18:26:07.760Z'
      },
      {
        createTime: '2024-03-05T18:16:07.760Z',
        endTime: '2024-03-05T18:17:07.760Z'
      }
    ];

    assert.equal(getDuration(builds, virtualJobIds), 15 * 60 * 1000);

    const virtualJobId = 123;

    assert.equal(
      getDuration(
        [
          ...builds,
          { jobId: virtualJobId, createTime: '2024-03-05T18:32:07.760Z' }
        ],
        new Set([virtualJobId])
      ),
      16 * 60 * 1000
    );
  });

  test('getDurationText returns correct text format', function (assert) {
    const virtualJobIds = new Set();

    assert.equal(getDurationText(null, virtualJobIds), '0s');
    assert.equal(getDurationText([], virtualJobIds), '0s');
    assert.equal(
      getDurationText(
        [
          {
            createTime: '2024-03-05T18:30:07.760Z',
            endTime: '2024-03-05T18:31:17.760Z'
          },
          {
            createTime: '2024-03-05T18:25:07.760Z',
            endTime: '2024-03-05T18:26:07.760Z'
          },
          {
            createTime: '2024-03-05T18:16:07.760Z',
            endTime: '2024-03-05T18:17:07.760Z'
          }
        ],
        virtualJobIds
      ),
      '15m 10s'
    );
  });

  test('getRunningDurationText returns correct text format', function (assert) {
    const now = Date.now();
    const start = new Date(now - 1000 * 60 * 5 - 30 * 1000);

    assert.equal(getRunningDurationText(start, now), '5m 30s');
  });

  test('isExternalTrigger calculates value correctly', function (assert) {
    assert.equal(
      isExternalTrigger({ id: 123, pipelineId: 999, startFrom: '~commit' }),
      false
    );

    assert.equal(
      isExternalTrigger({
        id: 123,
        pipelineId: 999,
        startFrom: '~sd@999:abcd'
      }),
      false
    );

    assert.equal(
      isExternalTrigger({
        id: 123,
        pipelineId: 999,
        startFrom: '~sd@987:abcd'
      }),
      true
    );
  });

  test('isCommiterDifferent returns correct values', function (assert) {
    assert.equal(
      isCommitterDifferent({
        id: 123,
        pipelineId: 999,
        startFrom: '~sd@987:abcd',
        creator: { name: 'foo' },
        commit: { author: { name: 'foo' } }
      }),
      true
    );

    assert.equal(
      isCommitterDifferent({
        id: 123,
        startFrom: '~commit',
        creator: { name: 'foo' },
        commit: { author: { name: 'bar' } }
      }),
      true
    );

    assert.equal(
      isCommitterDifferent({
        id: 123,
        startFrom: '~commit',
        creator: { name: 'foo' },
        commit: { author: { name: 'foo' } }
      }),
      false
    );
  });

  test('getExternalPipelineId returns correct value', function (assert) {
    assert.equal(getExternalPipelineId({ startFrom: '~sd@987:abcd' }), '987');
    assert.equal(getExternalPipelineId({ startFrom: '~commit' }), null);
  });

  test('getFailureCount returns correct value', function (assert) {
    assert.equal(getFailureCount([]), 0);
    assert.equal(
      getFailureCount([
        { status: 'SUCCESS' },
        { status: 'FAILURE' },
        { status: 'ABORTED' }
      ]),
      2
    );
  });

  test('getWarningCount returns correct value', function (assert) {
    assert.equal(getWarningCount([]), 0);
    assert.equal(
      getWarningCount([
        { status: 'SUCCESS' },
        { status: 'UNSTABLE' },
        { status: 'ABORTED' },
        { status: 'WARNING' }
      ]),
      2
    );
  });

  test('getSuccessCount returns correct value', function (assert) {
    assert.equal(getSuccessCount([]), 0);
    assert.equal(
      getWarningCount([
        { status: 'SUCCESS' },
        { status: 'UNSTABLE' },
        { status: 'ABORTED' }
      ]),
      1
    );
  });
});
