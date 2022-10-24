import { run } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Pretender from 'pretender';
let server;

module('Unit | Serializer | collection', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    server = new Pretender();
  });

  hooks.afterEach(function () {
    server.shutdown();
  });

  test('it serializes records', function (assert) {
    const record = run(() =>
      this.owner.lookup('service:store').createRecord('collection')
    );

    const serializedRecord = record.serialize();

    assert.ok(serializedRecord);
  });

  test('it does not post with model name as key', async function (assert) {
    assert.expect(2);
    server.post('http://localhost:8080/v4/collections', function () {
      return [200, {}, JSON.stringify({ id: 123 })];
    });

    const collection = this.owner
      .lookup('service:store')
      .createRecord('collection', {
        name: 'Screwdriver',
        description: 'Collection of screwdriver pipelines'
      });

    await collection.save();

    assert.equal(collection.get('id'), 123);

    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.deepEqual(payload, {
      name: 'Screwdriver',
      description: 'Collection of screwdriver pipelines'
    });
  });

  test('it serializes only dirty fields', async function (assert) {
    assert.expect(1);
    server.put('http://localhost:8080/v4/collections/123', function () {
      return [200, {}, JSON.stringify({ id: 123 })];
    });

    this.owner.lookup('service:store').push({
      data: {
        id: 123,
        type: 'collection',
        attributes: {
          name: 'Screwdriver',
          description: 'Collection of screwdriver pipelines'
        }
      }
    });

    const collection = this.owner
      .lookup('service:store')
      .peekRecord('collection', 123);

    collection.set('description', 'newDescription');

    await collection.save();

    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.deepEqual(payload, {
      description: 'newDescription'
    });
  });
});
