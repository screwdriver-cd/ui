import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render, rerender } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module('Integration | Component | pipeline/workflow/graph', function (hooks) {
  setupRenderingTest(hooks);

  const stages = [];

  hooks.beforeEach(function () {
    const pipelinePageState = this.owner.lookup('service:pipeline-page-state');

    stages.splice(0);
    sinon.stub(pipelinePageState, 'getStages').returns(stages);
  });

  test('it renders base graph', async function (assert) {
    this.setProperties({
      workflowGraph: {
        nodes: [{ name: '~commit' }, { name: 'main' }],
        edges: [{ src: '~commit', dest: 'main' }]
      },
      event: { startFrom: '~commit' },
      jobs: [{ id: 1 }],
      builds: [{ id: 1, jobId: 1, status: 'SUCCESS' }],
      collapsedStages: new Set([]),
      displayJobNameLength: 20
    });
    await render(
      hbs`<Pipeline::Workflow::Graph
            @workflowGraph={{this.workflowGraph}}
            @event={{this.event}}
            @jobs={{this.jobs}}
            @builds={{this.builds}}
            @collapsedStages={{this.collapsedStages}}
            @chainPr={{false}}
            @displayJobNameLength={{this.displayJobNameLength}}
      />`
    );

    assert.dom('svg').exists({ count: 1 });

    assert.equal(this.element.querySelector('svg').children.length, 5);
  });

  test('it renders with correct job display name length', async function (assert) {
    const nodeNames = ['~commit', 'abcdefghijklmnopqrstuvwxyz'];

    this.setProperties({
      workflowGraph: {
        nodes: [{ name: nodeNames[0] }, { name: nodeNames[1] }],
        edges: [{ src: nodeNames[0], dest: nodeNames[1] }]
      },
      event: { startFrom: nodeNames[0] },
      jobs: [{ id: 1 }],
      builds: [{ id: 1, jobId: 1, status: 'SUCCESS' }],
      collapsedStages: new Set([]),
      displayJobNameLength: 25
    });
    await render(
      hbs`<Pipeline::Workflow::Graph
            @workflowGraph={{this.workflowGraph}}
            @event={{this.event}}
            @jobs={{this.jobs}}
            @builds={{this.builds}}
            @collapsedStages={{this.collapsedStages}}
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
    stages.push({ id: 10, name: 'test', jobIds: [1], setup: 11, teardown: 12 });

    this.setProperties({
      workflowGraph: {
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
      },
      event: { startFrom: '~commit' },
      jobs: [
        { id: 1, name: 'main' },
        { id: 11, name: 'stage@test:setup' },
        { id: 12, name: 'stage@test:teardown' }
      ],
      builds: [
        { id: 1, jobId: 11, status: 'SUCCESS' },
        { id: 2, jobId: 1, status: 'SUCCESS' },
        { id: 3, jobId: 12, status: 'SUCCESS' }
      ],
      collapsedStages: new Set([]),
      displayJobNameLength: 20
    });
    await render(
      hbs`<Pipeline::Workflow::Graph
            @workflowGraph={{this.workflowGraph}}
            @event={{this.event}}
            @jobs={{this.jobs}}
            @builds={{this.builds}}
            @collapsedStages={{this.collapsedStages}}
            @chainPr={{false}}
            @displayJobNameLength={{this.displayJobNameLength}}
      />`
    );

    assert.dom('svg').exists({ count: 1 });

    assert.equal(this.element.querySelector('svg').children.length, 7);
  });

  test('it renders stage', async function (assert) {
    stages.push({ id: 10, name: 'test', jobIds: [1], setup: 11, teardown: 12 });

    this.setProperties({
      workflowGraph: {
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
      },
      event: { startFrom: '~commit' },
      jobs: [
        { id: 1, name: 'main' },
        { id: 11, name: 'stage@test:setup' },
        { id: 12, name: 'stage@test:teardown' }
      ],
      builds: [
        { id: 1, jobId: 11, status: 'SUCCESS' },
        { id: 2, jobId: 1, status: 'SUCCESS' },
        { id: 3, jobId: 12, status: 'SUCCESS' }
      ],
      collapsedStages: new Set([]),
      displayJobNameLength: 20
    });
    await render(
      hbs`<Pipeline::Workflow::Graph
            @workflowGraph={{this.workflowGraph}}
            @event={{this.event}}
            @jobs={{this.jobs}}
            @builds={{this.builds}}
            @collapsedStages={{this.collapsedStages}}
            @chainPr={{false}}
            @displayJobNameLength={{this.displayJobNameLength}}
      />`
    );

    assert.dom('svg').exists({ count: 1 });

    assert.equal(this.element.querySelector('svg').children.length, 13);
  });

  test('it renders with chained PRs', async function (assert) {
    this.setProperties({
      workflowGraph: {
        nodes: [{ name: '~pr' }, { name: 'first' }, { name: 'second' }],
        edges: [
          { src: '~pr', dest: 'first' },
          { src: 'first', dest: 'second' }
        ]
      },
      event: { startFrom: '~pr' },
      jobs: [{ id: 1 }],
      builds: [{ id: 1, jobId: 1, status: 'SUCCESS' }],
      collapsedStages: new Set([]),
      displayJobNameLength: 20
    });
    await render(
      hbs`<Pipeline::Workflow::Graph
            @workflowGraph={{this.workflowGraph}}
            @event={{this.event}}
            @jobs={{this.jobs}}
            @builds={{this.builds}}
            @collapsedStages={{this.collapsedStages}}
            @chainPr={{true}}
            @displayJobNameLength={{this.displayJobNameLength}}
      />`
    );

    assert.dom('svg').exists({ count: 1 });

    assert.equal(this.element.querySelector('svg').children.length, 8);
  });

  test('it re-renders graph when workflowGraph changes', async function (assert) {
    const workflowGraphWithDownstreamTriggers = {
      nodes: [
        { name: '~commit' },
        { name: 'main' },
        { name: 'sd-main-triggers', status: 'DOWNSTREAM_TRIGGER' }
      ],
      edges: [
        { src: '~commit', dest: 'main' },
        { src: 'main', dest: 'sd-main-triggers' }
      ]
    };

    this.setProperties({
      workflowGraph: {
        nodes: [{ name: '~commit' }, { name: 'main' }],
        edges: [{ src: '~commit', dest: 'main' }]
      },
      event: { startFrom: '~commit' },
      jobs: [{ id: 1 }],
      builds: [{ id: 1, jobId: 1, status: 'SUCCESS' }],
      collapsedStages: new Set([]),
      displayJobNameLength: 20
    });
    await render(
      hbs`<Pipeline::Workflow::Graph
            @workflowGraph={{this.workflowGraph}}
            @event={{this.event}}
            @jobs={{this.jobs}}
            @builds={{this.builds}}
            @collapsedStages={{this.collapsedStages}}
            @chainPr={{false}}
            @displayJobNameLength={{this.displayJobNameLength}}
      />`
    );

    assert.equal(this.element.querySelector('svg').children.length, 5);

    this.setProperties({ workflowGraph: workflowGraphWithDownstreamTriggers });
    await rerender();

    assert.equal(this.element.querySelector('svg').children.length, 8);
  });

  test('it re-renders graph when builds update', async function (assert) {
    this.setProperties({
      workflowGraph: {
        nodes: [{ name: '~commit' }, { name: 'main', id: 123 }],
        edges: [{ src: '~commit', dest: 'main' }]
      },
      event: { startFrom: '~commit' },
      jobs: [{ id: 123 }],
      builds: [{ id: 1, jobId: 123, status: 'RUNNING' }],
      collapsedStages: new Set([]),
      displayJobNameLength: 20
    });
    await render(
      hbs`<Pipeline::Workflow::Graph
            @workflowGraph={{this.workflowGraph}}
            @event={{this.event}}
            @jobs={{this.jobs}}
            @builds={{this.builds}}
            @collapsedStages={{this.collapsedStages}}
            @chainPr={{false}}
            @displayJobNameLength={{this.displayJobNameLength}}
      />`
    );

    assert.dom('svg [data-job=main]').hasClass('build-running');

    this.setProperties({
      builds: [{ id: 1, jobId: 123, status: 'SUCCESS' }]
    });
    await rerender();

    assert.dom('svg [data-job=main]').hasClass('build-success');
  });

  test('it re-renders graph when stage builds update', async function (assert) {
    stages.push({ id: 10, name: 'test', jobIds: [1], setup: 11, teardown: 12 });

    this.setProperties({
      workflowGraph: {
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
      },
      event: { startFrom: '~commit' },
      jobs: [
        { id: 1, name: 'main' },
        { id: 11, name: 'stage@test:setup' },
        { id: 12, name: 'stage@test:teardown' }
      ],
      builds: [
        { id: 1, jobId: 11, status: 'SUCCESS' },
        { id: 2, jobId: 1, status: 'SUCCESS' },
        { id: 3, jobId: 12, status: 'RUNNING' }
      ],
      stageBuilds: [{ id: 1, stageId: 10, status: 'RUNNING' }],
      collapsedStages: new Set([]),
      displayJobNameLength: 20
    });
    await render(
      hbs`<Pipeline::Workflow::Graph
            @workflowGraph={{this.workflowGraph}}
            @event={{this.event}}
            @jobs={{this.jobs}}
            @builds={{this.builds}}
            @stageBuilds={{this.stageBuilds}}
            @collapsedStages={{this.collapsedStages}}
            @chainPr={{false}}
            @displayJobNameLength={{this.displayJobNameLength}}
      />`
    );

    assert.dom('svg [data-stage=test]').hasClass('build-running');

    this.setProperties({
      builds: [
        { id: 1, jobId: 11, status: 'SUCCESS' },
        { id: 2, jobId: 1, status: 'SUCCESS' },
        { id: 3, jobId: 12, status: 'SUCCESS' }
      ],
      stageBuilds: [{ id: 1, stageId: 10, status: 'SUCCESS' }]
    });
    await rerender();

    assert.dom('svg [data-stage=test]').hasClass('build-success');
  });
});
