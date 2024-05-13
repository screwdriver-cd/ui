import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import sinon from 'sinon';

module('Unit | Route | pipeline/build/artifacts/index', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const route = this.owner.lookup('route:pipeline/build/artifacts/index');

    assert.ok(route);
  });

  test('it sets selected artifact to manifest if no parameter pass in', function (assert) {
    assert.expect(2);
    const route = this.owner.lookup('route:pipeline/build/artifacts/index');
    const controller = this.owner.lookup('controller:pipeline/build');
    const stub = sinon.stub(controller, 'set');
    const params = {};

    route.model(params);

    assert.ok(stub.calledOnce, 'set was called once');
    assert.ok(
      stub.calledWithExactly('selectedArtifact', 'manifest.txt'),
      'set artifact'
    );
  });
});
