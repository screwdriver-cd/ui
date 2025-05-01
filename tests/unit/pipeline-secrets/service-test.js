import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import sinon from 'sinon';

module('Unit | Service | pipeline-secrets', function (hooks) {
  setupTest(hooks);

  let pipelineSecrets;

  let shuttle;

  hooks.beforeEach(function () {
    shuttle = this.owner.lookup('service:shuttle');
    pipelineSecrets = this.owner.lookup('service:pipeline-secrets');

    pipelineSecrets.clear();
  });

  test('it exists', function (assert) {
    assert.ok(pipelineSecrets);
  });

  test('fetchSecrets fetches just pipeline secrets', async function (assert) {
    sinon.stub(shuttle, 'fetchFromApi').resolves([{ name: 'TEST' }]);

    await pipelineSecrets.fetchSecrets(123);

    assert.equal(pipelineSecrets.secrets.size, 1);
    assert.equal(pipelineSecrets.inheritedSecrets.size, 0);
    assert.equal(pipelineSecrets.secretNames.length, 1);
  });

  test('fetchSecrets fetches pipeline and inherited secrets', async function (assert) {
    sinon
      .stub(shuttle, 'fetchFromApi')
      .onCall(0)
      .resolves([{ name: 'PIPELINE' }, { name: 'PARENT' }, { name: 'PARENT2' }])
      .onCall(1)
      .resolves([{ name: 'PARENT' }, { name: 'PARENT2' }]);

    await pipelineSecrets.fetchSecrets(123, 987);

    assert.equal(pipelineSecrets.secrets.size, 3);
    assert.equal(pipelineSecrets.inheritedSecrets.size, 2);
    assert.equal(pipelineSecrets.secretNames.length, 3);
  });

  test('fetchSecrets returns error message', async function (assert) {
    sinon.stub(shuttle, 'fetchFromApi').rejects({ message: 'error' });

    const errorMessage = await pipelineSecrets.fetchSecrets(123);

    assert.equal(pipelineSecrets.secrets.size, 0);
    assert.equal(pipelineSecrets.inheritedSecrets.size, 0);
    assert.equal(pipelineSecrets.secretNames.length, 0);
    assert.equal(errorMessage, 'error');
  });

  test('addSecret adds a new secret correctly', function (assert) {
    pipelineSecrets.addSecret({ name: 'ABC' });

    assert.equal(pipelineSecrets.secrets.size, 1);
    assert.equal(pipelineSecrets.inheritedSecrets.size, 0);
    assert.equal(pipelineSecrets.secretNames.length, 1);
  });

  test('replaceSecret removes a new secret correctly', function (assert) {
    const originalSecret = { name: 'ABC', value: '123' };
    const updatedSecret = { name: 'ABC', value: '456' };

    pipelineSecrets.addSecret(originalSecret);
    pipelineSecrets.replaceSecret(updatedSecret);

    assert.equal(pipelineSecrets.secrets.size, 1);
    assert.equal(pipelineSecrets.inheritedSecrets.size, 0);
    assert.equal(pipelineSecrets.secretNames.length, 1);
    assert.deepEqual(
      pipelineSecrets.secrets.get(updatedSecret.name),
      updatedSecret
    );
  });

  test('deleteSecret removes a secret correctly', async function (assert) {
    const secret = { name: 'ABC', value: 'abc' };
    const inheritedSecret = { name: 'INHERITED', value: 'inherited' };
    const overriddenSecret = { name: 'INHERITED', value: 'overridden' };

    sinon
      .stub(shuttle, 'fetchFromApi')
      .onCall(0)
      .resolves([secret, overriddenSecret])
      .onCall(1)
      .resolves([inheritedSecret]);

    await pipelineSecrets.fetchSecrets(123, 987);

    assert.equal(pipelineSecrets.secrets.size, 2);
    assert.equal(pipelineSecrets.inheritedSecrets.size, 1);
    assert.equal(pipelineSecrets.secretNames.length, 2);
    assert.deepEqual(
      pipelineSecrets.secrets.get(overriddenSecret.name),
      overriddenSecret
    );

    pipelineSecrets.deleteSecret(overriddenSecret);
    assert.equal(pipelineSecrets.secrets.size, 2);
    assert.equal(pipelineSecrets.inheritedSecrets.size, 1);
    assert.equal(pipelineSecrets.secretNames.length, 2);
    assert.deepEqual(
      pipelineSecrets.secrets.get(overriddenSecret.name),
      inheritedSecret
    );

    pipelineSecrets.deleteSecret(secret);
    assert.equal(pipelineSecrets.secrets.size, 1);
    assert.equal(pipelineSecrets.inheritedSecrets.size, 1);
    assert.equal(pipelineSecrets.secretNames.length, 1);
    assert.deepEqual(
      pipelineSecrets.secrets.get(inheritedSecret.name),
      inheritedSecret
    );
  });
});
