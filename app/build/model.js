import DS from 'ember-data';
import Ember from 'ember';

/**
 * Calulate ms difference between two times
 * @method calcDuration
 * @param  {String}         start key for start time
 * @param  {String}         end   key for end time
 * @return {Number}               ms difference
 */
function calcDuration(start, end) {
  let endTime = new Date();
  let startTime;

  if (end !== 'now') {
    endTime = this.get(end);
  }

  startTime = this.get(start);

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
function durationText(start, end) {
  return humanizeDuration(calcDuration.call(this, start, end), { round: true, largest: 1 });
}

export default DS.Model.extend({
  eventId: DS.attr('string'),
  jobId: DS.attr('string'),
  parentBuildId: DS.attr('string'),
  number: DS.attr('number'),
  // ember-data has some reservations with the "container" attribute name
  buildContainer: DS.attr('string'),
  cause: DS.attr('string'),
  sha: DS.attr('string'),
  createTime: DS.attr('date'),
  startTime: DS.attr('date'),
  endTime: DS.attr('date'),
  queuedDuration: Ember.computed('createTime', 'startTime', {
    get() {
      return durationText.call(this, 'createTime', 'startTime');
    }
  }),
  buildDuration: Ember.computed('startTime', 'endTime', {
    get() {
      return durationText.call(this, 'startTime', 'endTime');
    }
  }),
  createTimeWords: Ember.computed('createTime', {
    get() {
      const dt = durationText.call(this, 'createTime', 'now');

      return `${dt} ago`;
    }
  }),
  totalDurationMS: Ember.computed('createTime', 'endTime', {
    get() {
      return calcDuration.call(this, 'createTime', 'endTime');
    }
  }),
  parameters: DS.attr(),
  meta: DS.attr(),
  steps: DS.attr(),
  status: DS.attr('string'),
  commit: DS.attr()
});
