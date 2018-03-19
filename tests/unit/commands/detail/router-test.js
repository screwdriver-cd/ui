import { resolve } from 'rsvp';
import Service from '@ember/service';
import { moduleFor, test } from 'ember-qunit';

const commandServiceStub = Service.extend({
  getOneCommand(namespace, name) {
    return resolve([
      { id: 3, namespace, name, version: '3.0.0' },
      { id: 2, namespace, name, version: '2.0.0' },
      { id: 1, namespace, name, version: '1.0.0' }
    ]);
  },
  getCommandTags(namespace, name) {
    return resolve([
      { id: 5, namespace, name, version: '3.0.0', tag: 'latest' },
      { id: 6, namespace, name, version: '3.0.0', tag: 'stable' },
      { id: 7, namespace, name, version: '2.0.0', tag: 'meeseeks' }
    ]);
  }
});

moduleFor('route:commands/detail', 'Unit | Route | commands/detail', {
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']
  beforeEach: function beforeEach() {
    this.register('service:command', commandServiceStub);
  }
});

test('it asks for the list of commands for a given namespace and name', function (assert) {
  let route = this.subject();

  assert.ok(route);

  return route.model({ namespace: 'foo', name: 'bar' }).then((commands) => {
    assert.equal(commands[0].name, 'bar');
    assert.equal(commands[0].namespace, 'foo');
  });
});
