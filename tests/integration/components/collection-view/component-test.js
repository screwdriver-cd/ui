import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';

import injectSessionStub from '../../../helpers/inject-session';

let testCollection;

moduleForComponent('collection-view', 'Integration | Component | collection view', {
  integration: true,
  beforeEach() {
    testCollection = Ember.Object.create({
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
          workflow: ['main', 'publish'],
          scmRepo: {
            name: 'screwdriver-cd/screwdriver',
            branch: 'master',
            url: 'https://github.com/screwdriver-cd/screwdriver/tree/master'
          },
          annotations: {}
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
          annotations: {}
        }
      ]
    });
  }
});

test('it renders', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const $ = this.$;

  this.set('mockCollection', testCollection);

  this.render(hbs`{{collection-view collection=mockCollection}}`);
  const nameText = $('.header h2').text().trim();
  const descriptionText = $('.header p').text().trim();

  assert.equal(nameText, 'Test');
  assert.equal(descriptionText, 'Test Collection');
  assert.equal($('table').length, 1);
  assert.equal($('th.app-id').text().trim(), 'Name');
  assert.equal($('th.branch').text().trim(), 'Branch');
  assert.equal($('tr').length, 3);
  assert.equal($($('td.app-id').get(0)).text().trim(), 'screwdriver-cd/screwdriver');
  assert.equal($($('td.app-id').get(1)).text().trim(), 'screwdriver-cd/ui');
});

test('it removes a pipeline from a collection', function (assert) {
  assert.expect(2);

  injectSessionStub(this);
  const $ = this.$;
  const pipelineRemoveMock = (pipelineId, collectionId) => {
    assert.strictEqual(pipelineId, 1);
    assert.strictEqual(collectionId, 1);

    return Ember.RSVP.resolve({
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

  $($('.collection-pipeline__remove').get(0)).click();
});

test('it fails to remove a pipeline', function (assert) {
  assert.expect(1);

  injectSessionStub(this);
  const $ = this.$;
  const pipelineRemoveMock = () => Ember.RSVP.reject({
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
