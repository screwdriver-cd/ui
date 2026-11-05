import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import {
  authenticateSession,
  invalidateSession
} from 'ember-simple-auth/test-support';
import sinon from 'sinon';

module('Unit | Service | scm', function (hooks) {
  setupTest(hooks);

  const currentContext = 'github:github.com';
  const targetContext = 'github:target.example';
  const pipeline = { id: 123, scmContext: targetContext };

  let scm;

  let getScmStub;

  hooks.beforeEach(async function () {
    await authenticateSession({ scmContext: currentContext });
    scm = this.owner.lookup('service:scm');
    getScmStub = sinon.stub(scm, 'getScm').returns({
      displayName: 'Target SCM',
      readOnly: false
    });
  });

  test('it names the SCM to sign in to', function (assert) {
    assert.strictEqual(
      scm.getScmMismatchMessage(targetContext),
      'To start this pipeline, sign in to Target SCM. Switch accounts from the ACCOUNTS menu in the top-right corner.'
    );
  });

  test('it falls back to the SCM context when the display name is unavailable', function (assert) {
    getScmStub.returns({});

    assert.true(
      scm.getScmMismatchMessage(targetContext).includes(targetContext)
    );
  });

  test('it allows the matching SCM account', function (assert) {
    assert.strictEqual(scm.getScmMismatchMessage(currentContext), '');
    assert.true(scm.canStartPipeline({ id: 456, scmContext: currentContext }));
    assert.strictEqual(scm.startWarning, null);
  });

  test('it allows another SCM account for a read-only SCM', function (assert) {
    getScmStub.returns({ readOnly: true });

    assert.strictEqual(scm.getScmMismatchMessage(targetContext), '');
    assert.true(scm.canStartPipeline(pipeline));
    assert.strictEqual(scm.startWarning, null);
  });

  test('it leaves unauthenticated actions to the existing authentication flow', async function (assert) {
    await invalidateSession();

    assert.strictEqual(scm.getScmMismatchMessage(targetContext), '');
  });

  test('it does not warn when either SCM context is unavailable', async function (assert) {
    assert.strictEqual(scm.getScmMismatchMessage(undefined), '');

    await authenticateSession({ username: 'test-user' });

    assert.strictEqual(scm.getScmMismatchMessage(targetContext), '');
  });

  test('it warns only after a start attempt and associates the warning with the pipeline', function (assert) {
    assert.strictEqual(scm.startWarning, null);
    assert.false(scm.canStartPipeline(pipeline));
    assert.deepEqual(scm.startWarning, {
      pipelineId: pipeline.id,
      message: scm.getScmMismatchMessage(targetContext)
    });
  });

  test('it clears the warning on navigation', function (assert) {
    scm.canStartPipeline(pipeline);

    this.owner.lookup('service:router').trigger('routeDidChange');

    assert.strictEqual(scm.startWarning, null);
  });

  test('it allows a new start attempt after signing in to the target SCM', async function (assert) {
    scm.canStartPipeline(pipeline);
    assert.ok(scm.startWarning);

    await authenticateSession({ scmContext: targetContext });

    assert.true(scm.canStartPipeline(pipeline));
    assert.strictEqual(scm.startWarning, null);
  });

  test('it clears a previous warning when the next start is allowed', function (assert) {
    scm.canStartPipeline(pipeline);

    assert.true(scm.canStartPipeline({ id: 456, scmContext: currentContext }));
    assert.strictEqual(scm.startWarning, null);
  });
});
