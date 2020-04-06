import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import sinonTest from 'ember-sinon-qunit/test-support/test';

module('Unit | Route | pipeline/build/artifacts/detail', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    let route = this.owner.lookup('route:pipeline/build/artifacts/detail');

    assert.ok(route);
  });

  sinonTest('it sets selected artifact', function(assert) {
    assert.expect(2);
    const route = this.owner.lookup('route:pipeline/build/artifacts/detail');
    const controller = this.owner.lookup('controller:pipeline/build');
    const stub = this.stub(controller, 'set');
    const params = {
      file_path: 'picture/cat.jpg'
    };

    route.model(params);

    assert.ok(stub.calledOnce, 'set was called once');
    assert.ok(stub.calledWithExactly('selectedArtifact', 'picture/cat.jpg'), 'set artifact');
  });
});
