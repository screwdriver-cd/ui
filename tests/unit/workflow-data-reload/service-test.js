import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import sinon from 'sinon';

module('Unit | Service | workflowDataReload', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const service = this.owner.lookup('service:workflow-data-reload');

    assert.ok(service);
  });

  test('fetchBuildDataForEvent adds builds to cache', async function (assert) {
    const service = this.owner.lookup('service:workflow-data-reload');
    const shuttle = this.owner.lookup('service:shuttle');
    const eventId = 123;
    const fakeBuilds = [{ id: 999 }];

    sinon.stub(shuttle, 'fetchFromApi').resolves(fakeBuilds);

    await service.fetchBuildDataForEvent(eventId);

    assert.equal(service.buildsCache.size, 1);
    assert.equal(service.buildsCache.has(eventId), true);
    assert.equal(service.buildsCache.get(eventId), fakeBuilds);
  });

  test('fetchBuildDataForEvent calls callbacks correctly', async function (assert) {
    const service = this.owner.lookup('service:workflow-data-reload');
    const shuttle = this.owner.lookup('service:shuttle');
    const eventId = 123;
    const fakeBuilds = [{ id: 999 }];
    const fakeCallback = sinon.spy();
    const fakeLatestCommit = { id: 987 };
    const queueName = 'test';

    service.queueNames.add(queueName);
    service.callbacks.set(queueName, new Map());
    service.callbacks.get(queueName).set(eventId, fakeCallback);
    service.latestCommitResponse = fakeLatestCommit;
    sinon.stub(shuttle, 'fetchFromApi').resolves(fakeBuilds);

    await service.fetchBuildDataForEvent(eventId);

    assert.equal(fakeCallback.calledOnce, true);
    assert.equal(fakeCallback.calledWith(fakeBuilds, fakeLatestCommit), true);
  });

  test('fetchBuilds calls callbacks correctly', async function (assert) {
    const service = this.owner.lookup('service:workflow-data-reload');
    const shuttle = this.owner.lookup('service:shuttle');
    const eventId = 123;
    const fakeBuilds = [{ id: 999 }];
    const fakeCallback = sinon.spy();
    const fakeLatestCommit = { id: 987 };
    const queueName = 'test';

    service.queueNames.add(queueName);
    service.callbacks.set(queueName, new Map());
    service.callbacks.get(queueName).set(eventId, fakeCallback);
    service.latestCommitResponse = fakeLatestCommit;
    service.eventIdSet.add(eventId);
    sinon.stub(shuttle, 'fetchFromApi').resolves(fakeBuilds);

    await service.fetchBuilds();

    assert.equal(fakeCallback.calledOnce, true);
    assert.equal(fakeCallback.calledWith(fakeBuilds, fakeLatestCommit), true);
  });

  test('fetchData calls callback with correct data', async function (assert) {
    const service = this.owner.lookup('service:workflow-data-reload');
    const shuttle = this.owner.lookup('service:shuttle');
    const eventId = 123;
    const fakeBuilds = [{ id: 999 }];
    const fakeCallback = sinon.spy();
    const fakeLatestCommit = { id: 987 };
    const queueName = 'test';

    service.queueNames.add(queueName);
    service.callbacks.set(queueName, new Map());
    service.callbacks.get(queueName).set(eventId, fakeCallback);
    service.latestCommitResponse = fakeLatestCommit;
    service.eventIdSet.add(eventId);
    sinon
      .stub(shuttle, 'fetchFromApi')
      .onFirstCall()
      .resolves(fakeLatestCommit)
      .onSecondCall()
      .resolves(fakeBuilds);

    await service.fetchData();

    assert.equal(fakeCallback.calledOnce, true);
    assert.equal(fakeCallback.calledWith(fakeBuilds, fakeLatestCommit), true);
  });

  test('registerCallback creates a new queue and adds event', function (assert) {
    const service = this.owner.lookup('service:workflow-data-reload');
    const shuttle = this.owner.lookup('service:shuttle');
    const queueName = 'test';

    sinon.stub(shuttle, 'fetchFromApi').resolves([]);
    service.registerCallback(queueName, 123, () => {});

    assert.equal(service.callbacks.has(queueName), true);
    assert.equal(service.callbacks.get(queueName).size, 1);
    assert.equal(service.queueNames.has(queueName), true);
    assert.equal(service.eventIdCounts.get(123), 1);
    assert.equal(service.eventIdSet.has(123), true);
  });

  test('registerCallback adds event to existing queue', function (assert) {
    const service = this.owner.lookup('service:workflow-data-reload');
    const shuttle = this.owner.lookup('service:shuttle');
    const queueName = 'test';

    sinon.stub(shuttle, 'fetchFromApi').resolves([]);

    service.registerCallback(queueName, 123, () => {});
    service.registerCallback(queueName, 987, () => {});

    assert.equal(service.callbacks.get(queueName).size, 2);
    assert.equal(service.eventIdCounts.get(123), 1);
    assert.equal(service.eventIdCounts.get(987), 1);
    assert.equal(service.eventIdSet.has(123), true);
    assert.equal(service.eventIdSet.has(987), true);
  });

  test('registerCallback increments event count', function (assert) {
    const service = this.owner.lookup('service:workflow-data-reload');
    const shuttle = this.owner.lookup('service:shuttle');

    sinon.stub(shuttle, 'fetchFromApi').resolves([]);

    service.registerCallback('test', 123, () => {});
    service.registerCallback('abc', 123, () => {});
    service.registerCallback('abc', 987, () => {});

    assert.equal(service.callbacks.get('test').size, 1);
    assert.equal(service.callbacks.get('abc').size, 2);
    assert.equal(service.eventIdCounts.get(123), 2);
    assert.equal(service.eventIdCounts.get(987), 1);
    assert.equal(service.eventIdSet.has(123), true);
    assert.equal(service.eventIdSet.has(987), true);
  });

  test('registerCallback calls callback if build exists in cache', function (assert) {
    const service = this.owner.lookup('service:workflow-data-reload');
    const callback = sinon.spy();
    const eventId = 123;
    const fakeBuilds = [{ id: 999 }];
    const fakeLatestCommit = { id: 987, sha: 'abc123' };

    service.buildsCache.set(eventId, fakeBuilds);
    service.latestCommitResponse = fakeLatestCommit;

    service.registerCallback('test', eventId, callback);
    assert.equal(callback.calledOnce, true);
    assert.equal(callback.calledWith(fakeBuilds, fakeLatestCommit), true);
  });

  test('registerCallback fetches data if cached response does not exist', async function (assert) {
    const service = this.owner.lookup('service:workflow-data-reload');
    const shuttle = this.owner.lookup('service:shuttle');
    const callback = sinon.spy();
    const eventId = 123;
    const fakeBuilds = [{ id: 999 }];
    const fakeLatestCommit = { id: 987, sha: 'abc123' };

    const stubShuttle = sinon
      .stub(shuttle, 'fetchFromApi')
      .resolves(fakeBuilds);

    service.latestCommitResponse = fakeLatestCommit;

    await service.registerCallback('test', eventId, callback);
    assert.equal(stubShuttle.calledOnce, true);
    assert.equal(callback.calledOnce, true);
    assert.equal(callback.calledWith(fakeBuilds, fakeLatestCommit), true);
  });

  test('removeCallback removes event from queue', function (assert) {
    const service = this.owner.lookup('service:workflow-data-reload');
    const shuttle = this.owner.lookup('service:shuttle');

    sinon.stub(shuttle, 'fetchFromApi').resolves([]);

    service.registerCallback('test', 123, () => {});
    service.registerCallback('test', 987, () => {});
    service.registerCallback('abc', 987, () => {});

    service.removeCallback('test', 987);
    assert.equal(service.callbacks.get('test').size, 1);
    assert.equal(service.callbacks.get('abc').size, 1);
    assert.equal(service.callbacks.get('test').has(123), true);
    assert.equal(service.callbacks.get('abc').has(987), true);
    assert.equal(service.eventIdSet.size, 2);
    assert.equal(service.eventIdCounts.size, 2);
    assert.equal(service.eventIdCounts.get(123), 1);
    assert.equal(service.eventIdCounts.get(987), 1);
  });

  test('removeCallback removes last event in queue correctly', function (assert) {
    const service = this.owner.lookup('service:workflow-data-reload');
    const shuttle = this.owner.lookup('service:shuttle');

    sinon.stub(shuttle, 'fetchFromApi').resolves([]);

    service.registerCallback('test', 123, () => {});
    service.registerCallback('test', 987, () => {});
    service.registerCallback('abc', 987, () => {});

    service.removeCallback('abc', 987);
    assert.equal(service.callbacks.size, 1);
    assert.equal(service.callbacks.get('test').size, 2);
    assert.equal(service.callbacks.has('abc'), false);
    assert.equal(service.queueNames.has('abc'), false);
    assert.equal(service.eventIdSet.size, 2);
    assert.equal(service.eventIdCounts.size, 2);
    assert.equal(service.eventIdCounts.get(123), 1);
    assert.equal(service.eventIdCounts.get(987), 1);
  });

  test('removeCallback removes last event correctly', function (assert) {
    const service = this.owner.lookup('service:workflow-data-reload');
    const shuttle = this.owner.lookup('service:shuttle');

    sinon.stub(shuttle, 'fetchFromApi').resolves([]);

    service.registerCallback('test', 123, () => {});
    service.registerCallback('test', 987, () => {});
    service.registerCallback('abc', 987, () => {});

    service.removeCallback('test', 123);
    assert.equal(service.callbacks.size, 2);
    assert.equal(service.callbacks.get('test').size, 1);
    assert.equal(service.callbacks.has('abc'), true);
    assert.equal(service.queueNames.size, 2);
    assert.equal(service.eventIdSet.size, 1);
    assert.equal(service.eventIdCounts.size, 1);
  });

  test('removeCallback removes event in non-existent queue correctly', function (assert) {
    const service = this.owner.lookup('service:workflow-data-reload');
    const shuttle = this.owner.lookup('service:shuttle');

    sinon.stub(shuttle, 'fetchFromApi').resolves([]);

    service.registerCallback('test', 123, () => {});
    service.registerCallback('test', 987, () => {});
    service.registerCallback('abc', 987, () => {});

    service.removeCallback('xyz', 123);
    assert.equal(service.callbacks.size, 2);
    assert.equal(service.callbacks.has('test'), true);
    assert.equal(service.callbacks.has('abc'), true);
    assert.equal(service.eventIdSet.size, 2);
    assert.equal(service.eventIdCounts.size, 2);
    assert.equal(service.eventIdCounts.get(123), 1);
    assert.equal(service.eventIdCounts.get(987), 2);
  });

  test('removeCallback removes non-existent event in queue correctly', function (assert) {
    const service = this.owner.lookup('service:workflow-data-reload');
    const shuttle = this.owner.lookup('service:shuttle');

    sinon.stub(shuttle, 'fetchFromApi').resolves([]);

    service.registerCallback('test', 123, () => {});
    service.registerCallback('test', 987, () => {});
    service.registerCallback('abc', 987, () => {});

    service.removeCallback('abc', 123);
    assert.equal(service.callbacks.size, 2);
    assert.equal(service.callbacks.has('test'), true);
    assert.equal(service.callbacks.has('abc'), true);
    assert.equal(service.eventIdSet.size, 2);
    assert.equal(service.eventIdCounts.size, 2);
    assert.equal(service.eventIdCounts.get(123), 1);
    assert.equal(service.eventIdCounts.get(987), 2);
  });

  test('removeCallback does not remove builds cache value', function (assert) {
    const service = this.owner.lookup('service:workflow-data-reload');
    const shuttle = this.owner.lookup('service:shuttle');
    const queueName = 'test';
    const eventId = 123;
    const fakeBuilds = [{ id: 999 }];

    sinon.stub(shuttle, 'fetchFromApi').resolves([]);
    service.buildsCache.set(eventId, fakeBuilds);

    service.registerCallback(queueName, eventId, () => {});
    service.removeCallback(queueName, eventId);
    assert.equal(service.callbacks.size, 0);
    assert.equal(service.queueNames.size, 0);
    assert.equal(service.eventIdSet.size, 0);
    assert.equal(service.eventIdCounts.size, 0);
    assert.equal(service.buildsCache.size, 1);
  });
});
