import { inject as service } from '@ember/service';
import Component from '@ember/component';

export default Component.extend({
  router: service(),
  actions: {
    toggle(node) {
      node.actions.toggle();

      this.router.transitionTo(
        'pipeline.build.artifacts.detail',
        this.parentAbsolutePath.concat(this.fileName).concat('/')
      );
    }
  }
});
