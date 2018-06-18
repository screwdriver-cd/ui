import { resolve, reject } from 'rsvp';
import EmberObject from '@ember/object';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

import injectSessionStub from '../../../helpers/inject-session';
import injectScmServiceStub from '../../../helpers/inject-scm';

let testCollection;

moduleForComponent('collection-view', 'Integration | Component | collection view', {
  integration: true,
  beforeEach() {
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
          scmUri: 'github.com:54321879:master',
          createTime: '2017-01-05T00:55:46.775Z',
          admins: {
            username: true
          },
          workflow: ['main'],
          scmRepo: {
            name: 'screwdriver-cd/zzz',
            branch: 'master',
            url: 'https://github.com/screwdriver-cd/zzz/tree/master'
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
  }
});

test('it renders', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const $ = this.$;

  injectScmServiceStub(this);

  this.set('mockCollection', testCollection);

  this.render(hbs`{{collection-view collection=mockCollection}}`);
  const nameText = $('.header__name').text().trim();
  const descriptionText = $('.header__description').text().trim();

  assert.equal(nameText, 'Test');
  assert.equal(descriptionText, 'Test Collection');
  assert.equal($('table').length, 1);
  assert.equal($('th.app-id').text().trim(), 'Name');
  assert.equal($('th.branch').text().trim(), 'Branch');
  assert.equal($('th.account').text().trim(), 'Account');
  assert.equal($('th.health').text().trim(), 'Last Build');
  assert.equal($('th.prs').text().trim(), 'Pull Requests');
  assert.equal($('tr').length, 6);
  // The pipelines are sorted in alphabetical order by default by the component
  assert.equal($($('td.app-id').get(0)).text().trim(), 'screwdriver-cd/models');
  assert.equal($($('td.app-id').get(1)).text().trim(), 'screwdriver-cd/screwdriver');
  assert.equal($($('td.app-id').get(2)).text().trim(), 'screwdriver-cd/ui');
  assert.equal($($('td.app-id').get(3)).text().trim(), 'screwdriver-cd/zzz');
  // The models pipeline has scm display names
  assert.equal($($('td.account').get(0)).text().trim(), 'bitbucket.org');
  assert.equal($($('td.account').get(1)).text().trim(), 'github.com');
  assert.equal($($('td.account').get(2)).text().trim(), 'github.com');
  assert.equal($($('td.account').get(3)).text().trim(), 'bitbucket.org');
  // The pipeline health
  assert.ok($('td.health i').hasClass('build-success'));
  assert.ok($('td.health i').hasClass('build-failure'));
  assert.ok($('td.health i').hasClass('build-unstable'));
  // The models pipeline should not have any info for prs open and failing
  assert.equal($($('td.prs--open').get(0)).text().trim(), '');
  assert.equal($($('td.prs--failing').get(0)).text().trim(), '');
  // The screwdriver pipeline should not have any info for prs open and failing
  assert.equal($($('td.prs--open').get(1)).text().trim(), '');
  assert.equal($($('td.prs--failing').get(1)).text().trim(), '');
  // The ui pipeline should have 2 prs open and 1 failing
  assert.equal($($('td.prs--open').get(2)).text().trim(), '2');
  assert.equal($($('td.prs--failing').get(2)).text().trim(), '1');
});

test('it removes a pipeline from a collection', function (assert) {
  assert.expect(2);

  injectSessionStub(this);
  const $ = this.$;
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

  this.render(hbs`
    {{collection-view
        collection=mockCollection
        onPipelineRemove=onPipelineRemoveMock
    }}
  `);

  // Delete the models pipeline
  $($('.collection-pipeline__remove').get(0)).click();
});

test('it fails to remove a pipeline', function (assert) {
  assert.expect(1);

  injectSessionStub(this);
  const $ = this.$;
  const pipelineRemoveMock = () => reject({
    errors: [{
      detail: 'User does not have permission'
    }]
  });

  this.set('mockCollection', testCollection);
  this.set('onPipelineRemoveMock', pipelineRemoveMock);

  this.render(hbs`
    {{collection-view
        collection=mockCollection
        onPipelineRemove=onPipelineRemoveMock
    }}
  `);

  $($('.collection-pipeline__remove').get(0)).click();

  assert.strictEqual($('.alert-warning > span').text().trim(),
    'User does not have permission');
});

test('it does not show remove button if user is not logged in', function (assert) {
  assert.expect(1);

  const $ = this.$;

  this.set('mockCollection', testCollection);
  this.render(hbs`{{collection-view collection=mockCollection}}`);

  assert.strictEqual($('.collection-pipeline__remove').length, 0);
});

test('it sorts by last build', function (assert) {
  const $ = this.$;

  this.set('mockCollection', testCollection);
  this.render(hbs`{{collection-view collection=mockCollection}}`);

  // Initially it is sorted by name
  assert.equal($($('td.app-id').get(0)).text().trim(), 'screwdriver-cd/models');
  assert.equal($($('td.app-id').get(1)).text().trim(), 'screwdriver-cd/screwdriver');

  const lastBuildsAnchor = $('.header__sort-pipelines ul li a').get(1);

  lastBuildsAnchor.click();

  // Now it should be sorted by most recent last build
  assert.equal($($('td.app-id').get(0)).text().trim(), 'screwdriver-cd/screwdriver');
  assert.equal($($('td.app-id').get(1)).text().trim(), 'screwdriver-cd/models');
});
