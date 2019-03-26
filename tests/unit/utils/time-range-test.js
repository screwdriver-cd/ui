import timeRange from 'screwdriver-ui/utils/time-range';
import { module, test } from 'qunit';

module('Unit | Utility | time range');

test('it works', function (assert) {
  const d = new Date('2019-03-26T21:03:05.183Z');

  let { startTime, endTime } = timeRange(d, '1hr');

  assert.equal(startTime, '2019-03-26T20:03:05');
  assert.equal(endTime, '2019-03-26T21:03:05');

  ({ startTime, endTime } = timeRange(d, '12hr'));

  assert.equal(startTime, '2019-03-26T09:03:05');
  assert.equal(endTime, '2019-03-26T21:03:05');

  ({ startTime, endTime } = timeRange(d, '1d'));

  assert.equal(startTime, '2019-03-25T21:03:05');
  assert.equal(endTime, '2019-03-26T21:03:05');

  ({ startTime, endTime } = timeRange(d, '1wk'));

  assert.equal(startTime, '2019-03-19T21:03:05');
  assert.equal(endTime, '2019-03-26T21:03:05');

  ({ startTime, endTime } = timeRange(d, '1mo'));

  assert.equal(startTime, '2019-02-26T21:03:05');
  assert.equal(endTime, '2019-03-26T21:03:05');
});
