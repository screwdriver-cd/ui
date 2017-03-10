import Ember from 'ember';

const ObjectPromiseProxy = Ember.ObjectProxy.extend(Ember.PromiseProxyMixin);
const typesOptions = {
  directory: {
    icon: 'fa fa-folder-o fa-lg'
  },
  file: {
    icon: 'fa fa-file-text-o'
  }
};

export default Ember.Component.extend({
  classNames: ['artifact-tree'],
  classNameBindings: ['buildStatus'],
  artifact: Ember.inject.service('build-artifact'),
  typesOptions,
  plugins: 'types',
  treedata: Ember.computed('buildStatus', 'buildId', {
    get() {
      const buildStatus = this.get('buildStatus');

      if (buildStatus === 'RUNNING' || buildStatus === 'QUEUED') {
        return Ember.RSVP.resolve([]);
      }

      return ObjectPromiseProxy.create({
        promise: this.get('artifact').fetchManifest(this.get('buildId'))
      });
    }
  }),
  actions: {
    handleJstreeEventDidChange(data) {
      if (data.node) {
        let href = data.node.a_attr.href;

        if (href !== '#') {
          window.open(href, '_blank');
        }
      }
    }
  }
});
