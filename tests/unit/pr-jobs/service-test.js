import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import sinon from 'sinon';

module('Unit | Service | pr-jobs', function (hooks) {
  setupTest(hooks);

  let shuttle;

  let pipelinePageState;

  let service;

  let mockJobs;

  hooks.beforeEach(function () {
    service = this.owner.lookup('service:pr-jobs');
    shuttle = this.owner.lookup('service:shuttle');
    pipelinePageState = this.owner.lookup('service:pipeline-page-state');

    mockJobs = [];

    sinon.stub(pipelinePageState, 'getPipelineId').returns(123);
    sinon.stub(shuttle, 'fetchFromApi').returns(mockJobs);
  });

  test('it exists', function (assert) {
    assert.ok(service);
  });

  test('setPullRequestJobs sets pullRequestJobs', async function (assert) {
    mockJobs.push({ id: 1, name: 'PR-1:pull' }, { id: 2, name: 'PR-2:pull' });

    assert.equal(service.pullRequestJobs.length, 0);
    await service.setPullRequestJobs();
    assert.equal(service.pullRequestJobs.length, 2);
  });

  test('setPipelineJobs sets pipelineJobs', async function (assert) {
    mockJobs.push(
      { id: 1, name: 'pull' },
      { id: 2, name: 'main' },
      { id: 3, name: 'deploy' }
    );

    assert.equal(service.pipelineJobs.length, 0);
    await service.setPipelineJobs();
    assert.equal(service.pipelineJobs.length, 3);
  });

  test('setPipelinePageStateJobs sets jobs correctly when no event is provided', function (assert) {
    const pipelinePageStateSpy = sinon.spy(pipelinePageState, 'setJobs');

    service.setPipelinePageStateJobs();

    assert.true(pipelinePageStateSpy.calledOnce);
    assert.equal(pipelinePageState.getJobs().length, 0);
  });

  test('setPipelinePageStateJobs sets jobs correctly when event is provided', function (assert) {
    const pipelinePageStateSpy = sinon.spy(pipelinePageState, 'setJobs');
    const pipelineJobs = [
      { id: 1, name: 'pull-request' },
      { id: 2, name: 'main' }
    ];
    const pullRequestJobs = [{ id: 3, name: 'PR-1:pull-request' }];

    service.pipelineJobs = pipelineJobs;
    service.pullRequestJobs = pullRequestJobs;

    service.setPipelinePageStateJobs({ id: 123, prNum: 1 });

    assert.true(pipelinePageStateSpy.calledOnce);
    assert.equal(pipelinePageState.getJobs().length, 3);
  });
});
