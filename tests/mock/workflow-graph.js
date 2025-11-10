// eslint-disable-next-line import/prefer-default-export
export const mockGraph = {
  nodes: [
    { name: '~pr' },
    { name: '~commit' },
    { id: 12345, name: 'main' },
    { id: 12346, name: 'publish' }
  ],
  edges: [
    { src: '~pr', dest: 'main' },
    { src: '~commit', dest: 'main' },
    { src: 'main', dest: 'publish' }
  ]
};
