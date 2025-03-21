import Model, { attr } from '@ember-data/model';
import { computed } from '@ember/object';
import { toCustomLocaleString } from 'screwdriver-ui/utils/time-range';

/**
 * Calulate ms difference between two times
 * @method calcDuration
 * @param  {String}         start key for start time
 * @param  {String}         end   key for end time
 * @return {Number}               ms difference
 */
function calcDuration(start, end) {
  let endTime = new Date();

  let startTime = this.get(start);

  if (end !== 'now') {
    endTime = this.get(end);
  }

  if (typeof endTime === 'string') {
    endTime = new Date(endTime);
  }

  if (typeof startTime === 'string') {
    startTime = new Date(startTime);
  }

  if (!startTime || !endTime) {
    return 0;
  }

  return endTime.getTime() - startTime.getTime();
}

/**
 * Gets human readable text for a duration
 * @method durationText
 * @param  {String}         start key for start time
 * @param  {String}         end   key for end time
 * @return {String}               human readable text for duration
 */
function durationText(start, end, largest = 1) {
  return humanizeDuration(calcDuration.call(this, start, end), {
    round: true,
    largest
  });
}

export default Model.extend({
  // ember-data has some reservations with the "container" attribute name
  buildContainer: attr('string'),
  cause: attr('string'),
  commit: attr(),
  createTime: attr('date'),
  endTime: attr('date'),
  eventId: attr('string'),
  jobId: attr('string'),
  meta: attr(),
  number: attr('number'),
  parameters: attr(),
  parentBuildId: attr('string'),
  sha: attr('string'),
  startTime: attr('date'),
  status: attr('string'),
  stats: attr(),
  statusMessage: attr('string', { defaultValue: null }),
  statusMessageType: attr('string', { defaultValue: null }),
  steps: attr(),
  templateId: attr('number'),
  startTimeWords: computed('startTime', {
    get() {
      return `${durationText.call(this, 'startTime', 'now')} ago`;
    }
  }),
  startTimeExact: computed('startTime', {
    get() {
      if (this.startTime) {
        const dateTime = this.startTime.getTime();

        return `${toCustomLocaleString(new Date(dateTime))}`;
      }

      return `${toCustomLocaleString(new Date())}`;
    }
  }),
  createTimeWords: computed('createTime', {
    get() {
      const dt = durationText.call(this, 'createTime', 'now');

      return `${dt} ago`;
    }
  }),
  createTimeExact: computed('createTime', {
    get() {
      if (this.createTime) {
        const dateTime = this.createTime.getTime();

        return `${toCustomLocaleString(new Date(dateTime))}`;
      }

      return `${toCustomLocaleString(new Date())}`;
    }
  }),
  endTimeWords: computed('endTime', {
    get() {
      if (!this.endTime) {
        return null;
      }

      return `${durationText.call(this, 'endTime', 'now')} ago`;
    }
  }),
  endTimeExact: computed('endTime', {
    get() {
      if (this.endTime) {
        const dateTime = this.endTime.getTime();

        return `${toCustomLocaleString(new Date(dateTime))}`;
      }

      return null;
    }
  }),
  // Queue time and blocked time are merged into blockedDuration
  blockedDuration: computed('createTime', 'stats.imagePullStartTime', {
    get() {
      return durationText.call(
        this,
        'createTime',
        'stats.imagePullStartTime',
        2
      );
    }
  }),
  // Time it takes to pull the image
  imagePullDuration: computed('stats.imagePullStartTime', 'startTime', {
    get() {
      return durationText.call(
        this,
        'stats.imagePullStartTime',
        'startTime',
        2
      );
    }
  }),
  buildDuration: computed('startTime', 'endTime', {
    get() {
      return durationText.call(this, 'startTime', 'endTime', 2);
    }
  }),
  totalDuration: computed('createTime', 'endTime', {
    get() {
      return durationText.call(this, 'createTime', 'endTime', 2);
    }
  }),
  totalDurationMS: computed('createTime', 'endTime', {
    get() {
      return calcDuration.call(this, 'createTime', 'endTime');
    }
  }),
  truncatedSha: computed('sha', {
    get() {
      return this.sha.substr(0, 7);
    }
  })
});
