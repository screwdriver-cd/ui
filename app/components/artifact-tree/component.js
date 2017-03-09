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
        console.log('buildStatus running or queue: ', buildStatus);

        return [];
      }

      console.log('buildStatus after running or queue: ', buildStatus);

      return this.get('artifact').fetchManifest(this.get('buildId'))
      .then((res) => {
        console.log('res: ', res);

        this.set('treedata', res);
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
