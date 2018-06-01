import EmberObject from '@ember/object';
import { Promise as EmberPromise } from 'rsvp';

import { moduleFor, test } from 'ember-qunit';
import sinonTest from 'ember-sinon-qunit/test-support/test';

moduleFor('route:builds', 'Unit | Route | builds', {
  // Specify the other units that are required for this test.
  needs: [
    'service:session',
    'service:store'
  ]
});

test('it exists', function (assert) {
  const route = this.subject();

  assert.ok(route);
});

sinonTest('it redirects', function (assert) {
  const route = this.subject();
  const transitionStub = this.stub(route, 'transitionTo');

  const model = {
    pipeline: { id: 1 },
    build: { id: 2 }
  };

  route.redirect(model);

  assert.ok(transitionStub.calledOnce, 'transitionTo was called once');
  assert.ok(transitionStub.calledWithExactly('pipeline.build', 1, 2), 'transition to pipeline');
});

test('it fetches pipeline & build', function (assert) {
  const dataMapping = {
    build_2: { type: 'build', jobId: 'jid', id: 2 },
    job_jid: { type: 'job', id: 'jid', pipelineId: 1 },
    pipeline_1: { type: 'job', id: 1 }
  };

  const storeStub = EmberObject.extend({
    findRecord(type, id) {
      return new EmberPromise(resolve => resolve(EmberObject.create(dataMapping[`${type}_${id}`])));
    }
  });

  this.register('service:store', storeStub);
  this.inject.service('store');

  const route = this.subject();

  return route.model({ build_id: 2 }).then((data) => {
    const { build, pipeline } = data;

    assert.equal(pipeline.id, 1);
    assert.equal(build.id, 2);
  });
});
