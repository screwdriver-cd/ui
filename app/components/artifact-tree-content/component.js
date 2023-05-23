import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
  router: service(),

  artifactPath: computed('node.directory', 'node.file.a_attr.href', {
    get() {
      // Recursively search the child for files and identify paths
      const getParentPath = node => {
        let childPath;

        if (node.children === undefined) {
          childPath = node.a_attr.href.substring(
            node.a_attr.href.split('artifacts/')[0].length + 10
          );
        } else {
          childPath = getParentPath(node.children[0]);
        }

        return childPath.substring(
          0,
          childPath.length -
            childPath.split('/')[childPath.split('/').length - 1].length -
            1
        );
      };

      if (this.node.directory === undefined) {
        return this.node.file.a_attr.href.substring(
          this.node.file.a_attr.href.split('artifacts/')[0].length + 10
        );
      }

      return `${getParentPath(this.node.directory[0])}/`;
    }
  }),

  nodeURL: computed('artifactPath', 'router.currentURL', {
    get() {
      const baseURL = this.router.currentURL.substring(
        0,
        this.router.currentURL.split('artifacts/')[0].length
      );

      return `${baseURL}artifacts/${this.artifactPath}`;
    }
  }),

  actions: {
    toggle() {
      this.node.actions.toggle();
      this.router.transitionTo(
        'pipeline.build.artifacts.detail',
        this.artifactPath
      );
    }
  }
});
