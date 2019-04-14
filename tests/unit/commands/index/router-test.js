import { resolve } from 'rsvp';
import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

const commandServiceStub = Service.extend({
  getAllCommands() {
    return resolve([
      { id: 3, namespace: 'foo', name: 'foo', version: '3.0.0' },
      { id: 2, namespace: 'foo', name: 'bar', version: '2.0.0' },
      { id: 1, namespace: 'foo', name: 'baz', version: '1.0.0' }
    ]);
  }
});

module('Unix | Route | commands/index', function(hooks) {
  setupTest(hooks);

  // Specify the other units that are required for this test.
  // needs: ['controller:foo']
  hooks.beforeEach(function beforeEach() {
    this.owner.register('service:command', commandServiceStub);
  });

  test('it dedupes the commands by namespace and name', function (assert) {
    let route = this.owner.lookup('route:commands/index');

    assert.ok(route);

    return route.model().then((commands) => {
      assert.equal(commands.length, 3);
    });
  });
});
