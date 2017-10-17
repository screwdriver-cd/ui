import { run } from '@ember/runloop';
import { moduleForModel, test } from 'ember-qunit';
import Pretender from 'pretender';
import wait from 'ember-test-helpers/wait';
let server;

moduleForModel('collection', 'Unit | Serializer | collection', {
  // Specify the other units that are required for this test.
  needs: ['serializer:collection'],
  beforeEach() {
    server = new Pretender();
  },
  afterEach() {
    server.shutdown();
  }
});

test('it serializes records', function (assert) {
  let record = this.subject();
  let serializedRecord = record.serialize();

  assert.ok(serializedRecord);
});

test('it does not post with model name as key', function (assert) {
  assert.expect(2);
  server.post('/collections', function () {
    return [200, {}, JSON.stringify({ collection: { id: 123 } })];
  });

  run(() => {
    const collection = this.store().createRecord('collection', {
      name: 'Screwdriver',
      description: 'Collection of screwdriver pipelines'
    });

    collection.save()
      .then(() => {
        assert.equal(collection.get('id'), 123);
      });
  });

  return wait().then(() => {
    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.deepEqual(payload, {
      name: 'Screwdriver',
      description: 'Collection of screwdriver pipelines'
    });
  });
});

test('it serializes only dirty fields', function (assert) {
  assert.expect(1);
  server.patch('/collections/123', function () {
    return [200, {}, JSON.stringify({ collection: { id: 123 } })];
  });

  run(() => {
    this.store().push({
      data: {
        id: 123,
        type: 'collection',
        attributes: {
          name: 'Screwdriver',
          description: 'Collection of screwdriver pipelines'
        }
      }
    });

    const collection = this.store().peekRecord('collection', 123);

    collection.set('description', 'newDescription');
    collection.save();
  });

  return wait().then(() => {
    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.deepEqual(payload, {
      description: 'newDescription'
    });
  });
});
