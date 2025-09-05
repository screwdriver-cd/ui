import { resolve } from 'rsvp';
import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
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

const commandServiceStub2 = Service.extend({
  getOneCommand() {
    return resolve([]);
  },
  getCommandTags() {
    return resolve([]);
  }
});

module('Unit | Route | commands/detail', function (hooks) {
  setupTest(hooks);

  test('it asks for the list of commands for a given namespace and name', function (assert) {
    this.owner.register('service:command', commandServiceStub);
    const route = this.owner.lookup('route:commands/detail');

    assert.ok(route);

    return route.model({ namespace: 'foo', name: 'bar' }).then(commands => {
      assert.equal(commands.commandData[0].name, 'bar');
      assert.equal(commands.commandData[0].namespace, 'foo');
      assert.equal(commands.commandData[0].tag, 'latest');
    });
  });

  test('it asks for the list of commands for a non-exist name', async function (assert) {
    this.owner.register('service:command', commandServiceStub2);
    const route = this.owner.lookup('route:commands/detail');
    const stub = sinon.stub();

    assert.ok(route);

    const routerServiceMock = Service.extend({
      transitionTo: stub
    });

    this.owner.unregister('service:router');
    this.owner.register('service:router', routerServiceMock);

    await assert.rejects(route.model({ namespace: 'foo', name: 'baz' }));
    assert.ok(stub.notCalled);
  });
});
