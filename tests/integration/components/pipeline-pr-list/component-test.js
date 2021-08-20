import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | pipeline pr list', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    const jobs = [
      EmberObject.create({
        id: 'abcd',
        name: 'PR-1234:main',
        createTimeWords: 'now',
        createTimeExact: '08/03/2021, 02:21 AM',
        title: 'update readme',
        username: 'anonymous',
        builds: [
          {
            id: '1234',
            status: 'SUCCESS'
          }
        ]
      }),
      EmberObject.create({
        id: 'efgh',
        name: 'A',
        createTimeWords: 'now',
        createTimeExact: '08/03/2021, 02:21 AM',
        title: 'revert PR-1234',
        username: 'suomynona',
        builds: [
          {
            id: '1235',
            status: 'FAILURE'
          }
        ]
      })
    ];

    const workflowgraph = {
      nodes: [
        { name: '~pr' },
        { name: '~commit' },
        { id: 1, name: 'main', displayName: 'myname' },
        { id: 2, name: 'A' }
      ],
      edges: [
        { src: '~pr', dest: 'main' },
        { src: '~commit', dest: 'main' },
        { src: 'main', dest: 'A' }
      ]
    };

    this.set('jobsMock', jobs);
    this.set('workflowGraphMock', workflowgraph);
    this.set('startBuild', Function.prototype);
    this.set('stopPRBuilds', Function.prototype);

    await render(hbs`{{pipeline-pr-list
      jobs=jobsMock
      isRestricted=isRestricted
      startBuild=startBuild
      workflowGraph=workflowGraphMock
      stopPRBuilds=stopPRBuilds}}`);

    assert.dom('.view .view .detail').exists({ count: 2 });
    assert.dom('.title').hasText('update readme');
    assert.dom('.by').hasText('anonymous');
  });

  test('it renders start build for restricted PR pipeline', async function (assert) {
    const jobs = [
      EmberObject.create({
        id: 'abcd',
        name: 'PR-1234:main',
        createTimeWords: 'now',
        title: 'update readme',
        username: 'anonymous',
        builds: []
      })
    ];

    this.set('jobsMock', jobs);
    this.set('isRestricted', true);
    this.set('startBuild', Function.prototype);
    this.set('stopPRBuilds', Function.prototype);

    await render(hbs`{{pipeline-pr-list
      jobs=jobsMock
      isRestricted=isRestricted
      startBuild=startBuild
      stopPRBuilds=stopPRBuilds}}`);

    assert.dom('.stopButton').doesNotExist();
    assert.dom('.view .view .detail').doesNotExist();
    assert.dom('.title').hasText('update readme');
    assert.dom('.by').hasText('anonymous');
    assert.dom('.view .startButton').exists({ count: 1 });
  });

  test('it renders PR stop button', async function (assert) {
    const jobs = [
      EmberObject.create({
        id: 'abcd',
        name: 'PR-1234:main',
        createTimeWords: 'now',
        title: 'update readme',
        username: 'anonymous',
        builds: [
          {
            id: '1235',
            status: 'RUNNING',
            endTime: null
          }
        ]
      })
    ];

    const workflowgraph = {
      nodes: [
        { name: '~pr' },
        { name: '~commit' },
        { id: 1, name: 'main', displayName: 'myname' },
        { id: 2, name: 'A' }
      ],
      edges: [
        { src: '~pr', dest: 'main' },
        { src: '~commit', dest: 'main' },
        { src: 'main', dest: 'A' }
      ]
    };

    this.set('jobsMock', jobs);
    this.set('isRestricted', true);
    this.set('startBuild', Function.prototype);
    this.set('stopPRBuilds', Function.prototype);
    this.set('workflowGraphMock', workflowgraph);

    await render(hbs`{{pipeline-pr-list
      jobs=jobsMock
      isRestricted=isRestricted
      startBuild=startBuild
      workflowGraph=workflowGraphMock
      stopPRBuilds=stopPRBuilds}}`);

    assert.dom('.stopButton').exists({ count: 1 });
    assert.dom('.view .view .detail').exists({ count: 1 });
    assert.dom('.title').hasText('update readme');
    assert.dom('.by').hasText('anonymous');
  });
});
