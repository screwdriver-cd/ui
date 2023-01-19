import { resolve } from 'rsvp';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import EmberObject, { get } from '@ember/object';
import sinonTest from 'ember-sinon-qunit/test-support/test';
import sinon from 'sinon';
import Service from '@ember/service';
import { settled } from '@ember/test-helpers';
import injectSessionStub from '../../../helpers/inject-session';

module('Unit | Controller | dashboard/show', function (hooks) {
  setupTest(hooks);

  // Replace this with your real tests.
  test('it exists', function (assert) {
    injectSessionStub(this);
    const controller = this.owner.lookup('controller:dashboard/show');

    assert.ok(controller);
  });

  test('it calls removePipeline', async function (assert) {
    injectSessionStub(this);
    const controller = this.owner.lookup('controller:dashboard/show');

    const shuttleStub = Service.extend({
      removePipeline(collectionId, pipelineId) {
        assert.ok(true, 'relovePipeline called');
        assert.equal(pipelineId, 3);
        assert.equal(collectionId, 1);

        return resolve({});
      }
    });

    this.owner.unregister('service:shuttle');
    this.owner.register('service:shuttle', shuttleStub);

    let pipelineIds = [1, 2, 3];

    const mock = EmberObject.create({
      id: 2,
      name: 'collection1',
      description: 'description1',
      pipelineIds,
      save() {
        assert.deepEqual(get(this, 'pipelineIds'), [1, 2]);

        return resolve(this);
      }
    });

    controller.set('model', {
      collection: {
        id: 2
      }
    });

    controller.set('store', {
      findRecord(modelName, collectionId) {
        assert.strictEqual(modelName, 'collection');
        assert.strictEqual(collectionId, 2);

        return resolve(mock);
      }
    });

    const removePipelineActionStub = sinon.spy(
      controller.actions,
      'removePipeline'
    );

    await settled();

    // Remove pipeline with id 3 from collection with id 1
    controller.send('removePipeline', 3, 1);

    assert.ok(
      removePipelineActionStub.calledOnce,
      'action removePipeline called once'
    );
  });

  sinonTest('it calls onDeleteCollection', function (assert) {
    const controller = this.owner.lookup('controller:dashboard/show');
    const stub = this.stub(controller, 'transitionToRoute');

    controller.send('onDeleteCollection');

    assert.ok(stub.calledOnce, 'transitionToRoute was called once');
    assert.ok(stub.calledWithExactly('home'), 'transition to home');
  });
});
