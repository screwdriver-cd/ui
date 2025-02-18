import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import BuildsDataReloader from 'screwdriver-ui/workflow-data-reload/buildsDataReloader';
import sinon from 'sinon';

module(
  'Unit | Service | workflowDataReload | BuildsDataReloader',
  function (hooks) {
    setupTest(hooks);

    test('fetchDataForId calls sets build status correctly', async function (assert) {
      const shuttle = this.owner.lookup('service:shuttle');
      const buildsDataReloader = new BuildsDataReloader(shuttle);

      sinon.stub(shuttle, 'fetchFromApi').resolves([
        {
          id: 111,
          status: 'SUCCESS'
        },
        {
          id: 222,
          status: 'SUCCESS',
          meta: { build: { warning: { message: 'warning!' } } }
        }
      ]);

      const builds = await buildsDataReloader.fetchDataForId(123);

      assert.equal(builds.length, 2);
      assert.equal(builds[0].status, 'SUCCESS');
      assert.equal(builds[1].status, 'WARNING');
    });

    test('getBuildsForEvent returns correct value', async function (assert) {
      const buildsDataReloader = new BuildsDataReloader(null);
      const spyResponseCache = sinon.spy(new Map());

      buildsDataReloader.responseCache = spyResponseCache;

      buildsDataReloader.getBuildsForEvent(123);

      assert.equal(spyResponseCache.get.calledOnce, true);
    });
  }
);
