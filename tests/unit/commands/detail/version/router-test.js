import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import sinon from 'sinon';

module('Unit | Route | commands/detail/version', function (hooks) {
  setupTest(hooks);
  const data = {
    commandData: [
      { id: 4, namespace: 'foo', name: 'bar', version: '10.0.0' },
      { id: 3, namespace: 'foo', name: 'bar', version: '2.0.0' },
      { id: 2, namespace: 'foo', name: 'bar', version: '1.1.0' },
      { id: 1, namespace: 'foo', name: 'bar', version: '1.0.0' }
    ],
    commandTagData: [
      {
        id: 4,
        namespace: 'foo',
        name: 'bar',
        version: '10.0.0',
        tag: 'latest'
      },
      { id: 3, namespace: 'foo', name: 'bar', version: '2.0.0', tag: 'stable' },
      { id: 2, namespace: 'foo', name: 'bar', version: '1.1.0' },
      { id: 1, namespace: 'foo', name: 'bar', version: '1.0.0' }
    ]
  };

  test('it asks for the command for a given exist version', function (assert) {
    const route = this.owner.lookup('route:commands/detail/version');

    route.modelFor = () => {
      return data;
    };
    const controller = this.owner.lookup('controller:commands/detail');

    assert.ok(route);

    route.model({ version: '1.0.0' });

    assert.equal(controller.versionOrTagFromUrl, '1.0.0');
  });

  test('it asks for the command for a given exist version of according to ember', function (assert) {
    const route = this.owner.lookup('route:commands/detail/version');

    route.modelFor = () => {
      return data;
    };
    const controller = this.owner.lookup('controller:commands/detail');

    assert.ok(route);

    route.model({ version: '1' });

    assert.equal(controller.versionOrTagFromUrl, '1.1.0');
  });

  test('it asks for the command for a given exist tag', function (assert) {
    const route = this.owner.lookup('route:commands/detail/version');

    route.modelFor = () => {
      return data;
    };
    const controller = this.owner.lookup('controller:commands/detail');

    assert.ok(route);

    route.model({ version: 'stable' });

    assert.equal(controller.versionOrTagFromUrl, 'stable');
  });

  test('it asks for the command for a given name and non-exist version', function (assert) {
    const route = this.owner.lookup('route:commands/detail/version');

    route.modelFor = () => {
      return data;
    };
    const stub = sinon.stub();

    assert.ok(route);

    const routerServiceMock = Service.extend({
      transitionTo: stub
    });

    this.owner.unregister('service:router');
    this.owner.register('service:router', routerServiceMock);

    assert.throws(() => route.model({ version: '9.9.9' }));
    assert.ok(stub.notCalled);
  });

  test('it asks for the command for a given name and non-exist tag', function (assert) {
    const route = this.owner.lookup('route:commands/detail/version');

    route.modelFor = () => {
      return data;
    };
    const stub = sinon.stub();

    assert.ok(route);

    const routerServiceMock = Service.extend({
      transitionTo: stub
    });

    this.owner.unregister('service:router');
    this.owner.register('service:router', routerServiceMock);

    assert.throws(() => route.model({ version: 'foo' }));
    assert.ok(stub.notCalled);
  });
});
