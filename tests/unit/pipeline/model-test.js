import { run } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Model | pipeline', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    let model = run(() => this.owner.lookup('service:store').createRecord('pipeline'));

    assert.ok(!!model);
  });

  test('it gets correct appId', function(assert) {
    let model = run(() => this.owner.lookup('service:store').createRecord('pipeline'));

    run(() => {
      const scmRepoMock = {
        name: 'foo/bar',
        branch: 'master',
        url: 'https://github.com/foo/bar'
      };

      model.set('scmRepo', scmRepoMock);

      assert.equal(model.get('appId'), 'foo/bar');
    });
  });

  test('it gets correct hub url', function(assert) {
    let model = run(() => this.owner.lookup('service:store').createRecord('pipeline'));

    run(() => {
      const scmRepoMock = {
        name: 'foo/bar',
        branch: 'master',
        url: 'https://github.com/foo/bar'
      };

      model.set('scmRepo', scmRepoMock);

      assert.equal(model.get('hubUrl'), 'https://github.com/foo/bar');
    });
  });

  test('it gets correct branch', function(assert) {
    let model = run(() => this.owner.lookup('service:store').createRecord('pipeline'));

    run(() => {
      const scmRepoMock = {
        name: 'foo/bar',
        branch: 'master',
        url: 'https://github.com/foo/bar'
      };

      model.set('scmRepo', scmRepoMock);

      assert.equal(model.get('branch'), 'master');
    });
  });
});
