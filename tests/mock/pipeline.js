import { copy } from '@ember/object/internals';
import { assign } from '@ember/polyfills';

const pipeline = {
  id: '4',
  scmUrl: 'git@github.com:foo/bar.git#master',
  scmRepo: {
    name: 'foo/bar',
    branch: 'master',
    url: 'https://github.com/foo/bar'
  },
  createTime: '2016-09-15T23:12:23.760Z',
  admins: { batman: true },
  workflowGraph: {
    nodes: [],
    edges: []
  }
};

export default workflowGraph => assign(copy(pipeline, true), { workflowGraph });
