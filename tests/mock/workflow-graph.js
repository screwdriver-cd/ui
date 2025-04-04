import { copy } from 'ember-copy';

export default () =>
  copy(
    {
      nodes: [
        { name: '~pr' },
        { name: '~commit' },
        { id: 12345, name: 'main' },
        { id: 123456, name: 'publish' }
      ],
      edges: [
        { src: '~pr', dest: 'main' },
        { src: '~commit', dest: 'main' },
        { src: 'main', dest: 'publish' }
      ]
    },
    true
  );
