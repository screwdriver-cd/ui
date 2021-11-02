import classic from 'ember-classic-decorator';
import { computed } from '@ember/object';
import Model, { attr } from '@ember-data/model';
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

@classic
export default class _Model extends Model {
  // ember-data has some reservations with the "container" attribute name
  @attr('string')
  buildContainer;

  @attr('string')
  cause;

  @attr()
  commit;

  @attr('date')
  createTime;

  @attr('date')
  endTime;

  @attr('string')
  eventId;

  @attr('string')
  jobId;

  @attr()
  meta;

  @attr('number')
  number;

  @attr()
  parameters;

  @attr('string')
  parentBuildId;

  @attr('string')
  sha;

  @attr('date')
  startTime;

  @attr('string')
  status;

  @attr()
  stats;

  @attr('string', { defaultValue: null })
  statusMessage;

  @attr()
  steps;

  @computed('startTime')
  get startTimeWords() {
    return `${durationText.call(this, 'startTime', 'now')} ago`;
  }

  @computed('startTime')
  get startTimeExact() {
    if (this.startTime) {
      let dateTime = this.startTime.getTime();

      return `${toCustomLocaleString(new Date(dateTime))}`;
    }

    return `${toCustomLocaleString(new Date())}`;
  }

  @computed('createTime')
  get createTimeWords() {
    const dt = durationText.call(this, 'createTime', 'now');

    return `${dt} ago`;
  }

  @computed('createTime')
  get createTimeExact() {
    if (this.createTime) {
      let dateTime = this.createTime.getTime();

      return `${toCustomLocaleString(new Date(dateTime))}`;
    }

    return `${toCustomLocaleString(new Date())}`;
  }

  @computed('endTime')
  get endTimeWords() {
    if (!this.endTime) {
      return null;
    }

    return `${durationText.call(this, 'endTime', 'now')} ago`;
  }

  @computed('endTime')
  get endTimeExact() {
    if (this.endTime) {
      let dateTime = this.endTime.getTime();

      return `${toCustomLocaleString(new Date(dateTime))}`;
    }

    return null;
  }

  // Queue time and blocked time are merged into blockedDuration
  @computed('createTime', 'stats.imagePullStartTime')
  get blockedDuration() {
    return durationText.call(this, 'createTime', 'stats.imagePullStartTime', 2);
  }

  // Time it takes to pull the image
  @computed('stats.imagePullStartTime', 'startTime')
  get imagePullDuration() {
    return durationText.call(this, 'stats.imagePullStartTime', 'startTime', 2);
  }

  @computed('startTime', 'endTime')
  get buildDuration() {
    return durationText.call(this, 'startTime', 'endTime', 2);
  }

  @computed('createTime', 'endTime')
  get totalDuration() {
    return durationText.call(this, 'createTime', 'endTime', 2);
  }

  @computed('createTime', 'endTime')
  get totalDurationMS() {
    return calcDuration.call(this, 'createTime', 'endTime');
  }

  @computed('sha')
  get truncatedSha() {
    return this.sha.substr(0, 7);
  }
}
