import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render, find } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | pipeline pr view', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders a successful PR', async function (assert) {
    const job = EmberObject.create({
      id: 'abcd',
      name: 'PR-1234:main',
      createTimeWords: 'now',
      createTimeExact: '06/03/2021, 10:04 PM',
      title: 'update readme',
      username: 'anonymous',
      builds: [
        {
          id: '1234',
          status: 'SUCCESS',
          startTimeWords: 'now',
          startTimeExact: '06/03/2021, 10:04 PM'
        }
      ]
    });

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

    this.set('jobMock', job);
    this.set('workflowGraphMock', workflowgraph);

    await render(
      hbs`<PipelinePrView @job={{this.jobMock}} @workflowGraph={{this.workflowGraphMock}} />`
    );

    assert.dom('.SUCCESS').exists({ count: 1 });
    assert.equal(
      find('.detail')
        .textContent.trim()
        .replace(/\s{2,}/g, ' '),
      'myname Started 06/03/2021, 10:04 PM'
    );
    assert.dom('.date').hasText('Started 06/03/2021, 10:04 PM');
    assert.dom('.status .fa-circle-check').exists({ count: 1 });
  });

  // When a user sets a job to unstable, it should show unstable icon
  test('it renders an unstable PR', async function (assert) {
    const job = EmberObject.create({
      id: 'abcd',
      name: 'PR-1234:main',
      createTimeWords: 'now',
      createTimeExact: '06/03/2021, 10:04 PM',
      title: 'update readme',
      username: 'anonymous',
      builds: [
        {
          id: '1234',
          status: 'UNSTABLE',
          startTimeWords: 'now',
          startTimeExact: '06/03/2021, 10:04 PM'
        }
      ]
    });

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

    this.set('jobMock', job);
    this.set('workflowGraphMock', workflowgraph);

    await render(
      hbs`<PipelinePrView @job={{this.jobMock}} @workflowGraph={{this.workflowGraphMock}} />`
    );

    assert.dom('.UNSTABLE').exists({ count: 1 });
    assert.dom('.fa-circle-exclamation').exists({ count: 1 });
  });

  test('it renders a failed PR', async function (assert) {
    const job = EmberObject.create({
      id: 'abcd',
      name: 'PR-1234:main',
      createTimeWords: 'now',
      createTimeExact: '06/03/2021, 10:04 PM',
      title: 'update readme',
      username: 'anonymous',
      builds: [
        {
          id: '1234',
          status: 'FAILURE',
          startTimeWords: 'now',
          startTimeExact: '06/03/2021, 10:04 PM'
        }
      ]
    });

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

    this.set('jobMock', job);
    this.set('workflowGraphMock', workflowgraph);

    await render(
      hbs`<PipelinePrView @job={{this.jobMock}} @workflowGraph={{this.workflowGraphMock}} />`
    );

    assert.dom('.FAILURE').exists({ count: 1 });
    assert.dom('.fa-circle-xmark').exists({ count: 1 });
  });

  test('it renders a queued PR', async function (assert) {
    const job = EmberObject.create({
      id: 'abcd',
      name: 'PR-1234:main',
      createTimeWords: 'now',
      createTimeExact: '06/03/2021, 10:04 PM',
      title: 'update readme',
      username: 'anonymous',
      builds: [
        {
          id: '1234',
          status: 'QUEUED',
          startTimeWords: 'now',
          startTimeExact: '06/03/2021, 10:04 PM'
        }
      ]
    });

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

    this.set('jobMock', job);
    this.set('workflowGraphMock', workflowgraph);

    await render(
      hbs`<PipelinePrView @job={{this.jobMock}} @workflowGraph={{this.workflowGraphMock}} />`
    );

    assert.dom('.QUEUED').exists({ count: 1 });
    assert.dom('.fa-spinner').exists({ count: 1 });
  });

  test('it renders a running PR', async function (assert) {
    const job = EmberObject.create({
      id: 'abcd',
      name: 'PR-1234:main',
      createTimeWords: 'now',
      createTimeExact: '06/03/2021, 10:04 PM',
      title: 'update readme',
      username: 'anonymous',
      builds: [
        {
          id: '1234',
          status: 'RUNNING',
          startTimeWords: 'now',
          startTimeExact: '06/03/2021, 10:04 PM'
        }
      ]
    });

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

    this.set('jobMock', job);
    this.set('workflowGraphMock', workflowgraph);

    await render(
      hbs`<PipelinePrView @job={{this.jobMock}} @workflowGraph={{this.workflowGraphMock}} />`
    );

    assert.dom('.RUNNING').exists({ count: 1 });
    assert.dom('.fa-spinner').exists({ count: 1 });
  });
});
