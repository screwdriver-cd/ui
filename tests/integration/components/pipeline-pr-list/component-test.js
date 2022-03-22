import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import Pretender from 'pretender';

const mockPipelineData = {
  id: 3709
};

let server;

module('Integration | Component | pipeline pr list', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    server = new Pretender();

    const mockEventData = {
      id: 651994,
      groupEventId: 651994,
      causeMessage: 'Manually started by adong',
      commit: {
        author: {
          avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
          name: 'Alan',
          username: 'adong',
          url: 'https://github.com/adong'
        },
        committer: {
          avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
          name: 'GitHub Web Flow',
          username: 'web-flow',
          url: 'https://github.com/web-flow'
        },
        message: 'PR Build',
        url: 'https://github.com/adong/artifacts-test/commit/799de88b02238977ef18b1b420813134adda29ce'
      },
      createTime: '2021-10-20T16:35:41.326Z',
      creator: {
        avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
        name: 'Alan',
        username: 'adong',
        url: 'https://github.com/adong'
      },
      meta: {
        parameters: {},
        build: {
          buildId: '743380',
          coverageKey: 'job:34379',
          eventId: '651994',
          jobId: '34379',
          jobName: 'PR-1:something',
          pipelineId: '3709',
          sha: '799de88b02238977ef18b1b420813134adda29ce'
        },
        commit: {
          author: {
            avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
            name: 'Alan',
            url: 'https://github.com/adong',
            username: 'adong'
          },
          changedFiles: 'screwdriver.yaml',
          committer: {
            avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
            name: 'GitHub Web Flow',
            url: 'https://github.com/web-flow',
            username: 'web-flow'
          },
          message: 'PR Build',
          url: 'https://github.com/adong/artifacts-test/commit/799de88b02238977ef18b1b420813134adda29ce'
        }
      },
      pipelineId: 3709,
      sha: '799de88b02238977ef18b1b420813134adda29ce',
      startFrom: '~pr',
      type: 'pr',
      workflowGraph: {
        nodes: [
          {
            name: '~pr'
          },
          {
            name: '~commit'
          },
          {
            name: 'main'
          },
          {
            name: 'something'
          }
        ],
        edges: [
          {
            src: '~commit',
            dest: 'main'
          },
          {
            src: '~pr',
            dest: 'something'
          }
        ]
      },
      pr: {
        url: 'https://github.com/adong/artifacts-test/pull/1',
        prBranchName: 'adong-patch-1',
        prSource: 'branch',
        ref: 'pull/1/merge'
      },
      prNum: 1
    };

    server.get(
      `http://localhost:8080/v4/pipelines/${mockPipelineData.id}/events`,
      () => [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify([mockEventData])
      ]
    );
  });

  hooks.afterEach(function () {
    server.shutdown();
  });

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
    this.set('pipelineMock', mockPipelineData);

    await render(hbs`{{pipeline-pr-list
      jobs=jobsMock
      pipeline=pipelineMock
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
    this.set('pipelineMock', mockPipelineData);

    await render(hbs`{{pipeline-pr-list
      jobs=jobsMock
      pipeline=pipelineMock
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
    this.set('pipelineMock', mockPipelineData);

    await render(hbs`{{pipeline-pr-list
      jobs=jobsMock
      pipeline=pipelineMock
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
