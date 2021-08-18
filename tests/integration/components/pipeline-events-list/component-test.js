import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { click, render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import Service from '@ember/service';
import { Promise as EmberPromise } from 'rsvp';
import sinon from 'sinon';

const latestCommitEvent = {
  id: 3,
  sha: 'sha3'
};

module('Integration | Component | pipeline events list', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    const shuttleStub = Service.extend({
      getLatestCommitEvent() {
        return new EmberPromise((resolve) => resolve(latestCommitEvent));
      }
    });
    const pipeline = EmberObject.create({
      id: 1
    });
    const events = [
      EmberObject.create({
        id: 4,
        groupEventId: '2341234',
        startFrom: '~commit',
        causeMessage: 'test',
        commit: {
          url: '#',
          message: 'this was a test'
        },
        creator: {
          url: '#',
          name: 'batman'
        },
        createTimeWords: 'now',
        durationText: '1 sec',
        truncatedMessage: 'this was a test',
        truncatedSha: 'abc124',
        workflowGraph: {
          nodes: [
            { name: '~pr' },
            { name: '~commit' },
            { id: 1, name: 'main' },
            { id: 2, name: 'A' },
            { id: 3, name: 'B' }
          ],
          edges: [
            { src: '~pr', dest: 'main' },
            { src: '~commit', dest: 'main' },
            { src: 'main', dest: 'A' },
            { src: 'A', dest: 'B' }
          ]
        },
        builds: [
          { jobId: 1, id: 4, status: 'SUCCESS' },
          { jobId: 2, id: 5, status: 'SUCCESS' },
          { jobId: 3, id: 6, status: 'FAILURE' }
        ]
      }),
      EmberObject.create({
        id: 3,
        startFrom: '~commit',
        causeMessage: 'test',
        commit: {
          url: '#',
          message: 'this was a test'
        },
        creator: {
          url: '#',
          name: 'batman'
        },
        createTimeWords: 'now',
        durationText: '1 sec',
        truncatedSha: 'abc123',
        workflowGraph: {
          nodes: [
            { name: '~pr' },
            { name: '~commit' },
            { id: 1, name: 'main' },
            { id: 2, name: 'A' },
            { id: 3, name: 'B' }
          ],
          edges: [
            { src: '~pr', dest: 'main' },
            { src: '~commit', dest: 'main' },
            { src: 'main', dest: 'A' },
            { src: 'A', dest: 'B' }
          ]
        },
        builds: [
          { jobId: 1, id: 4, status: 'SUCCESS' },
          { jobId: 2, id: 5, status: 'SUCCESS' },
          { jobId: 3, id: 6, status: 'FAILURE' }
        ]
      })
    ];

    this.owner.register('service:shuttle', shuttleStub);

    this.set('pipelineMock', pipeline);
    this.set('eventsMock', events);
    this.set('updateEventsMock', (page) => {
      assert.equal(page, 2);
    });
    await render(hbs`{{pipeline-events-list
                      pipeline=pipelineMock
                      events=eventsMock
                      eventsPage=1
                      updateEvents=updateEventsMock}}`);

    assert.dom('.view').exists({ count: 2 });
  });

  test('it will redirect to event page when click on pipeline event', async function (assert) {
    const shuttleStub = Service.extend({
      getLatestCommitEvent() {
        return new EmberPromise((resolve) => resolve(latestCommitEvent));
      }
    });
    const events = [
      EmberObject.create({
        pipelineId: 10000,
        id: 4,
        startFrom: '~commit',
        type: 'pipeline',
        causeMessage: 'test',
        commit: {
          url: '#',
          message: 'this was a test'
        },
        creator: {
          url: '#',
          name: 'batman'
        },
        createTimeWords: 'now',
        durationText: '1 sec',
        truncatedMessage: 'this was a test',
        truncatedSha: 'abc124',
        workflowGraph: {
          nodes: [
            { name: '~pr' },
            { name: '~commit' },
            { id: 1, name: 'main' },
            { id: 2, name: 'A' },
            { id: 3, name: 'B' }
          ],
          edges: [
            { src: '~pr', dest: 'main' },
            { src: '~commit', dest: 'main' },
            { src: 'main', dest: 'A' },
            { src: 'A', dest: 'B' }
          ]
        },
        builds: [
          { jobId: 1, id: 4, status: 'SUCCESS' },
          { jobId: 2, id: 5, status: 'SUCCESS' },
          { jobId: 3, id: 6, status: 'FAILURE' }
        ]
      })
    ];

    this.owner.register('service:shuttle', shuttleStub);

    this.set('eventsMock', events);
    this.set('updateEventsMock', (page) => {
      assert.equal(page, 2);
    });

    await render(hbs`{{pipeline-events-list
                      events=eventsMock
                      eventsPage=1
                      updateEvents=updateEventsMock}}`);

    const routerService = this.owner.lookup('service:router');
    const transitionToStub = sinon.stub(routerService, 'transitionTo');

    await click('div.view');
    assert.ok(transitionToStub.calledOnce, 'transitionTo was called once');
  });

  test('it will not redirect to event page when click on PR event', async function (assert) {
    const shuttleStub = Service.extend({
      getLatestCommitEvent() {
        return new EmberPromise((resolve) => resolve(latestCommitEvent));
      }
    });
    const events = [
      EmberObject.create({
        pipelineId: 10000,
        id: 4,
        startFrom: '~pr',
        type: 'pr',
        causeMessage: 'test',
        commit: {
          url: '#',
          message: 'this was a test'
        },
        creator: {
          url: '#',
          name: 'batman'
        },
        createTimeWords: 'now',
        durationText: '1 sec',
        truncatedMessage: 'this was a test',
        truncatedSha: 'abc124',
        workflowGraph: {
          nodes: [
            { name: '~pr' },
            { name: '~commit' },
            { id: 1, name: 'main' },
            { id: 2, name: 'A' },
            { id: 3, name: 'B' }
          ],
          edges: [
            { src: '~pr', dest: 'main' },
            { src: '~commit', dest: 'main' },
            { src: 'main', dest: 'A' },
            { src: 'A', dest: 'B' }
          ]
        },
        builds: [
          { jobId: 1, id: 4, status: 'SUCCESS' },
          { jobId: 2, id: 5, status: 'SUCCESS' },
          { jobId: 3, id: 6, status: 'FAILURE' }
        ]
      })
    ];

    this.owner.register('service:shuttle', shuttleStub);

    this.set('eventsMock', events);
    this.set('updateEventsMock', (page) => {
      assert.equal(page, 2);
    });

    await render(hbs`{{pipeline-events-list
                      events=eventsMock
                      eventsPage=1
                      updateEvents=updateEventsMock}}`);

    const routerService = this.owner.lookup('service:router');
    const transitionToStub = sinon.stub(routerService, 'transitionTo');

    await click('div.view');
    assert.ok(transitionToStub.notCalled, 'transitionTo was not called');
  });
});
