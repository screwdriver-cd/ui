import { resolve } from 'rsvp';
import { A } from '@ember/array';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import sinon from 'sinon';
import Service from '@ember/service';

const updateTrustStub = sinon.stub();

const commandServiceStub = Service.extend({
  deleteCommands() {
    return resolve([204]);
  },
  updateTrust: updateTrustStub.resolves('123')
});

const sessionServiceMock = Service.extend({
  isAuthenticated: true,
  data: {
    authenticated: {
      // fake token for test, it has { username: apple } inside
      // eslint-disable-next-line max-len
      token:
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImFwcGxlIiwic2NvcGUiOlsidXNlciIsImFkbWluIl0sImp0aSI6IjUwNTU0M2E1LTQ4Y2YtNDkwMi1hN2E5LWRmNDUyNTgxY2FjNCIsImlhdCI6MTUyMTU3MjAxOSwiZXhwIjoxNTIxNTc1NjE5fQ.85SkUix6FemFGM5SU6hJ1NzzI0fFS_9JxQw6Qt-Cnsc'
    }
  }
});

module('Unit | Controller | commands/detail', function (hooks) {
  setupTest(hooks);

  // Specify the other units that are required for this test.
  // needs: ['controller:foo']
  hooks.beforeEach(function beforeEach() {
    this.owner.register('service:session', sessionServiceMock);
    this.owner.register('service:command', commandServiceStub);
  });

  test('it parses model properly', function (assert) {
    let controller = this.owner.lookup('controller:commands/detail');

    controller.set('model', {
      commandData: [
        { id: 3, version: '3.0.0', trusted: true, latest: true },
        { id: 2, version: '2.0.0' },
        { id: 1, version: '1.0.0' }
      ],
      commandTagData: [
        { id: 2, version: '2.0.0', tag: 'latest' },
        { id: 1, version: '1.0.0', tag: 'stable' }
      ]
    });

    assert.ok(controller);
    assert.equal(controller.selectedVersion, null);
    assert.equal(controller.get('latest.id'), 3);
    assert.equal(controller.get('versionCommand.id'), 3);
    assert.equal(controller.trusted, true);
  });

  test('it handles version changes', function (assert) {
    let controller = this.owner.lookup('controller:commands/detail');

    controller.set('model', {
      commandData: [
        { id: 3, version: '3.0.0', trusted: true },
        { id: 2, version: '2.0.0' },
        { id: 1, version: '1.0.0' }
      ],
      commandTagData: [
        { id: 2, version: '2.0.0', tag: 'latest' },
        { id: 1, version: '1.0.0', tag: 'stable' }
      ]
    });

    assert.ok(controller);
    assert.equal(controller.selectedVersion, null);
    assert.equal(controller.get('latest.id'), 3);
    assert.equal(controller.get('versionCommand.id'), 3);
  });

  test('it handles model changes', function (assert) {
    let controller = this.owner.lookup('controller:commands/detail');
    // eslint-disable-next-line new-cap
    const arr = A({
      commandData: [
        { id: 3, version: '3.0.0' },
        { id: 2, version: '2.0.0' },
        { id: 1, version: '1.0.0' }
      ]
    });

    controller.set('model', arr);

    assert.ok(controller);
    assert.equal(controller.selectedVersion, null);
    assert.equal(controller.get('versionCommand.id'), 3);
    assert.equal(controller.get('latest.id'), 3);

    arr.commandData.unshiftObject({ id: 4, version: '4.0.0' });
    assert.equal(controller.selectedVersion, null);
    assert.equal(controller.get('versionCommand.id'), 4);
    assert.equal(controller.get('latest.id'), 4);
  });

  test('it handles command deletion', function (assert) {
    let controller = this.owner.lookup('controller:commands/detail');
    // eslint-disable-next-line new-cap
    const arr = A({
      commandData: [
        { id: 3, name: 'sample', version: '3.0.0' },
        { id: 2, name: 'sample', version: '2.0.0' },
        { id: 1, name: 'sample', version: '1.0.0' }
      ]
    });

    controller.set('model', arr);

    assert.ok(controller);

    controller.transitionToRoute = route => {
      assert.equal(route, 'commands');
    };

    controller.send('removeCommand', 'sample');
  });

  test('it handles command update', function (assert) {
    let controller = this.owner.lookup('controller:commands/detail');
    // eslint-disable-next-line new-cap
    const arr = A({
      commandData: [
        { id: 3, name: 'sample', version: '3.0.0' },
        { id: 2, name: 'sample', version: '2.0.0' },
        { id: 1, name: 'sample', version: '1.0.0' }
      ]
    });

    controller.set('model', arr);

    assert.ok(controller);
    assert.ok(controller.isAdmin);

    controller.send('updateTrust', 'sample');
    assert.ok(updateTrustStub.calledOnce);
  });

  test('it handles undefined tag or version', function (assert) {
    let controller = this.owner.lookup('controller:commands/detail');

    controller.set('model', {
      commandData: [
        { id: 3, version: '3.0.0', trusted: true },
        { id: 2, version: '2.0.0' },
        { id: 1, version: '1.0.0' }
      ],
      commandTagData: [
        { id: 2, version: '3.0.0', tag: 'latest' },
        { id: 1, version: '1.0.0', tag: 'stable' }
      ],
      versionOrTagFromUrl: undefined
    });

    assert.ok(controller);
    assert.equal(controller.get('versionCommand.version'), '3.0.0');
  });

  test('it handles a version that is exist', function (assert) {
    let controller = this.owner.lookup('controller:commands/detail');

    controller.set('model', {
      commandData: [
        { id: 3, version: '3.0.0', trusted: true },
        { id: 2, version: '2.0.0' },
        { id: 1, version: '1.0.0' }
      ],
      commandTagData: [
        { id: 2, version: '3.0.0', tag: 'latest' },
        { id: 1, version: '1.0.0', tag: 'stable' }
      ],
      versionOrTagFromUrl: '2.0.0'
    });

    assert.ok(controller);
    assert.equal(controller.get('versionCommand.version'), '2.0.0');
  });

  test('it handles a tag that is exist', function (assert) {
    let controller = this.owner.lookup('controller:commands/detail');

    controller.set('model', {
      commandData: [
        { id: 3, version: '3.0.0', trusted: true },
        { id: 2, version: '2.0.0' },
        { id: 1, version: '1.0.0' }
      ],
      commandTagData: [
        { id: 2, version: '3.0.0', tag: 'latest' },
        { id: 1, version: '1.0.0', tag: 'stable' }
      ],
      versionOrTagFromUrl: 'stable'
    });

    assert.ok(controller);
    assert.equal(controller.get('versionCommand.version'), '1.0.0');
  });

  test('it handles a version that is not exist', function (assert) {
    let controller = this.owner.lookup('controller:commands/detail');

    controller.set('model', {
      commandData: [
        { id: 3, version: '3.0.0', trusted: true },
        { id: 2, version: '2.0.0' },
        { id: 1, version: '1.0.0' }
      ],
      commandTagData: [
        { id: 2, version: '3.0.0', tag: 'latest' },
        { id: 1, version: '1.0.0', tag: 'stable' }
      ],
      versionOrTagFromUrl: '9.9.9'
    });

    assert.ok(controller);
    assert.equal(controller.get('versionCommand.version'), undefined);
  });

  test('it handles a tag that is not exist', function (assert) {
    let controller = this.owner.lookup('controller:commands/detail');

    controller.set('model', {
      commandData: [
        { id: 3, version: '3.0.0', trusted: true },
        { id: 2, version: '2.0.0' },
        { id: 1, version: '1.0.0' }
      ],
      commandTagData: [
        { id: 2, version: '3.0.0', tag: 'latest' },
        { id: 1, version: '1.0.0', tag: 'stable' }
      ],
      versionOrTagFromUrl: 'foo'
    });

    assert.ok(controller);
    assert.equal(controller.get('versionCommand.version'), undefined);
  });
});
