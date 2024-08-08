import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | pipeline/workflow/graph', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders base graph', async function (assert) {
    const workflowGraph = {
      nodes: [{ name: '~commit' }, { name: 'main' }],
      edges: [{ src: '~commit', dest: 'main' }]
    };
    const event = { startFrom: '~commit' };
    const jobs = [{ id: 1 }];
    const builds = [{ id: 1, jobId: 1, status: 'SUCCESS' }];
    const stages = [];
    const displayJobNameLength = 20;

    this.setProperties({
      workflowGraph,
      event,
      jobs,
      builds,
      stages,
      displayJobNameLength
    });
    await render(
      hbs`<Pipeline::Workflow::Graph
            @workflowGraph={{this.workflowGraph}}
            @event={{this.event}}
            @jobs={{this.jobs}}
            @builds={{this.builds}}
            @stages={{this.stages}}
            @chainPr={{false}}
            @displayJobNameLength={{this.displayJobNameLength}}
      />`
    );

    assert.dom('svg').exists({ count: 1 });

    assert.equal(this.element.querySelector('svg').children.length, 5);
  });

  test('it renders with correct job display name length', async function (assert) {
    const nodeNames = ['~commit', 'abcdefghijklmnopqrstuvwxyz'];
    const workflowGraph = {
      nodes: [{ name: nodeNames[0] }, { name: nodeNames[1] }],
      edges: [{ src: nodeNames[0], dest: nodeNames[1] }]
    };
    const event = { startFrom: nodeNames[0] };
    const jobs = [{ id: 1 }];
    const builds = [{ id: 1, jobId: 1, status: 'SUCCESS' }];
    const stages = [];
    const displayJobNameLength = 25;

    this.setProperties({
      workflowGraph,
      event,
      jobs,
      builds,
      stages,
      displayJobNameLength
    });
    await render(
      hbs`<Pipeline::Workflow::Graph
            @workflowGraph={{this.workflowGraph}}
            @event={{this.event}}
            @jobs={{this.jobs}}
            @builds={{this.builds}}
            @stages={{this.stages}}
            @chainPr={{false}}
            @displayJobNameLength={{this.displayJobNameLength}}
      />`
    );

    const labels = this.element.querySelectorAll('.graph-label');

    assert.equal(labels.length, 2);
    assert.equal(labels[0].textContent.trim(), nodeNames[0] + nodeNames[0]);
    assert.equal(
      labels[1].textContent.trim(),
      `${nodeNames[1].substring(0, 8)}...${nodeNames[1].slice(-8)}${
        nodeNames[1]
      }`
    );
  });

  test('it renders virtual stage', async function (assert) {
    const workflowGraph = {
      nodes: [
        { name: '~commit' },
        {
          id: 11,
          name: 'stage@test:setup',
          stageName: 'test',
          virtual: true
        },
        { id: 1, name: 'main', stageName: 'test' },
        {
          id: 12,
          name: 'stage@test:teardown',
          stageName: 'test',
          virtual: true
        }
      ],
      edges: [
        { src: '~commit', dest: 'stage@test:setup' },
        { src: 'stage@test:setup', dest: 'main' },
        { src: 'main', dest: 'stage@test:teardown' }
      ]
    };
    const event = { startFrom: '~commit' };
    const jobs = [
      { id: 1, name: 'main' },
      { id: 11, name: 'stage@test:setup' },
      { id: 12, name: 'stage@test:teardown' }
    ];
    const builds = [
      { id: 1, jobId: 11, status: 'SUCCESS' },
      { id: 2, jobId: 1, status: 'SUCCESS' },
      { id: 3, jobId: 12, status: 'SUCCESS' }
    ];
    const stages = [
      { id: 10, name: 'test', jobIds: [1], setup: 11, teardown: 12 }
    ];
    const displayJobNameLength = 20;

    this.setProperties({
      workflowGraph,
      event,
      jobs,
      builds,
      stages,
      displayJobNameLength
    });
    await render(
      hbs`<Pipeline::Workflow::Graph
            @workflowGraph={{this.workflowGraph}}
            @event={{this.event}}
            @jobs={{this.jobs}}
            @builds={{this.builds}}
            @stages={{this.stages}}
            @chainPr={{false}}
            @displayJobNameLength={{this.displayJobNameLength}}
      />`
    );

    assert.dom('svg').exists({ count: 1 });

    assert.equal(this.element.querySelector('svg').children.length, 7);
  });

  test('it renders stage', async function (assert) {
    const workflowGraph = {
      nodes: [
        { name: '~commit' },
        {
          id: 11,
          name: 'stage@test:setup',
          stageName: 'test'
        },
        { id: 1, name: 'main', stageName: 'test' },
        {
          id: 12,
          name: 'stage@test:teardown',
          stageName: 'test'
        }
      ],
      edges: [
        { src: '~commit', dest: 'stage@test:setup' },
        { src: 'stage@test:setup', dest: 'main' },
        { src: 'main', dest: 'stage@test:teardown' }
      ]
    };
    const event = { startFrom: '~commit' };
    const jobs = [
      { id: 1, name: 'main' },
      { id: 11, name: 'stage@test:setup' },
      { id: 12, name: 'stage@test:teardown' }
    ];
    const builds = [
      { id: 1, jobId: 11, status: 'SUCCESS' },
      { id: 2, jobId: 1, status: 'SUCCESS' },
      { id: 3, jobId: 12, status: 'SUCCESS' }
    ];
    const stages = [
      { id: 10, name: 'test', jobIds: [1], setup: 11, teardown: 12 }
    ];
    const displayJobNameLength = 20;

    this.setProperties({
      workflowGraph,
      event,
      jobs,
      builds,
      stages,
      displayJobNameLength
    });
    await render(
      hbs`<Pipeline::Workflow::Graph
            @workflowGraph={{this.workflowGraph}}
            @event={{this.event}}
            @jobs={{this.jobs}}
            @builds={{this.builds}}
            @stages={{this.stages}}
            @chainPr={{false}}
            @displayJobNameLength={{this.displayJobNameLength}}
      />`
    );

    assert.dom('svg').exists({ count: 1 });

    assert.equal(this.element.querySelector('svg').children.length, 13);
  });

  test('it renders with chained PRs', async function (assert) {
    const workflowGraph = {
      nodes: [{ name: '~pr' }, { name: 'first' }, { name: 'second' }],
      edges: [
        { src: '~pr', dest: 'first' },
        { src: 'first', dest: 'second' }
      ]
    };
    const event = { startFrom: '~pr' };
    const jobs = [{ id: 1 }];
    const builds = [{ id: 1, jobId: 1, status: 'SUCCESS' }];
    const stages = [];
    const displayJobNameLength = 20;

    this.setProperties({
      workflowGraph,
      event,
      jobs,
      builds,
      stages,
      displayJobNameLength
    });
    await render(
      hbs`<Pipeline::Workflow::Graph
            @workflowGraph={{this.workflowGraph}}
            @event={{this.event}}
            @jobs={{this.jobs}}
            @builds={{this.builds}}
            @stages={{this.stages}}
            @chainPr={{true}}
            @displayJobNameLength={{this.displayJobNameLength}}
      />`
    );

    assert.dom('svg').exists({ count: 1 });

    assert.equal(this.element.querySelector('svg').children.length, 8);
  });
});
