import EmberObject from '@ember/object';
import { moduleFor, test } from 'ember-qunit';
import sinonTest from 'ember-sinon-qunit/test-support/test';

moduleFor('route:pipeline/build', 'Unit | Route | pipeline/build', {
  // Specify the other units that are required for this test.
  needs: ['service:session']
});

test('it exists', function (assert) {
  let route = this.subject();

  assert.ok(route);
  assert.equal(route.titleToken({
    job: EmberObject.create({ name: 'main' }),
    build: EmberObject.create({ sha: 'abcd1234567890', truncatedSha: 'abcd123' })
  }), 'main > #abcd123');
});

sinonTest('it redirects if build not found', function (assert) {
  const route = this.subject();
  const stub = this.stub(route, 'transitionTo');
  const jobId = 345;
  const pipelineId = 123;
  const model = {
    pipeline: {
      get: type => (type === 'id' ? pipelineId : null)
    },
    job: {
      get: type => (type === 'id' ? jobId : null)
    }
  };

  route.afterModel(model);

  assert.ok(stub.calledOnce, 'transitionTo was called once');
  assert.ok(stub.calledWithExactly('pipeline', pipelineId), 'transition to pipeline');
});

sinonTest('it redirects if not step route', function (assert) {
  const route = this.subject();
  const stub = this.stub(route, 'transitionTo');

  const buildId = 345;
  const pipelineId = 123;

  const transition = { targetName: 'pipeline.build.index' };

  const model = {
    pipeline: {
      get: type => (type === 'id' ? pipelineId : null)
    },
    build: {
      get: type => (type === 'id' ? buildId : null),
      steps: []
    }
  };

  route.redirect(model, transition);

  model.build.steps = [
    { startTime: 's', endTime: 'e', name: 'error', code: 1 }
  ];

  route.redirect(model, transition);

  assert.ok(stub.calledOnce, 'transitionTo was called once');
  assert.ok(
    stub.calledWithExactly('pipeline.build.step', pipelineId, buildId, 'error'),
    'transition to build step page'
  );
});
