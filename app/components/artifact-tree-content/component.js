import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
  router: service(),

  artifactPath: computed('node.directory', 'node.file.a_attr.href', {
    get() {
      if (this.node.directory === undefined) {
        return this.node.file.a_attr.href.substring(
          this.node.file.a_attr.href.split('artifacts/')[0].length + 10
        );
      }

      console.log('WSWSWS');
      console.log(this.node.directory);
      const childPath = this.node.directory[0].a_attr.href.substring(
        this.node.directory[0].a_attr.href.split('artifacts/')[0].length + 10
      );

      return `${childPath.substring(
        0,
        childPath.length -
          childPath.split('/')[childPath.split('/').length - 1].length -
          1
      )}/`;
    }
  }),

  nodeURL: computed('artifactPath', 'router.currentURL', {
    get() {
      const baseURL = this.router.currentURL.substring(
        0,
        this.router.currentURL.split('artifacts/')[0].length
      );

      console.log(baseURL);
      console.log(this.artifactPath);

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
