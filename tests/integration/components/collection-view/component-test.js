import { resolve, reject } from 'rsvp';
import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click, findAll } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

import injectSessionStub from '../../../helpers/inject-session';
import injectScmServiceStub from '../../../helpers/inject-scm';

let testCollection;

module('Integration | Component | collection view', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
    testCollection = EmberObject.create({
      id: 1,
      name: 'Test',
      description: 'Test Collection',
      pipelines: [
        {
          id: 1,
          scmUri: 'github.com:12345678:master',
          createTime: '2017-01-05T00:55:46.775Z',
          admins: {
            username: true
          },
          workflow: ['main'],
          scmRepo: {
            name: 'screwdriver-cd/screwdriver',
            branch: 'master',
            url: 'https://github.com/screwdriver-cd/screwdriver/tree/master'
          },
          scmContext: 'github:github.com',
          annotations: {},
          lastEventId: 12,
          lastBuilds: [
            {
              id: 123,
              status: 'SUCCESS',
              // Most recent build
              createTime: '2017-09-05T04:02:20.890Z'
            }
          ]
        },
        {
          id: 2,
          scmUri: 'github.com:87654321:master',
          createTime: '2017-01-05T00:55:46.775Z',
          admins: {
            username: true
          },
          workflow: ['main', 'publish'],
          scmRepo: {
            name: 'screwdriver-cd/ui',
            branch: 'master',
            url: 'https://github.com/screwdriver-cd/ui/tree/master'
          },
          scmContext: 'github:github.com',
          annotations: {},
          prs: {
            open: 2,
            failing: 1
          }
        },
        {
          id: 3,
          scmUri: 'github.com:54321876:master',
          createTime: '2017-01-05T00:55:46.775Z',
          admins: {
            username: true
          },
          workflow: ['main'],
          scmRepo: {
            name: 'screwdriver-cd/models',
            branch: 'master',
            url: 'https://github.com/screwdriver-cd/models/tree/master'
          },
          scmContext: 'bitbucket:bitbucket.org',
          annotations: {},
          lastEventId: 23,
          lastBuilds: [
            {
              id: 125,
              status: 'FAILURE',
              // 2nd most recent build
              createTime: '2017-09-05T04:01:41.789Z'
            }
          ]
        },
        {
          id: 4,
          scmUri: 'github.com:54321879:master:lib',
          createTime: '2017-01-05T00:55:46.775Z',
          admins: {
            username: true
          },
          workflow: ['main'],
          scmRepo: {
            name: 'screwdriver-cd/zzz',
            branch: 'master',
            url: 'https://github.com/screwdriver-cd/zzz/tree/master',
            rootDir: 'lib'
          },
          scmContext: 'bitbucket:bitbucket.org',
          annotations: {},
          lastEventId: 23,
          lastBuilds: [
            {
              id: 125,
              status: 'UNSTABLE',
              createTime: '2017-09-05T04:01:41.789Z'
            }
          ]
        }
      ]
    });
  });

  test('it renders', async function(assert) {
    injectScmServiceStub(this);

    this.set('mockCollection', testCollection);

    await render(hbs`{{collection-view collection=mockCollection}}`);

    assert.dom('.header__name').hasText('Test');
    assert.dom('.header__description').hasText('Test Collection');
    assert.dom('table').exists({ count: 1 });
    assert.dom('th.app-id').hasText('Name');
    assert.dom('th.branch').hasText('Branch');
    assert.dom('th.account').hasText('Account');
    assert.dom('th.health').hasText('Last Build');
    assert.dom('th.prs').hasText('Pull Requests');
    assert.dom('tr').exists({ count: 6 });
    assert.dom('.fa-pencil').exists({ count: 2 });

    // The pipelines are sorted in alphabetical order by default by the component
    const appIdEls = findAll('td.app-id');

    assert.dom(appIdEls[0]).hasText('screwdriver-cd/models');
    assert.dom(appIdEls[1]).hasText('screwdriver-cd/screwdriver');
    assert.dom(appIdEls[2]).hasText('screwdriver-cd/ui');
    assert.dom(appIdEls[3]).hasText('screwdriver-cd/zzz');

    // The pipelines are sorted in alphabetical order by default by the component
    const branchEls = findAll('td.branch');

    assert.dom(branchEls[0]).hasText('master');
    assert.dom(branchEls[1]).hasText('master');
    assert.dom(branchEls[2]).hasText('master');
    assert.dom(branchEls[3]).hasText('master#lib');

    // The models pipeline has scm display names
    const accountEls = findAll('td.account');

    assert.dom(accountEls[0]).hasText('bitbucket.org');
    assert.dom(accountEls[1]).hasText('github.com');
    assert.dom(accountEls[2]).hasText('github.com');
    assert.dom(accountEls[3]).hasText('bitbucket.org');

    // The pipeline health
    const healthEls = findAll('td.health i');

    assert.dom(healthEls[0]).hasClass('build-failure');
    assert.dom(healthEls[1]).hasClass('build-success');
    assert.dom(healthEls[3]).hasClass('build-unstable');

    const openEls = findAll('td.prs--open');
    const failingEls = findAll('td.prs--failing');

    // The models pipeline should not have any info for prs open and failing
    assert.dom(openEls[0]).hasText('');
    assert.dom(failingEls[0]).hasText('');

    // The screwdriver pipeline should not have any info for prs open and failing
    assert.dom(openEls[1]).hasText('');
    assert.dom(failingEls[1]).hasText('');

    // The ui pipeline should have 2 prs open and 1 failing
    assert.dom(openEls[2]).hasText('2');
    assert.dom(failingEls[2]).hasText('1');
  });

  test('it removes a pipeline from a collection', async function(assert) {
    assert.expect(2);

    injectSessionStub(this);

    const pipelineRemoveMock = (pipelineId, collectionId) => {
      // Make sure the models pipeline is the one being removed
      assert.strictEqual(pipelineId, 3);
      assert.strictEqual(collectionId, 1);

      return resolve({
        id: 1,
        name: 'collection1',
        description: 'description1',
        pipelineIds: [1],
        pipelines: [
          {
            id: 1,
            scmUri: 'github.com:12345678:master',
            createTime: '2017-01-05T00:55:46.775Z',
            admins: {
              username: true
            },
            workflow: ['main', 'publish'],
            scmRepo: {
              name: 'screwdriver-cd/screwdriver',
              branch: 'master',
              url: 'https://github.com/screwdriver-cd/screwdriver/tree/master'
            },
            scmContext: 'github:github.com',
            annotations: {}
          }
        ]
      });
    };

    this.set('mockCollection', testCollection);
    this.set('onPipelineRemoveMock', pipelineRemoveMock);

    await render(hbs`
      {{collection-view
          collection=mockCollection
          onPipelineRemove=onPipelineRemoveMock
      }}
    `);

    // Delete the models pipeline
    await click('.collection-pipeline__remove');
  });

  test('it fails to remove a pipeline', async function(assert) {
    assert.expect(1);

    injectSessionStub(this);

    const pipelineRemoveMock = () =>
      reject({
        errors: [
          {
            detail: 'User does not have permission'
          }
        ]
      });

    this.set('mockCollection', testCollection);
    this.set('onPipelineRemoveMock', pipelineRemoveMock);

    await render(hbs`
      {{collection-view
          collection=mockCollection
          onPipelineRemove=onPipelineRemoveMock
      }}
    `);

    await click('.collection-pipeline__remove');

    assert.dom('.alert-warning > span').hasText('User does not have permission');
  });

  test('it does not show remove button if user is not logged in', async function(assert) {
    assert.expect(1);

    this.set('mockCollection', testCollection);

    await render(hbs`{{collection-view collection=mockCollection}}`);

    assert.dom('.collection-pipeline__remove').doesNotExist();
  });

  test('it sorts by last build', async function(assert) {
    this.set('mockCollection', testCollection);
    await render(hbs`{{collection-view collection=mockCollection}}`);

    let appIdEls = findAll('td.app-id');

    // Initially it is sorted by name
    assert.dom(appIdEls[0]).hasText('screwdriver-cd/models');
    assert.dom(appIdEls[1]).hasText('screwdriver-cd/screwdriver');

    await click('.header__sort-pipelines .dropdown-toggle');
    await click(findAll('.header__sort-pipelines ul li a')[1]);

    appIdEls = findAll('td.app-id');

    // Now it should be sorted by most recent last build
    assert.dom(appIdEls[0]).hasText('screwdriver-cd/screwdriver');
    assert.dom(appIdEls[1]).hasText('screwdriver-cd/models');
  });

  test('description is editable', async function(assert) {
    this.set('mockCollection', testCollection);
    await render(hbs`{{collection-view collection=mockCollection}}`);

    const editEls = findAll('.fa-pencil');

    await click(editEls[1]);
    await click(editEls[0]);

    assert.dom('textarea').exists({ count: 1 });
    assert.dom('input').exists({ count: 1 });
  });
});
