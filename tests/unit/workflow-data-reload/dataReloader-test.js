import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import DataReloader from 'screwdriver-ui/workflow-data-reload/dataReloader';
import sinon from 'sinon';

module('Unit | Service | workflowDataReload | DataReloader', function (hooks) {
  setupTest(hooks);

  test('setPipelineId sets pipelineId correctly', async function (assert) {
    const dataReloader = new DataReloader(null);
    const pipelineId = 123;

    dataReloader.setPipelineId(pipelineId);

    assert.equal(dataReloader.pipelineId, pipelineId);
    assert.equal(dataReloader.idSet.size, 1);
    assert.equal(dataReloader.idSet.has(pipelineId), true);
  });

  test('fetchData calls callback with correct data', async function (assert) {
    const dataReloader = new DataReloader(null);
    const queueName = 'test';
    const id = 123;
    const fakeResponse = sinon.fake();
    const fakeCallback = sinon.spy();

    sinon.stub(dataReloader, 'fetchDataForId').resolves(fakeResponse);

    dataReloader.queueNames.add(queueName);
    dataReloader.callbacks.set(queueName, new Map());
    dataReloader.callbacks.get(queueName).set(id, fakeCallback);
    dataReloader.idSet.add(id);

    await dataReloader.fetchData();

    assert.equal(fakeCallback.calledOnce, true);
    assert.equal(fakeCallback.calledWith(fakeResponse), true);
  });

  test('fetchData caches data correctly', async function (assert) {
    const dataReloader = new DataReloader(null);
    const id = 123;

    sinon.stub(dataReloader, 'fetchDataForId').resolves(sinon.fake());

    dataReloader.idSet.add(id);

    await dataReloader.fetchData();

    assert.equal(dataReloader.responseCache.size, 1);
    assert.equal(dataReloader.responseCache.has(id), 1);
  });

  test('fetchData caches data correctly for single key cache', async function (assert) {
    const cacheKey = 'cacheKey';
    const dataReloader = new DataReloader(null, cacheKey);
    const id = 123;

    sinon.stub(dataReloader, 'fetchDataForId').resolves(sinon.fake());

    dataReloader.idSet.add(id);

    await dataReloader.fetchData();

    assert.equal(dataReloader.responseCache.size, 1);
    assert.equal(dataReloader.responseCache.has(cacheKey), 1);
  });

  test('registerCallback creates a new queue and adds event', function (assert) {
    const dataReloader = new DataReloader(null);
    const queueName = 'test';
    const id = 123;

    dataReloader.registerCallback(queueName, id, () => {});

    assert.equal(dataReloader.callbacks.has(queueName), true);
    assert.equal(dataReloader.callbacks.get(queueName).size, 1);
    assert.equal(dataReloader.queueNames.has(queueName), true);
    assert.equal(dataReloader.idCounts.get(id), 1);
    assert.equal(dataReloader.idSet.has(id), true);
  });

  test('registerCallback adds event to existing queue', function (assert) {
    const dataReloader = new DataReloader(null);
    const queueName = 'test';
    const id1 = 123;
    const id2 = 987;

    dataReloader.registerCallback(queueName, id1, () => {});
    dataReloader.registerCallback(queueName, id2, () => {});

    assert.equal(dataReloader.callbacks.get(queueName).size, 2);
    assert.equal(dataReloader.idCounts.get(id1), 1);
    assert.equal(dataReloader.idCounts.get(id2), 1);
    assert.equal(dataReloader.idSet.has(id1), true);
    assert.equal(dataReloader.idSet.has(id2), true);
  });

  test('registerCallback increments event count', function (assert) {
    const dataReloader = new DataReloader(null);
    const queue1 = 'test';
    const queue2 = 'abc';
    const id1 = 123;
    const id2 = 987;

    dataReloader.registerCallback(queue1, id1, () => {});
    dataReloader.registerCallback(queue2, id1, () => {});
    dataReloader.registerCallback(queue2, id2, () => {});

    assert.equal(dataReloader.callbacks.get(queue1).size, 1);
    assert.equal(dataReloader.callbacks.get(queue2).size, 2);
    assert.equal(dataReloader.idCounts.get(id1), 2);
    assert.equal(dataReloader.idCounts.get(id2), 1);
    assert.equal(dataReloader.idSet.has(id1), true);
    assert.equal(dataReloader.idSet.has(id2), true);
  });

  test('registerCallback does not increment idSet for single key cache', function (assert) {
    const dataReloader = new DataReloader(null, 'key');
    const queue1 = 'test';
    const queue2 = 'abc';
    const id1 = 123;
    const id2 = 987;

    dataReloader.registerCallback(queue1, id1, () => {});
    dataReloader.registerCallback(queue2, id1, () => {});
    dataReloader.registerCallback(queue2, id2, () => {});

    assert.equal(dataReloader.callbacks.get(queue1).size, 1);
    assert.equal(dataReloader.callbacks.get(queue2).size, 2);
    assert.equal(dataReloader.idCounts.size, 2);
    assert.equal(dataReloader.idSet.size, 0);
  });

  test('registerCallback calls callback if response exists in cache', function (assert) {
    const dataReloader = new DataReloader(null);
    const callback = sinon.spy();
    const id = 123;
    const fakeResponse = sinon.fake();

    dataReloader.responseCache.set(id, fakeResponse);

    dataReloader.registerCallback('test', id, callback);
    assert.equal(callback.calledOnce, true);
    assert.equal(callback.calledWith(fakeResponse), true);
  });

  test('registerCallback calls callback if response exists in cache for single key cache', function (assert) {
    const cacheKey = 'cacheKey';
    const dataReloader = new DataReloader(null, cacheKey);
    const id = 123;
    const callback = sinon.spy();
    const fakeResponse = sinon.fake();

    sinon.spy(dataReloader, 'fetchDataForId');
    dataReloader.responseCache.set(cacheKey, fakeResponse);

    dataReloader.registerCallback('test', id, callback);
    assert.equal(callback.calledOnce, true);
    assert.equal(callback.calledWith(fakeResponse), true);
    assert.equal(dataReloader.fetchDataForId.notCalled, true);
  });

  test('registerCallback fetches data if cached response does not exist', async function (assert) {
    const dataReloader = new DataReloader(null);
    const id = 123;
    const callback = sinon.spy();
    const fakeResponse = sinon.fake();

    const fetchDataForIdStub = sinon
      .stub(dataReloader, 'fetchDataForId')
      .resolves(fakeResponse);

    await dataReloader.registerCallback('test', id, callback);
    assert.equal(fetchDataForIdStub.calledOnce, true);
    assert.equal(fetchDataForIdStub.calledWith(id), true);
    assert.equal(callback.calledOnce, true);
    assert.equal(callback.calledWith(fakeResponse), true);
  });

  test('registerCallback caches fetched data if cached response does not exist', async function (assert) {
    const dataReloader = new DataReloader(null);
    const id = 123;
    const callback = sinon.spy();
    const fakeResponse = sinon.fake();

    const fetchDataForIdStub = sinon
      .stub(dataReloader, 'fetchDataForId')
      .resolves(fakeResponse);

    await dataReloader.registerCallback('test', id, callback);
    assert.equal(fetchDataForIdStub.calledOnce, true);
    assert.equal(fetchDataForIdStub.calledWith(id), true);
    assert.equal(callback.calledOnce, true);
    assert.equal(callback.calledWith(fakeResponse), true);
    assert.equal(dataReloader.responseCache.size, 1);
    assert.equal(dataReloader.responseCache.has(id), true);
  });

  test('registerCallback caches fetched data if cached response does not exist for single key cache', async function (assert) {
    const cacheKey = 'cacheKey';
    const dataReloader = new DataReloader(null, cacheKey);
    const id = 123;
    const callback = sinon.spy();
    const fakeResponse = sinon.fake();

    const fetchDataForIdStub = sinon
      .stub(dataReloader, 'fetchDataForId')
      .resolves(fakeResponse);

    await dataReloader.registerCallback('test', id, callback);
    assert.equal(fetchDataForIdStub.calledOnce, true);
    assert.equal(fetchDataForIdStub.calledWith(id), true);
    assert.equal(callback.calledOnce, true);
    assert.equal(callback.calledWith(fakeResponse), true);
    assert.equal(dataReloader.responseCache.size, 1);
    assert.equal(dataReloader.responseCache.has(cacheKey), true);
  });

  test('removeCallback removes event from queue', function (assert) {
    const dataReloader = new DataReloader(null);

    dataReloader.registerCallback('test', 123, () => {});
    dataReloader.registerCallback('test', 987, () => {});
    dataReloader.registerCallback('abc', 987, () => {});

    dataReloader.removeCallback('test', 987);
    assert.equal(dataReloader.callbacks.get('test').size, 1);
    assert.equal(dataReloader.callbacks.get('abc').size, 1);
    assert.equal(dataReloader.callbacks.get('test').has(123), true);
    assert.equal(dataReloader.callbacks.get('abc').has(987), true);
    assert.equal(dataReloader.idSet.size, 2);
    assert.equal(dataReloader.idCounts.size, 2);
    assert.equal(dataReloader.idCounts.get(123), 1);
    assert.equal(dataReloader.idCounts.get(987), 1);
  });

  test('removeCallback removes event from queue for single key cache', function (assert) {
    const dataReloader = new DataReloader(null, 'key');

    dataReloader.registerCallback('test', 123, () => {});
    dataReloader.registerCallback('test', 987, () => {});
    dataReloader.registerCallback('abc', 987, () => {});

    dataReloader.removeCallback('test', 987);
    assert.equal(dataReloader.callbacks.get('test').size, 1);
    assert.equal(dataReloader.callbacks.get('abc').size, 1);
    assert.equal(dataReloader.callbacks.get('test').has(123), true);
    assert.equal(dataReloader.callbacks.get('abc').has(987), true);
    assert.equal(dataReloader.idSet.size, 0);
    assert.equal(dataReloader.idCounts.size, 2);
    assert.equal(dataReloader.idCounts.get(123), 1);
    assert.equal(dataReloader.idCounts.get(987), 1);
  });

  test('removeCallback removes last event in queue correctly', function (assert) {
    const dataReloader = new DataReloader(null);

    dataReloader.registerCallback('test', 123, () => {});
    dataReloader.registerCallback('test', 987, () => {});
    dataReloader.registerCallback('abc', 987, () => {});

    dataReloader.removeCallback('abc', 987);
    assert.equal(dataReloader.callbacks.size, 1);
    assert.equal(dataReloader.callbacks.get('test').size, 2);
    assert.equal(dataReloader.callbacks.has('abc'), false);
    assert.equal(dataReloader.queueNames.has('abc'), false);
    assert.equal(dataReloader.idSet.size, 2);
    assert.equal(dataReloader.idCounts.size, 2);
    assert.equal(dataReloader.idCounts.get(123), 1);
    assert.equal(dataReloader.idCounts.get(987), 1);
  });

  test('removeCallback removes last event correctly', function (assert) {
    const dataReloader = new DataReloader(null);

    dataReloader.registerCallback('test', 123, () => {});
    dataReloader.registerCallback('test', 987, () => {});
    dataReloader.registerCallback('abc', 987, () => {});

    dataReloader.removeCallback('test', 123);
    assert.equal(dataReloader.callbacks.size, 2);
    assert.equal(dataReloader.callbacks.get('test').size, 1);
    assert.equal(dataReloader.callbacks.has('abc'), true);
    assert.equal(dataReloader.queueNames.size, 2);
    assert.equal(dataReloader.idSet.size, 1);
    assert.equal(dataReloader.idCounts.size, 1);
  });

  test('removeCallback removes event in non-existent queue correctly', function (assert) {
    const dataReloader = new DataReloader(null);

    dataReloader.registerCallback('test', 123, () => {});
    dataReloader.registerCallback('test', 987, () => {});
    dataReloader.registerCallback('abc', 987, () => {});

    dataReloader.removeCallback('xyz', 123);
    assert.equal(dataReloader.callbacks.size, 2);
    assert.equal(dataReloader.callbacks.has('test'), true);
    assert.equal(dataReloader.callbacks.has('abc'), true);
    assert.equal(dataReloader.idSet.size, 2);
    assert.equal(dataReloader.idCounts.size, 2);
    assert.equal(dataReloader.idCounts.get(123), 1);
    assert.equal(dataReloader.idCounts.get(987), 2);
  });

  test('removeCallback removes non-existent event in queue correctly', function (assert) {
    const dataReloader = new DataReloader(null);

    dataReloader.registerCallback('test', 123, () => {});
    dataReloader.registerCallback('test', 987, () => {});
    dataReloader.registerCallback('abc', 987, () => {});

    dataReloader.removeCallback('abc', 123);
    assert.equal(dataReloader.callbacks.size, 2);
    assert.equal(dataReloader.callbacks.has('test'), true);
    assert.equal(dataReloader.callbacks.has('abc'), true);
    assert.equal(dataReloader.idSet.size, 2);
    assert.equal(dataReloader.idCounts.size, 2);
    assert.equal(dataReloader.idCounts.get(123), 1);
    assert.equal(dataReloader.idCounts.get(987), 2);
  });

  test('removeCallback does not remove response cache value', function (assert) {
    const dataReloader = new DataReloader(null);
    const queueName = 'test';
    const id = 123;
    const fakeResponse = sinon.fake();

    dataReloader.responseCache.set(id, fakeResponse);
    dataReloader.registerCallback(queueName, id, () => {});

    dataReloader.removeCallback(queueName, id);
    assert.equal(dataReloader.callbacks.size, 0);
    assert.equal(dataReloader.queueNames.size, 0);
    assert.equal(dataReloader.idSet.size, 0);
    assert.equal(dataReloader.idCounts.size, 0);
    assert.equal(dataReloader.responseCache.size, 1);
  });
});
