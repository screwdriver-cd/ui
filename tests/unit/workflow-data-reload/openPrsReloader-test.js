import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import OpenPrsReloader from 'screwdriver-ui/workflow-data-reload/openPrsReloader';
import sinon from 'sinon';

module(
  'Unit | Service | workflowDataReload | OpenPrsReloader',
  function (hooks) {
    setupTest(hooks);

    test('fetchDataForId returns response', async function (assert) {
      const shuttle = this.owner.lookup('service:shuttle');
      const pipelineId = 123;

      const openPrsReloader = new OpenPrsReloader(shuttle);

      openPrsReloader.setPipelineId(pipelineId);
      sinon
        .stub(shuttle, 'fetchFromApi')
        .resolves([{ name: 'PR-2' }, { name: 'PR-4' }, { name: 'PR-3' }]);

      const response = await openPrsReloader.fetchDataForId(pipelineId);

      assert.equal(response.length, 3);
      assert.equal(response[0], 2);
      assert.equal(response[1], 3);
      assert.equal(response[2], 4);
    });

    test('getPrNums returns correct value', async function (assert) {
      const openPrsReloader = new OpenPrsReloader(null);
      const spyResponseCache = sinon.spy([1, 2, 3]);

      openPrsReloader.responseCache = spyResponseCache;

      openPrsReloader.getPrNums();

      assert.equal(spyResponseCache.get.calledOnce, true);
    });
  }
);
