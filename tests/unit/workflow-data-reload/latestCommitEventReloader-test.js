import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import LatestCommitEventReloader from 'screwdriver-ui/workflow-data-reload/latestCommitEventReloader';
import sinon from 'sinon';

module(
  'Unit | Service | workflowDataReload | BuildsDataReloader',
  function (hooks) {
    setupTest(hooks);

    test('fetchDataForId returns response', async function (assert) {
      const shuttle = this.owner.lookup('service:shuttle');
      const pipelineId = 123;
      const fakeResponse = sinon.fake();

      const latestCommitEventReloader = new LatestCommitEventReloader(shuttle);

      latestCommitEventReloader.setPipelineId(pipelineId);
      sinon.stub(shuttle, 'fetchFromApi').resolves(fakeResponse);

      const response = await latestCommitEventReloader.fetchDataForId(
        pipelineId
      );

      assert.equal(response, fakeResponse);
    });

    test('fetchDataForId returns null when no commit event exists', async function (assert) {
      const shuttle = this.owner.lookup('service:shuttle');
      const pipelineId = 123;

      const latestCommitEventReloader = new LatestCommitEventReloader(shuttle);

      latestCommitEventReloader.setPipelineId(pipelineId);
      sinon.stub(shuttle, 'fetchFromApi').rejects();

      const response = await latestCommitEventReloader.fetchDataForId(
        pipelineId
      );

      assert.equal(response, null);
    });
  }
);
