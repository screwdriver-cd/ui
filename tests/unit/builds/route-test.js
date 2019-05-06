import EmberObject from '@ember/object';
import Service from '@ember/service';
import { Promise as EmberPromise } from 'rsvp';

import { module, test } from 'qunit';

import { setupTest } from 'ember-qunit';
import sinonTest from 'ember-sinon-qunit/test-support/test';

module('Unit | Route | builds', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    const route = this.owner.lookup('route:builds');

    assert.ok(route);
  });

  sinonTest('it redirects', function(assert) {
    const route = this.owner.lookup('route:builds');
    const transitionStub = this.stub(route, 'transitionTo');

    const model = {
      pipeline: { id: 1 },
      build: { id: 2 }
    };

    route.redirect(model);

    assert.ok(transitionStub.calledOnce, 'transitionTo was called once');
    assert.ok(transitionStub.calledWithExactly('pipeline.build', 1, 2), 'transition to pipeline');
  });

  test('it fetches pipeline & build', function(assert) {
    const dataMapping = {
      build_2: { type: 'build', jobId: 'jid', id: 2 },
      job_jid: { type: 'job', id: 'jid', pipelineId: 1 },
      pipeline_1: { type: 'job', id: 1 }
    };

    const storeStub = Service.extend({
      findRecord(type, id) {
        return new EmberPromise(resolve =>
          resolve(EmberObject.create(dataMapping[`${type}_${id}`]))
        );
      }
    });

    this.owner.unregister('service:store');
    this.owner.register('service:store', storeStub);

    const route = this.owner.lookup('route:builds');

    return route.model({ build_id: 2 }).then(data => {
      const { build, pipeline } = data;

      assert.equal(pipeline.id, 1);
      assert.equal(build.id, 2);
    });
  });
});
