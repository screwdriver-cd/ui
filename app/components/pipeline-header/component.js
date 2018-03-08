import { get, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';

export default Component.extend({
  scmService: service('scm'),
  classNames: ['row'],
  classNameBindings: ['isBuildPage'],
  router: service(),
  isBuildPage: computed('router.currentRouteName', {
    get() {
      return get(this, 'router.currentRouteName') === 'pipeline.build';
    }
  }),
  scmContext: computed({
    get() {
      const pipeline = get(this, 'pipeline');
      const scm = get(this, 'scmService').getScm(pipeline.get('scmContext'));

      return {
        scm: scm.displayName,
        scmIcon: scm.iconType
      };
    }
  })
});
