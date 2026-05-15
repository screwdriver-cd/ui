import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, render } from '@ember/test-helpers';
import { authenticateSession } from 'ember-simple-auth/test-support';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/jobs/table/cell/actions',
  function (hooks) {
    setupRenderingTest(hooks);

    const pipelineId = 123;

    let pipelinePageState;

    let shuttleStub;

    hooks.beforeEach(async function () {
      await authenticateSession({ username: 'test-user' });

      pipelinePageState = this.owner.lookup('service:pipeline-page-state');
      const shuttle = this.owner.lookup('service:shuttle');

      sinon
        .stub(pipelinePageState, 'getPipeline')
        .returns({ id: pipelineId, state: 'ACTIVE', parameters: {} });
      sinon.stub(pipelinePageState, 'getJobs').returns([]);
      sinon.stub(pipelinePageState, 'getIsPr').returns(false);
      pipelinePageState.route = 'v2.pipeline.jobs';
      shuttleStub = sinon.stub(shuttle, 'fetchFromApi').resolves({});
    });

    test('it renders', async function (assert) {
      const job = { id: 123, name: 'main', state: 'ENABLED' };

      this.setProperties({
        record: {
          job,
          onCreate: () => {},
          onDestroy: () => {}
        }
      });

      await render(
        hbs`<Pipeline::Jobs::Table::Cell::Actions
            @record={{this.record}}
        />`
      );

      assert.dom('button').exists({ count: 3 });
    });

    test('it renders with start and restart modals', async function (assert) {
      const job = { id: 123, name: 'main', state: 'ENABLED' };
      const event = {
        sha: 'abc123def456',
        commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
        creator: { name: 'batman' },
        meta: {}
      };

      this.setProperties({
        record: {
          job,
          event,
          canStartFromView: true,
          onCreate: () => {},
          onDestroy: () => {}
        }
      });

      await render(
        hbs`<Pipeline::Jobs::Table::Cell::Actions
            @record={{this.record}}
        />`
      );
      assert.dom('button').exists({ count: 3 });
      await click('button:nth-of-type(1)');
      assert.dom('.modal-title').hasText('Are you sure you want to start?');

      await click('button:nth-of-type(3)');
      assert.dom('.modal-title').hasText('Are you sure you want to restart?');
    });

    test('it does not fetch an event for start without an event context', async function (assert) {
      const job = { id: 123, name: 'main', state: 'ENABLED' };

      this.setProperties({
        record: {
          job,
          canStartFromView: true,
          onCreate: () => {},
          onDestroy: () => {}
        }
      });

      await render(
        hbs`<Pipeline::Jobs::Table::Cell::Actions
            @record={{this.record}}
        />`
      );

      await click('button:nth-of-type(1)');

      assert.dom('.modal-title').hasText('Are you sure you want to start?');
      assert.strictEqual(shuttleStub.callCount, 0);
      assert.dom('#confirm-action-commit').doesNotExist();
    });

    test('it uses the provided event for start without fetching', async function (assert) {
      const job = { id: 123, name: 'main', state: 'ENABLED' };
      const event = {
        id: 456,
        sha: 'abc123def456',
        commit: {
          url: 'https://example.com',
          message: 'Latest commit message'
        },
        meta: {}
      };

      this.setProperties({
        record: {
          job,
          event,
          canStartFromView: true,
          onCreate: () => {},
          onDestroy: () => {}
        }
      });

      await render(
        hbs`<Pipeline::Jobs::Table::Cell::Actions
            @record={{this.record}}
        />`
      );

      await click('button:nth-of-type(1)');

      assert.strictEqual(shuttleStub.callCount, 0);
      assert.dom('#confirm-action-commit').exists({ count: 1 });
    });

    test('it fetches an event for restart without an event context', async function (assert) {
      const job = { id: 123, name: 'main', state: 'ENABLED' };
      const build = { id: 999, meta: {} };
      const latestEvent = {
        id: 456,
        sha: 'abc123def456',
        commit: {
          url: 'https://example.com',
          message: 'Latest commit message'
        },
        meta: {}
      };
      const latestCommitEvent = { sha: 'abc123def456' };

      shuttleStub.withArgs('get', '/builds/999').resolves({ eventId: 456 });
      shuttleStub.withArgs('get', '/events/456').resolves(latestEvent);
      shuttleStub
        .withArgs('get', `/pipelines/${pipelineId}/latestCommitEvent`)
        .resolves(latestCommitEvent);

      this.setProperties({
        record: {
          job,
          build,
          canStartFromView: true,
          onCreate: () => {},
          onDestroy: () => {}
        }
      });

      await render(
        hbs`<Pipeline::Jobs::Table::Cell::Actions
            @record={{this.record}}
        />`
      );

      await click('button:nth-of-type(3)');

      assert.true(shuttleStub.calledWith('get', '/builds/999'));
      assert.true(shuttleStub.calledWith('get', '/events/456'));
      assert.dom('.modal-title').hasText('Are you sure you want to restart?');
    });

    test('it starts from latest commit after closing a restart modal', async function (assert) {
      const job = {
        id: 123,
        name: 'main',
        state: 'ENABLED',
        permutations: [{}]
      };
      const build = { id: 999, meta: {} };
      const restartEvent = {
        id: 456,
        groupEventId: 789,
        sha: 'abc123def456',
        commit: {
          url: 'https://example.com',
          message: 'Latest commit message'
        },
        meta: {}
      };
      const latestCommitEvent = { sha: 'abc123def456' };

      shuttleStub.withArgs('get', '/builds/999').resolves({ eventId: 456 });
      shuttleStub.withArgs('get', '/events/456').resolves(restartEvent);
      shuttleStub
        .withArgs('get', `/pipelines/${pipelineId}/latestCommitEvent`)
        .resolves(latestCommitEvent);
      shuttleStub.withArgs('post', '/events').resolves({ id: 1000 });

      this.setProperties({
        record: {
          job,
          build,
          canStartFromView: true,
          onCreate: () => {},
          onDestroy: () => {}
        }
      });

      await render(
        hbs`<Pipeline::Jobs::Table::Cell::Actions
            @record={{this.record}}
        />`
      );

      await click('button:nth-of-type(3)');
      await click('.modal-header .close');

      shuttleStub.resetHistory();

      await click('button:nth-of-type(1)');
      await click('#submit-action');

      assert.true(
        shuttleStub.calledWith('post', '/events', {
          pipelineId,
          causeMessage: 'Manually started by test-user',
          startFrom: job.name,
          startAction: 'START_FROM_LATEST_COMMIT'
        })
      );
    });
  }
);
