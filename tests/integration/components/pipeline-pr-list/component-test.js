import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, findAll, find } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | pipeline pr list', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    const jobs = [
      EmberObject.create({
        id: 'abcd',
        name: 'PR-1234:main',
        createTimeWords: 'now',
        title: 'update readme',
        username: 'anonymous',
        builds: [{
          id: '1234',
          status: 'SUCCESS'
        }]
      }),
      EmberObject.create({
        id: 'efgh',
        name: 'revert',
        createTimeWords: 'now',
        title: 'revert PR-1234',
        username: 'suomynona',
        builds: [{
          id: '1235',
          status: 'FAILURE'
        }]
      })
    ];

    this.set('jobsMock', jobs);

    await render(hbs`{{pipeline-pr-list jobs=jobsMock}}`);

    assert.equal(findAll('.view .view .detail').length, 2);
    assert.equal(find('.title').textContent.trim(), 'update readme');
    assert.equal(find('.by').textContent.trim(), 'anonymous');
  });

  test('it renders start build for restricted PR pipeline', async function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    const jobs = [
      EmberObject.create({
        id: 'abcd',
        name: 'PR-1234:main',
        createTimeWords: 'now',
        title: 'update readme',
        username: 'anonymous',
        builds: []
      })
    ];

    this.set('jobsMock', jobs);
    this.set('isRestricted', true);
    this.set('startBuild', Function.prototype);

    await render(hbs`{{pipeline-pr-list
      jobs=jobsMock
      isRestricted=isRestricted
      startBuild=startBuild}}`);

    assert.equal(findAll('.view .view .detail').length, 0);
    assert.equal(find('.title').textContent.trim(), 'update readme');
    assert.equal(find('.by').textContent.trim(), 'anonymous');
    assert.equal(findAll('.view .startButton').length, 1);
  });
});
