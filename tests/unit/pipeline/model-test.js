import { moduleForModel, test } from 'ember-qunit';
import Ember from 'ember';

moduleForModel('pipeline', 'Unit | Model | pipeline', {
  // Specify the other units that are required for this test.
  needs: ['model:secret']
});

test('it exists', function (assert) {
  let model = this.subject();

  assert.ok(!!model);
});

test('it gets correct repo data', function (assert) {
  let model = this.subject();

  Ember.run(() => {
    // http - no branch
    model.set('scmUrl', 'http://example.com:8080/batman/batmobile.git');

    assert.deepEqual(model.get('repoData'), {
      host: 'example.com:8080',
      owner: 'batman',
      repo: 'batmobile',
      branch: 'master'
    });

    // https - with branch
    model.set('scmUrl', 'https://example.com/batman/batmobile.git#ejectorSeat');

    assert.deepEqual(model.get('repoData'), {
      host: 'example.com',
      owner: 'batman',
      repo: 'batmobile',
      branch: 'ejectorSeat'
    });

    // git - with branch
    model.set('scmUrl', 'git@example.com:batman/batmobile.git#ejectorSeat');

    assert.deepEqual(model.get('repoData'), {
      host: 'example.com',
      owner: 'batman',
      repo: 'batmobile',
      branch: 'ejectorSeat'
    });

    // git - no branch
    model.set('scmUrl', 'git@example.com:batman/batmobile.git');

    assert.deepEqual(model.get('repoData'), {
      host: 'example.com',
      owner: 'batman',
      repo: 'batmobile',
      branch: 'master'
    });

    // invalid url
    model.set('scmUrl', 'git@example.com:batman');

    assert.deepEqual(model.get('repoData'), {
      host: undefined,
      owner: undefined,
      repo: undefined,
      branch: undefined
    });
  });
});

test('it gets correct appId', function (assert) {
  let model = this.subject();

  Ember.run(() => {
    // http - no branch
    model.set('scmUrl', 'http://example.com:8080/batman/batmobile.git');

    assert.equal(model.get('appId'), 'batman:batmobile');
  });
});

test('it gets correct hub url', function (assert) {
  let model = this.subject();

  Ember.run(() => {
    // http - no branch
    model.set('scmUrl', 'git@example.com:batman/batmobile.git#oilSlick');

    assert.equal(model.get('hubUrl'), 'https://example.com/batman/batmobile');
  });
});
