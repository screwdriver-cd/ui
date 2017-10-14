import { run } from '@ember/runloop';
import { moduleForModel, test } from 'ember-qunit';

moduleForModel('pipeline', 'Unit | Model | pipeline', {
  // Specify the other units that are required for this test.
  needs: ['model:secret', 'model:event', 'model:job']
});

test('it exists', function (assert) {
  let model = this.subject();

  assert.ok(!!model);
});

test('it gets correct appId', function (assert) {
  let model = this.subject();

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

test('it gets correct hub url', function (assert) {
  let model = this.subject();

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

test('it gets correct branch', function (assert) {
  let model = this.subject();

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
