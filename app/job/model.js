import classic from 'ember-classic-decorator';
import { match, equal, alias } from '@ember/object/computed';
import Model, { attr, hasMany } from '@ember-data/model';
import { get, computed } from '@ember/object';
import ENV from 'screwdriver-ui/config/environment';
import { toCustomLocaleString } from 'screwdriver-ui/utils/time-range';
import { isActiveBuild } from 'screwdriver-ui/utils/build';
import { SHOULD_RELOAD_NO, SHOULD_RELOAD_YES } from '../mixins/model-reloader';

@classic
export default class _Model extends Model {
  @attr('string')
  pipelineId;

  @attr('string')
  name;

  @match('name', /^PR-/)
  isPR;

  @attr('string')
  state;

  @attr('string')
  stateChanger;

  @attr('date')
  stateChangeTime;

  @computed('stateChangeTime')
  get stateChangeTimeWords() {
    const duration = Date.now() - +this.stateChangeTime;

    return `${humanizeDuration(duration, { round: true, largest: 1 })} ago`;
  }

  @attr('string')
  stateChangeMessage;

  // !for pr job only {
  @attr('string')
  title;

  @computed('isPR', 'name')
  get group() {
    return this.isPR ? parseInt(this.name.slice('PR-'.length), 10) : null;
  }

  @alias('group')
  prNumber;

  @attr('string')
  username;

  @attr('string')
  userProfile;

  @attr('string')
  url;

  @attr('date')
  createTime;

  @computed('createTime')
  get createTimeWords() {
    const duration = Date.now() - +this.createTime;

    return `${humanizeDuration(duration, { round: true, largest: 1 })} ago`;
  }

  @computed('createTime')
  get createTimeExact() {
    if (this.createTime) {
      let dateTime = this.createTime.getTime();

      return `${toCustomLocaleString(new Date(dateTime))}`;
    }

    return '';
  }

  @attr('string')
  prParentJobId;

  // } for pr job only
  @attr()
  permutations;

  @computed('permutations.[]', 'permutations[0].annotations')
  get annotations() {
    return get(this, 'permutations[0].annotations') || {};
  }

  @computed('permutations.[]')
  get parameters() {
    // TODO: Revisit while supporting matrix job
    return this.permutations[0].parameters;
  }

  @hasMany('build', { async: true })
  builds;

  @equal('state', 'DISABLED')
  isDisabled;

  modelToReload = 'builds';

  reloadTimeout = ENV.APP.EVENT_RELOAD_TIMER;

  // Reload builds only if the pr job build is still running
  shouldReload() {
    return this.isPR &&
      this.builds.any(b => isActiveBuild(b.get('status'), b.get('endTime')))
      ? SHOULD_RELOAD_YES
      : SHOULD_RELOAD_NO;
  }
}
