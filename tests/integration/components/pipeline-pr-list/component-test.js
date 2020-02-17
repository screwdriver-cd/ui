import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | pipeline pr list', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    const jobs = [
      EmberObject.create({
        id: 'abcd',
        name: 'PR-1234:main',
        createTimeWords: 'now',
        title: 'update readme',
        username: 'anonymous',
        builds: [
          {
            id: '1234',
            status: 'SUCCESS'
          }
        ]
      }),
      EmberObject.create({
        id: 'efgh',
        name: 'revert',
        createTimeWords: 'now',
        title: 'revert PR-1234',
        username: 'suomynona',
        builds: [
          {
            id: '1235',
            status: 'FAILURE'
          }
        ]
      })
    ];

    this.set('jobsMock', jobs);

    await render(hbs`{{pipeline-pr-list jobs=jobsMock}}`);

    assert.dom('.view .view .detail').exists({ count: 2 });
    assert.dom('.title').hasText('update readme');
    assert.dom('.by').hasText('anonymous');
  });

  test('it renders start build for restricted PR pipeline', async function(assert) {
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
    this.set('stopPRBuilds', Function.prototype);

    await render(hbs`{{pipeline-pr-list
      jobs=jobsMock
      isRestricted=isRestricted
      startBuild=startBuild
      stopPRBuilds=stopPRBuilds}}`);

    assert.dom('.prsStop').doesNotExist();
    assert.dom('.view .view .detail').doesNotExist();
    assert.dom('.title').hasText('update readme');
    assert.dom('.by').hasText('anonymous');
    assert.dom('.view .startButton').exists({ count: 1 });
  });

  test('it renders PR stop button', async function(assert) {
    const jobs = [
      EmberObject.create({
        id: 'abcd',
        name: 'PR-1234:main',
        createTimeWords: 'now',
        title: 'update readme',
        username: 'anonymous',
        builds: [
          {
            id: '1235',
            status: 'RUNNING',
            endTime: null
          }
        ]
      })
    ];

    this.set('jobsMock', jobs);
    this.set('isRestricted', true);
    this.set('startBuild', Function.prototype);
    this.set('stopPRBuilds', Function.prototype);

    await render(hbs`{{pipeline-pr-list
      jobs=jobsMock
      isRestricted=isRestricted
      startBuild=startBuild
      stopPRBuilds=stopPRBuilds}}`);

    assert.dom('.prsStop').exists({ count: 1 });
    assert.dom('.view .view .detail').exists({ count: 1 });
    assert.dom('.title').hasText('update readme');
    assert.dom('.by').hasText('anonymous');
  });
});
