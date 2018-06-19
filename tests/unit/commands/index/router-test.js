import { resolve } from 'rsvp';
import Service from '@ember/service';
import { moduleFor, test } from 'ember-qunit';

const createTime = '2016-09-23T16:53:00.274Z';
const commandServiceStub = Service.extend({
  getAllCommands() {
    return resolve([
      { id: 3, namespace: 'foo', name: 'bar', version: '3.0.0', createTime },
      { id: 2, namespace: 'foo', name: 'bar', version: '2.0.0', createTime },
      { id: 1, namespace: 'foo', name: 'baz', version: '1.0.0', createTime }
    ]);
  }
});

moduleFor('route:commands/index', 'Unix | Route | commands/index', {
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']
  beforeEach: function beforeEach() {
    this.register('service:command', commandServiceStub);
  }
});

test('it dedupes the commands by namespace and name', function (assert) {
  let route = this.subject();
  const commandCreateTime = new Date(createTime).getTime();

  assert.ok(route);

  return route.model().then((commands) => {
    assert.equal(commands.length, 2);
    assert.equal(commands[0].lastUpdated,
      `${humanizeDuration(Date.now() - commandCreateTime, { round: true, largest: 1 })} ago`);
  });
});
