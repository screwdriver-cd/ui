import EmberObject, { computed } from '@ember/object';
import { equal, match } from '@ember/object/computed';
import ModelReloaderMixin from 'screwdriver-ui/mixins/model-reloader';
import DS from 'ember-data';
import ENV from 'screwdriver-ui/config/environment';
import { isActiveBuild } from 'screwdriver-ui/utils/build';

export default DS.Model.extend(ModelReloaderMixin, {
  pipelineId: DS.attr('string'),
  name: DS.attr('string'),
  isPR: match('name', /^PR-/),
  state: DS.attr('string'),
  stateChanger: DS.attr('string'),
  stateChangeTime: DS.attr('date'),
  stateChangeTimeWords: computed('stateChangeTime', {
    get() {
      const duration = Date.now() - +this.get('stateChangeTime');

      return `${humanizeDuration(duration, { round: true, largest: 1 })} ago`;
    }
  }),
  stateChangeMessage: DS.attr('string'),
  // !for pr job only {
  title: DS.attr('string'),
  username: DS.attr('string'),
  userProfile: DS.attr('string'),
  url: DS.attr('string'),
  createTime: DS.attr('date'),
  createTimeWords: computed('createTime', {
    get() {
      const duration = Date.now() - +this.get('createTime');

      return `${humanizeDuration(duration, { round: true, largest: 1 })} ago`;
    }
  }),
  // } for pr job only
  permutations: DS.attr(),
  builds: DS.hasMany('build', { async: true }),
  isDisabled: equal('state', 'DISABLED'),
  lastBuild: computed('builds', {
    get() {
      const builds = this.get('builds');

      if (builds.length === 0) {
        return EmberObject.create();
      }

      return builds.objectAt(0);
    }
  }),
  modelToReload: 'builds',
  reloadTimeout: ENV.APP.EVENT_RELOAD_TIMER,
  // Reload builds only if the pr job build is still running
  shouldReload() {
    return this.get('isPR') &&
      this.get('builds').any(b => isActiveBuild(b.get('status'), b.get('endTime')));
  },
  init() {
    this._super(...arguments);
    this.startReloading();
  }
});
