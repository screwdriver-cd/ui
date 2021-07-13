import timeRange, { iso8601UpToMinute, toCustomLocaleString } from 'screwdriver-ui/utils/time-range';
import { module, test } from 'qunit';

module('Unit | Utility | time range', function() {
  test('it returns a range of date times given duration', function(assert) {
    const d = new Date('2019-03-26T21:03:05.183Z');

    let { startTime, endTime } = timeRange(d, '1hr');

    assert.equal(startTime, '2019-03-26T20:03');
    assert.equal(endTime, '2019-03-26T21:03');

    ({ startTime, endTime } = timeRange(d, '12hr'));

    assert.equal(startTime, '2019-03-26T09:03');
    assert.equal(endTime, '2019-03-26T21:03');

    ({ startTime, endTime } = timeRange(d, '1d'));

    assert.equal(startTime, '2019-03-25T21:03');
    assert.equal(endTime, '2019-03-26T21:03');

    ({ startTime, endTime } = timeRange(d, '1wk'));

    assert.equal(startTime, '2019-03-19T21:03');
    assert.equal(endTime, '2019-03-26T21:03');

    ({ startTime, endTime } = timeRange(d, '1mo'));

    assert.equal(startTime, '2019-02-26T21:03');
    assert.equal(endTime, '2019-03-26T21:03');
  });

  test('it returns a 16-character ISO 8601 up to minute', function(assert) {
    assert.equal(iso8601UpToMinute(new Date('2019-03-26T21:03:05.183Z')), '2019-03-26T21:03');
  });

  test('it returns a locale date time string', function(assert) {
    assert.equal(
      toCustomLocaleString(new Date('2019-03-26T21:03:05.183Z'), {
        timeZone: 'UTC',
        options: {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }
      }),
      '03/26/2019, 09:03 PM'
    );
  });
});
