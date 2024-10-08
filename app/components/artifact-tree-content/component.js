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

  isHovered: false,

  actions: {
    setHoverState(state) {
      this.set('isHovered', state);
    },

    toggle() {
      this.node.actions.toggle();
      this.router.transitionTo(
        'pipeline.build.artifacts.detail',
        this.artifactPath
      );
    },

    // todo: the downloadLink should not depend on the iframeUrl alone
    // this works for now because downloadLink to download all artifacts is very predictable
    // $url/v4/builds/$id/artifacts
    // but this will not work for downloading a directory that is not the root directory
    downloadAll() {
      const downloadLink = this.iframeUrl.replace(
        /\/artifacts\/.*$/,
        '/artifacts'
      );

      window.open(downloadLink, '_blank');
    }
  }
});
