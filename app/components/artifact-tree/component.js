import { resolve } from 'rsvp';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import PromiseProxyMixin from '@ember/object/promise-proxy-mixin';
import ObjectProxy from '@ember/object/proxy';

const ObjectPromiseProxy = ObjectProxy.extend(PromiseProxyMixin);
const typesOptions = {
  directory: {
    icon: 'fa fa-folder-o fa-lg'
  },
  file: {
    icon: 'fa fa-file-text-o'
  }
};

export default Component.extend({
  jstreeActionReceiver: null,
  selectedArtifact: '',
  iframeUrl: '',
  router: service(),
  artifact: service('build-artifact'),
  classNames: ['artifact-tree'],
  classNameBindings: ['buildStatus'],
  typesOptions,
  plugins: 'types',
  isModalOpen: false,
  treedata: computed('buildStatus', 'buildId', {
    get() {
      const { buildStatus } = this;

      if (buildStatus === 'RUNNING' || buildStatus === 'QUEUED') {
        return resolve([]);
      }

      return ObjectPromiseProxy.create({
        promise: this.artifact.fetchManifest(this.buildId)
      });
    }
  }),

  download(href) {
    window.open(`${href}?type=download`, '_blank');
  },

  actions: {
    handleClose() {
      this.set('isModalOpen', false);
    },

    handleDownload() {
      this.download(this.href);
    },

    handleJstreeEventDidRedraw() {
      const artifactPath =
        this.selectedArtifact === undefined ? '' : this.selectedArtifact;
      const paths = artifactPath.split('/');
      const jstree = this.jstreeActionReceiver.target.treeObject.jstree(true);

      let nodeList = jstree.get_json();

      let targetNode = null;

      // traversing jstree to find target artifact node
      paths.forEach(path => {
        targetNode = nodeList.find(node => node.text === path);
        if (targetNode && targetNode.type === 'directory') {
          nodeList = targetNode.children;
        }
      });

      // select the target node
      if (targetNode) {
        this.jstreeActionReceiver.send('selectNode', targetNode.id);
      }
    },

    showArtifactPreview(treeData) {
      const { href } = treeData.a_attr;
      const artifactPath = href.substring(
        href.split('artifacts/')[0].length + 10
      );

      this.setProperties({
        href,
        iframeUrl: `${href}?type=preview`
      });

      this.router.transitionTo('pipeline.build.artifacts.detail', artifactPath);
    },

    handleJstreeEventDidChange(data = {}) {
      const { node, instance } = data;

      if (node) {
        const {
          type,
          a_attr: { href }
        } = node;
        const artifactPath = instance.get_path(node, '/');

        if (type === 'directory') {
          instance.toggle_node(node);
          this.router.transitionTo(
            'pipeline.build.artifacts.detail',
            artifactPath
          );

          return;
        }

        if (type === 'file') {
          this.setProperties({
            href,
            iframeUrl: `${href}?type=preview`,
            isModalOpen: true
          });
        }
        this.router.transitionTo(
          'pipeline.build.artifacts.detail',
          artifactPath
        );
      }
    }
  }
});
