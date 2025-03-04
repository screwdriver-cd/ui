import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import StageBuildsDataReloader from 'screwdriver-ui/workflow-data-reload/stageBuildsDataReloader';
import sinon from 'sinon';

module(
  'Unit | Service | workflowDataReload | StageBuildsDataReloader',
  function (hooks) {
    setupTest(hooks);

    const EVENT_ID = 765;
    const STAGE_BUILDS = [
      {
        id: 111,
        status: 'SUCCESS',
        stageId: 43,
        eventId: EVENT_ID
      },
      {
        id: 222,
        status: 'RUNNING',
        stageId: 44,
        eventId: EVENT_ID
      }
    ];

    test('fetchDataForId calls sets build status correctly', async function (assert) {
      const shuttle = this.owner.lookup('service:shuttle');
      const buildsDataReloader = new StageBuildsDataReloader(shuttle);

      sinon.stub(shuttle, 'fetchFromApi').resolves(STAGE_BUILDS);

      const builds = await buildsDataReloader.fetchDataForId(EVENT_ID);

      assert.deepEqual(builds, STAGE_BUILDS);
      assert.ok(shuttle.fetchFromApi.calledOnce);
      assert.ok(
        shuttle.fetchFromApi.calledWith(
          'get',
          `/events/${EVENT_ID}/stageBuilds`
        )
      );
    });

    test('getBuildsForEvent returns correct value', async function (assert) {
      const buildsDataReloader = new StageBuildsDataReloader(null);
      const spyResponseCache = sinon.spy(new Map());

      buildsDataReloader.responseCache = spyResponseCache;

      buildsDataReloader.getStageBuildsForEvent(123);

      assert.equal(spyResponseCache.get.calledOnce, true);
    });
  }
);
