import { copy } from '@ember/object/internals';

export default () =>
  copy(
    {
      nodes: [{ name: '~pr' }, { name: '~commit' }, { id: 12345, name: 'main' }, { is: 123456, name: 'publish' }],
      edges: [
        { src: '~pr', dest: 'main' },
        { src: '~commit', dest: 'main' },
        { src: 'main', dest: 'publish' }
      ]
    },
    true
  );
