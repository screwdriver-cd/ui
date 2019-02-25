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
  artifact: service('build-artifact'),
  classNames: ['artifact-tree'],
  classNameBindings: ['buildStatus'],
  typesOptions,
  plugins: 'types',
  treedata: computed('buildStatus', 'buildId', {
    get() {
      const buildStatus = this.get('buildStatus');

      if (buildStatus === 'RUNNING' || buildStatus === 'QUEUED') {
        return resolve([]);
      }

      return ObjectPromiseProxy.create({
        promise: this.get('artifact').fetchManifest(this.get('buildId'))
      });
    }
  }),
  actions: {
    handleJstreeEventDidChange(data) {
      if (data.node) {
        let href = `${data.node.a_attr.href}?download=true`;

        if (href !== '#') {
          window.open(href, '_blank');
        }
      }
    }
  }
});
