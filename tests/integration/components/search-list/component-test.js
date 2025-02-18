import EmberObject from '@ember/object';
import { reject, resolve } from 'rsvp';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render, click } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

import injectSessionStub from '../../../helpers/inject-session';
import injectScmServiceStub from '../../../helpers/inject-scm';

module('Integration | Component | search list', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders without collections', async function (assert) {
    injectScmServiceStub(this);

    const pipelines = [
      EmberObject.create({
        id: 2,
        appId: 'batman/tumbler',
        branch: 'waynecorp',
        scmContext: 'bitbucket:bitbucket.org'
      }),
      EmberObject.create({
        id: 1,
        appId: 'foo/bar',
        branch: 'master',
        scmContext: 'github:github.com'
      })
    ];
    const collections = [
      EmberObject.create({
        id: 1,
        name: 'collection1',
        description: 'description1',
        pipelineIds: [1, 2, 3]
      })
    ];

    this.set('pipelineList', pipelines);
    this.set('collections', collections);

    await render(
      hbs`<SearchList @pipelines={{this.pipelineList}} @collections={{this.collections}} />`
    );

    assert.dom('tbody tr:first-child td.appId').hasText('batman/tumbler');
    assert.dom('tbody tr:first-child td.branch').hasText('waynecorp');
    assert.dom('tbody tr:first-child td.account').hasText('bitbucket.org');
    assert.dom('tbody tr:nth-child(2) td.appId').hasText('foo/bar');
    assert.dom('tbody tr:nth-child(2) td.branch').hasText('master');
    assert.dom('tbody tr:nth-child(2) td.account').hasText('github.com');
    assert.dom('.add-to-collection').doesNotExist();
  });

  test('it renders with collections', async function (assert) {
    injectSessionStub(this);
    injectScmServiceStub(this);

    const pipelines = [
      EmberObject.create({
        id: 2,
        appId: 'batman/tumbler',
        branch: 'waynecorp',
        scmContext: 'bitbucket:bitbucket.org'
      }),
      EmberObject.create({
        id: 1,
        appId: 'foo/bar',
        branch: 'master',
        scmContext: 'github:github.com'
      })
    ];
    const collections = [
      EmberObject.create({
        id: 1,
        name: 'collection1',
        description: 'description1',
        pipelineIds: [1, 2, 3]
      }),
      EmberObject.create({
        id: 2,
        name: 'collection2',
        description: 'description2',
        pipelineIds: [4, 5, 6]
      })
    ];

    this.set('pipelineList', pipelines);
    this.set('collections', collections);

    await render(
      hbs`<SearchList @pipelines={{this.pipelineList}} @collections={{this.collections}} />`
    );

    assert.dom('tbody tr:first-child td.appId').hasText('batman/tumbler');
    assert
      .dom('tbody tr:first-child td.appId a')
      .hasAttribute('title', 'batman/tumbler');
    assert.dom('tbody tr:first-child td.branch').hasText('waynecorp');
    assert
      .dom('tbody tr:first-child td.branch a')
      .hasAttribute('title', 'waynecorp');
    assert.dom('tbody tr:first-child td.account').hasText('bitbucket.org');
    assert.dom('tbody tr:nth-child(2) td.appId').hasText('foo/bar');
    assert
      .dom('tbody tr:nth-child(2) td.appId a')
      .hasAttribute('title', 'foo/bar');
    assert.dom('tbody tr:nth-child(2) td.branch').hasText('master');
    assert
      .dom('tbody tr:nth-child(2) td.branch a')
      .hasAttribute('title', 'master');
    assert.dom('tbody tr:nth-child(2) td.account').hasText('github.com');
    assert.dom('.add-to-collection').exists({ count: 2 });

    await click('td.add .dropdown-toggle');

    assert
      .dom('td.add .dropdown-menu li:first-child span')
      .hasText('collection1');
    assert
      .dom('td.add .dropdown-menu li:nth-child(2) span')
      .hasText('collection2');
    assert
      .dom('td.add .dropdown-menu li:nth-child(3) span')
      .hasText('Create CREATE');
  });

  test('it filters the list', async function (assert) {
    injectScmServiceStub(this);

    const pipelines = [
      EmberObject.create({
        id: 1,
        appId: 'foo/bar',
        branch: 'master',
        scmContext: 'github:github.com'
      })
    ];

    this.set('pipelineList', pipelines);
    this.set('q', 'foo');

    await render(
      hbs`<SearchList @pipelines={{this.pipelineList}} @query={{this.q}} />`
    );

    assert.dom('tr').exists({ count: 2 });
    assert.dom('td.appId').hasText('foo/bar');
    assert.dom('td.branch').hasText('master');
    assert.dom('td.account').hasText('github.com');
  });

  test('it toggles showMore button', async function (assert) {
    injectScmServiceStub(this);

    const pipelines = [
      EmberObject.create({
        id: 1,
        appId: 'foo/bar',
        branch: 'master',
        scmContext: 'github:github.com'
      })
    ];

    const updatePipelinesMock = params => {
      if (params.page === 2) {
        return resolve(pipelines);
      }
      if (params.page === 3) {
        this.set('moreToShow', false);

        return resolve([]);
      }

      return reject('This should not run');
    };

    this.set('pipelineList', pipelines);
    this.set('q', 'foo');
    this.set('updatePipelines', updatePipelinesMock);
    this.set('moreToShow', true);

    await render(
      hbs`<SearchList @pipelines={{this.pipelineList}} @query={{this.q}} @moreToShow={{this.moreToShow}} @updatePipelines={{this.updatePipelines}} />`
    );

    assert.dom('tr').exists({ count: 2 });
    assert.dom('.showMore').exists();

    await click('.showMore');
    assert.dom('.showMore').exists();

    await click('.showMore');
    assert.dom('.showMore').doesNotExist();
  });
});
