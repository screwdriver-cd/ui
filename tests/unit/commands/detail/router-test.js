import { resolve } from 'rsvp';
import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import sinon from 'sinon';

const commandServiceStub = Service.extend({
  getOneCommand(namespace, name) {
    return resolve([
      { id: 4, namespace, name, version: '10.0.0' },
      { id: 3, namespace, name, version: '2.0.0' },
      { id: 2, namespace, name, version: '1.1.0' },
      { id: 1, namespace, name, version: '1.0.0' }
    ]);
  },
  getCommandTags(namespace, name) {
    return resolve([
      { id: 4, namespace, name, version: '10.0.0', tag: 'latest' },
      { id: 3, namespace, name, version: '2.0.0', tag: 'stable' },
      { id: 2, namespace, name, version: '1.1.0' },
      { id: 1, namespace, name, version: '1.0.0' }
    ]);
  }
});

module('Unit | Route | commands/detail', function (hooks) {
  setupTest(hooks);

  // Specify the other units that are required for this test.
  // needs: ['controller:foo']
  hooks.beforeEach(function beforeEach() {
    this.owner.register('service:command', commandServiceStub);
  });

  test('it asks for the list of commands for a given namespace and name without version', function (assert) {
    const route = this.owner.lookup('route:commands/detail');

    assert.ok(route);

    return route.model({ namespace: 'foo', name: 'bar' }).then(commands => {
      assert.equal(commands.commandData[0].name, 'bar');
      assert.equal(commands.commandData[0].namespace, 'foo');
      assert.equal(commands.commandData[0].tag, 'latest');
      assert.equal(commands.versionOrTagFromUrl, undefined);
    });
  });

  test('it asks for the list of commands for a given name and exist version', function (assert) {
    const route = this.owner.lookup('route:commands/detail');

    assert.ok(route);

    return route
      .model({ namespace: 'foo', name: 'baz', version: '1.0.0' })
      .then(commands => {
        assert.equal(commands.commandData.length, 4);
        assert.equal(commands.commandData[0].namespace, 'foo');
        assert.equal(commands.commandData[0].name, 'baz');
        assert.equal(commands.versionOrTagFromUrl, '1.0.0');
      });
  });

  test('it asks for the list of commands for a given name and exist version of according to ember', function (assert) {
    const route = this.owner.lookup('route:commands/detail');

    assert.ok(route);

    return route
      .model({ namespace: 'foo', name: 'baz', version: '1' })
      .then(commands => {
        assert.equal(commands.commandData.length, 4);
        assert.equal(commands.commandData[0].namespace, 'foo');
        assert.equal(commands.commandData[0].name, 'baz');
        assert.equal(commands.versionOrTagFromUrl, '1.1.0');
      });
  });

  test('it asks for the list of commands for a given name and exist tag', function (assert) {
    const route = this.owner.lookup('route:commands/detail');

    assert.ok(route);

    return route
      .model({ namespace: 'foo', name: 'baz', version: 'stable' })
      .then(commands => {
        assert.equal(commands.commandData.length, 4);
        assert.equal(commands.commandData[0].namespace, 'foo');
        assert.equal(commands.commandData[0].name, 'baz');
        assert.equal(commands.versionOrTagFromUrl, 'stable');
      });
  });

  test('it asks for the list of commands for a given name and non-exist version', function (assert) {
    const route = this.owner.lookup('route:commands/detail');
    const stub = sinon.stub();

    assert.ok(route);

    const routerServiceMock = Service.extend({
      transitionTo: stub
    });

    this.owner.unregister('service:router');
    this.owner.register('service:router', routerServiceMock);

    return route
      .model({ namespace: 'foo', name: 'baz', version: '9.9.9' })
      .then(() => {
        assert.ok(stub.calledOnce, 'transitionTo was called once');
      });
  });

  test('it asks for the list of commands for a given name and non-exist tag', function (assert) {
    const route = this.owner.lookup('route:commands/detail');
    const stub = sinon.stub();

    assert.ok(route);

    const routerServiceMock = Service.extend({
      transitionTo: stub
    });

    this.owner.unregister('service:router');
    this.owner.register('service:router', routerServiceMock);

    return route
      .model({ namespace: 'foo', name: 'baz', version: 'foo' })
      .then(() => {
        assert.ok(stub.calledOnce, 'transitionTo was called once');
      });
  });
});
