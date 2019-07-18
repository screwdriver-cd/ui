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
  iframeUrl: undefined,
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

    handleJstreeEventDidChange(data = {}) {
      const { node, instance } = data;

      if (node) {
        const {
          type,
          a_attr: { href }
        } = node;

        if (type === 'directory') {
          instance.toggle_node(node);

          return;
        }

        if (type === 'file') {
          this.setProperties({
            href,
            iframeUrl: `${href}?type=preview`,
            isModalOpen: true
          });
        }
      }
    }
  }
});
