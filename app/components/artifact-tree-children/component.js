import { computed } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
  nextDir: computed('selectedArtifactRelative', {
    get() {
      const dividePath = this.selectedArtifactRelative.split('/');

      if (dividePath.length <= 1) {
        return '';
      }

      return decodeURIComponent(dividePath[0]);
    }
  }),
  selectedArtifactRelativeChild: computed('selectedArtifactRelative', {
    get() {
      const dividePath = this.selectedArtifactRelative.split('/');

      if (dividePath.length <= 1) {
        return '';
      }

      return this.selectedArtifactRelative.substring(dividePath[0].length + 1);
    }
  })
});
