import Model, { attr, hasMany } from '@ember-data/model';
import { computed, get } from '@ember/object';
import { alias, equal, match } from '@ember/object/computed';
import ENV from 'screwdriver-ui/config/environment';
import { toCustomLocaleString } from 'screwdriver-ui/utils/time-range';
import { isActiveBuild } from 'screwdriver-ui/utils/build';
import { SHOULD_RELOAD_NO, SHOULD_RELOAD_YES } from '../mixins/model-reloader';

export default Model.extend({
  pipelineId: attr('string'),
  name: attr('string'),
  isPR: match('name', /^PR-/),
  state: attr('string'),
  stateChanger: attr('string'),
  stateChangeTime: attr('date'),
  stateChangeTimeWords: computed('stateChangeTime', {
    get() {
      const duration = Date.now() - +this.stateChangeTime;

      return `${humanizeDuration(duration, { round: true, largest: 1 })} ago`;
    }
  }),
  stateChangeMessage: attr('string'),
  // !for pr job only {
  title: attr('string'),
  group: computed('isPR', 'name', {
    get() {
      if (this._group) {
        return this.group;
      }

      return this.isPR ? parseInt(this.name.slice('PR-'.length), 10) : null;
    },
    set(_, value) {
      return this._group = value;
    }
  }),
  prNumber: alias('group'),
  username: attr('string'),
  userProfile: attr('string'),
  url: attr('string'),
  createTime: attr('date'),
  createTimeWords: computed('createTime', {
    get() {
      const duration = Date.now() - +this.createTime;

      return `${humanizeDuration(duration, { round: true, largest: 1 })} ago`;
    }
  }),
  createTimeExact: computed('createTime', {
    get() {
      if (this.createTime) {
        const dateTime = this.createTime.getTime();

        return `${toCustomLocaleString(new Date(dateTime))}`;
      }

      return '';
    }
  }),
  prParentJobId: attr('string'),
  // } for pr job only
  permutations: attr(),
  annotations: computed('permutations.0.annotations', 'permutations.[]', {
    get() {
      return get(this, 'permutations.0.annotations') || {};
    }
  }),
  parameters: computed('permutations.[]', {
    get() {
      // TODO: Revisit while supporting matrix job
      return this.permutations[0].parameters;
    }
  }),
  builds: hasMany('build', { async: true }),
  isDisabled: computed({
    get() {
      if (this._isDisabled !== undefined) {
        return this._isDisabled;
      }

      return this.state === 'DISABLED';
    },
    set(_, value) {
      return this._isDisabled = value;
    }
  }),
  modelToReload: 'builds',
  reloadTimeout: ENV.APP.EVENT_RELOAD_TIMER,
  // Reload builds only if the pr job build is still running
  shouldReload() {
    return this.isPR &&
      this.builds.any(b => isActiveBuild(b.get('status'), b.get('endTime')))
      ? SHOULD_RELOAD_YES
      : SHOULD_RELOAD_NO;
  }
});
