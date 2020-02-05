import { resolve, reject } from 'rsvp';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click, findAll } from '@ember/test-helpers';
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

module('Integration | Component | collection add button', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    this.set('collections', [EmberObject.create(mockCollection)]);
    this.set('pipeline', { id: 1 });
    this.set('onAddToCollection', true);

    await render(hbs`{{collection-dropdown
      collections=collections
      pipeline=pipeline
      onAddToCollection=onAddToCollection
    }}`);

    // the button should be there
    assert.dom('.dropdown-toggle').exists({ count: 1 });

    await click('.dropdown-toggle');

    // there should be two list items ('Test' and 'CREATE')
    assert.dom('.dropdown-menu > li').exists({ count: 2 });

    // Validate that list items exist
    assert.dom('.dropdown-menu > li:nth-child(1)').hasText('Test');
    assert.dom('.dropdown-menu > li:nth-child(2)').hasText('CREATE');
  });

  test('it does not render default collection', async function(assert) {
    const collections = [
      EmberObject.create({
        id: 1,
        name: 'collection1',
        description: 'description1',
        pipelineIds: [2, 3],
        type: 'default'
      }),
      EmberObject.create({
        id: 2,
        name: 'collection2',
        description: 'description2',
        pipelineIds: []
      })
    ];

    this.set('collections', collections);
    this.set('pipeline', { id: 1 });
    this.set('onAddToCollection', true);

    await render(hbs`{{collection-dropdown
      collections=collections
      pipeline=pipeline
      onAddToCollection=onAddToCollection
    }}`);

    // the button should be there
    assert.dom('.dropdown-toggle').exists({ count: 1 });

    await click('.dropdown-toggle');

    // there should be two list items ('collection2' and 'CREATE')
    assert.dom('.dropdown-menu > li').exists({ count: 2 });

    // Validate that list items exist
    assert.dom('.dropdown-menu > li:nth-child(1)').hasText('collection2');
    assert.dom('.dropdown-menu > li:nth-child(2)').hasText('CREATE');
  });

  test('it adds a pipeline to a collection', async function(assert) {
    assert.expect(2);

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

    await render(hbs`
      {{search-list
        pipelines=pipelineList
        collections=collections
        addToCollection=addToCollection
      }}
    `);

    await click(findAll('.dropdown-toggle')[0]);
    await click('td.add .dropdown-menu span');
  });

  test('it fails to add a pipeline to a collection', async function(assert) {
    assert.expect(1);

    injectSessionStub(this);
    injectScmServiceStub(this);

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

    await render(hbs`
      {{search-list
        pipelines=pipelineList
        collections=collections
        addToCollection=addToCollection
      }}
    `);

    await click(findAll('.dropdown-toggle')[0]);
    await click('td.add .dropdown-menu span');
  });
});
