import { resolve, reject } from 'rsvp';
import { moduleForComponent, test } from 'ember-qunit';
import EmberObject from '@ember/object';
import hbs from 'htmlbars-inline-precompile';
import injectSessionStub from '../../../helpers/inject-session';
import injectScmServiceStub from '../../../helpers/inject-scm';

const mockCollection = {
  id: 1,
  name: 'Test',
  description: 'Test description',
  get: name => name
};

moduleForComponent('collection-dropdown', 'Integration | Component | collection add button', {
  integration: true
});

test('it renders', function (assert) {
  this.set('collections', [EmberObject.create(mockCollection)]);
  this.set('pipeline', { id: 1 });
  this.set('onAddToCollection', true);

  this.render(hbs`{{collection-dropdown
    collections=collections
    pipeline=pipeline
    onAddToCollection=onAddToCollection
  }}`);

  // the button should be there
  assert.equal(this.$('.dropdown-toggle').length, 1);

  // there should be two list items ('Test' and 'CREATE')
  assert.equal(this.$('.dropdown-toggle + ul > li').length, 2);

  // Validate that list items exist
  assert.equal(this.$('.dropdown-toggle + ul > li:nth-child(1)').text().trim(), 'Test');
  assert.equal(this.$('.dropdown-toggle + ul > li:nth-child(2)').text().trim(), 'CREATE');
});

test('it adds a pipeline to a collection', function (assert) {
  assert.expect(2);

  injectSessionStub(this);
  injectScmServiceStub(this);

  const $ = this.$;
  const pipelines = [
    EmberObject.create({
      id: 1,
      appId: 'foo/bar',
      branch: 'master',
      scmContext: 'github:github.com'
    }),
    EmberObject.create({
      id: 2,
      appId: 'batman/tumbler',
      branch: 'waynecorp',
      scmContext: 'bitbucket:bitbucket.org'
    })
  ];
  const collections = [
    EmberObject.create({
      id: 1,
      name: 'collection1',
      description: 'description1',
      pipelineIds: [2, 3]
    }),
    EmberObject.create({
      id: 2,
      name: 'collection2',
      description: 'description2',
      pipelineIds: []
    })
  ];
  const addToCollectionMock = (pipelineId, collectionId) => {
    assert.strictEqual(pipelineId, 2);
    assert.strictEqual(collectionId, 1);

    return resolve({
      id: 1,
      name: 'collection1',
      description: 'description1',
      pipelineIds: [1, 2, 3]
    });
  };

  this.set('pipelineList', pipelines);
  this.set('collections', collections);
  this.set('addToCollection', addToCollectionMock);

  this.render(hbs`
    {{search-list 
      pipelines=pipelineList
      collections=collections
      addToCollection=addToCollection
    }}
  `);

  $($('td.add .dropdown-menu span').get(0)).click();
});

test('it fails to add a pipeline to a collection', function (assert) {
  assert.expect(1);

  injectSessionStub(this);
  injectScmServiceStub(this);

  const $ = this.$;
  const pipelines = [
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
      pipelineIds: [2, 3]
    })
  ];
  const addToCollectionMock = () => {
    assert.ok(true);

    return reject();
  };

  this.set('pipelineList', pipelines);
  this.set('collections', collections);
  this.set('addToCollection', addToCollectionMock);

  this.render(hbs`
    {{search-list 
      pipelines=pipelineList
      collections=collections 
      addToCollection=addToCollection
    }}
  `);

  $($('td.add .dropdown-menu span').get(0)).click();
});
