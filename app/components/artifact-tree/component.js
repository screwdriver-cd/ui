import Ember from 'ember';
// for testing
// const testTreedata = [
//   {
//     text: 'node1',
//     type: 'folder',
//     children: [
//           { text: 'child1', type: 'file', a_attr: { href: 'http://www.google.com' } },
//           { text: 'child2', type: 'file', a_attr: { href: 'http://www.google.com' } }
//     ]
//   },
//   {
//     text: 'node2',
//     type: 'file',
//     a_attr: { href: 'http://www.google.com' }
//   }
// ];

const typesOptions = {
  folder: {
    icon: 'fa fa-folder-o fa-lg'
  },
  file: {
    icon: 'fa fa-file-text-o'
  }
};

export default Ember.Component.extend({
  artifact: Ember.inject.service('build-artifact'),
  typesOptions,
  plugins: 'types',
  treedata: Ember.computed('buildStatus', 'buildId', {
    get() {
      const buildStatus = this.get('buildStatus');

      if (buildStatus === 'QUEUE' || 'RUNNING') {
        return [];
      }

      return this.get('artifact').fetchManifest(this.get('buildId'));
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
