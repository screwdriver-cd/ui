import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import sinon from 'sinon';

module('Unit | Route | templates/job/detail/version', function (hooks) {
  setupTest(hooks);
  const data = {
    templateData: [
      { id: 4, name: 'baz', version: '10.0.0', namespace: 'foo' },
      { id: 3, name: 'baz', version: '2.0.0', namespace: 'foo' },
      { id: 2, name: 'baz', version: '1.1.0', namespace: 'foo' },
      { id: 1, name: 'baz', version: '1.0.0', namespace: 'foo' }
    ],
    templateTagData: [
      {
        id: 4,
        name: 'baz',
        version: '10.0.0',
        tag: 'latest',
        namespace: 'foo',
        metrics: { jobs: { count: 1 }, builds: { count: 3 } }
      },
      {
        id: 3,
        name: 'baz',
        version: '2.0.0',
        tag: 'stable',
        namespace: 'foo',
        metrics: { jobs: { count: 0 }, builds: { count: 0 } }
      },
      {
        id: 2,
        name: 'baz',
        version: '1.1.0',
        namespace: 'foo',
        metrics: { jobs: { count: 7 }, builds: { count: 9 } }
      },
      {
        id: 1,
        name: 'baz',
        version: '1.0.0',
        namespace: 'foo',
        metrics: { jobs: { count: 0 }, builds: { count: 0 } }
      }
    ]
  };

  test('it asks for the template for a given exist version', function (assert) {
    const route = this.owner.lookup('route:templates/job/detail/version');

    route.modelFor = () => {
      return data;
    };
    const controller = this.owner.lookup('controller:templates/job/detail');

    assert.ok(route);

    route.model({ version: '1.0.0' });

    assert.equal(controller.versionOrTagFromUrl, '1.0.0');
  });

  test('it asks for the template for a given exist version of according to ember', function (assert) {
    const route = this.owner.lookup('route:templates/job/detail/version');

    route.modelFor = () => {
      return data;
    };
    const controller = this.owner.lookup('controller:templates/job/detail');

    assert.ok(route);

    route.model({ version: '1' });

    assert.equal(controller.versionOrTagFromUrl, '1.1.0');
  });

  test('it asks for the template for a given exist tag', function (assert) {
    const route = this.owner.lookup('route:templates/job/detail/version');

    route.modelFor = () => {
      return data;
    };
    const controller = this.owner.lookup('controller:templates/job/detail');

    assert.ok(route);

    route.model({ version: 'stable' });

    assert.equal(controller.versionOrTagFromUrl, 'stable');
  });

  test('it asks for the template for a given name and non-exist version', async function (assert) {
    const route = this.owner.lookup('route:templates/job/detail/version');

    route.modelFor = () => {
      return data;
    };

    const stub = sinon.stub();

    const routerServiceMock = Service.extend({
      transitionTo: stub
    });

    this.owner.unregister('service:router');
    this.owner.register('service:router', routerServiceMock);

    assert.ok(route);
    await assert.rejects(route.model({ version: '9.9.9' }));
    assert.true(stub.notCalled);
  });

  test('it asks for the template for a given name and non-exist tag', async function (assert) {
    const route = this.owner.lookup('route:templates/job/detail/version');

    route.modelFor = () => {
      return data;
    };

    const stub = sinon.stub();

    const routerServiceMock = Service.extend({
      transitionTo: stub
    });

    this.owner.unregister('service:router');
    this.owner.register('service:router', routerServiceMock);

    assert.ok(route);
    await assert.rejects(route.model({ version: 'foo' }));
    assert.true(stub.notCalled);
  });
});
