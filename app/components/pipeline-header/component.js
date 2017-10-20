import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';

export default Component.extend({
  scmService: service('scm'),
  classNames: ['row'],
  scmContext: computed({
    get() {
      const pipeline = this.get('pipeline');
      const scm = this.get('scmService').getScm(pipeline.get('scmContext'));

      return {
        scm: scm.displayName,
        scmIcon: scm.iconType
      };
    }
  })
});
