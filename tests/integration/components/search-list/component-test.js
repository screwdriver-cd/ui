import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';

moduleForComponent('search-list', 'Integration | Component | search list', {
  integration: true
});

test('it renders', function (assert) {
  const $ = this.$;
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const pipelines = [
    Ember.Object.create({
      id: 1,
      appId: 'foo/bar',
      branch: 'master'
    }),
    Ember.Object.create({
      id: 2,
      appId: 'batman/tumbler',
      branch: 'waynecorp'
    })
  ];
  const collections = [
    Ember.Object.create({
      id: 1,
      name: 'collection1',
      description: 'description1',
      pipelineIds: [1, 2, 3]
    }),
    Ember.Object.create({
      id: 2,
      name: 'collection2',
      description: 'description2',
      pipelineIds: [4, 5, 6]
    })
  ];

  this.set('pipelineList', pipelines);
  this.set('collections', collections);

  this.render(hbs`{{search-list pipelines=pipelineList collections=collections}}`);

  assert.equal($($('td.appId').get(0)).text().trim(), 'batman/tumbler');
  assert.equal($($('td.branch').get(0)).text().trim(), 'waynecorp');
  assert.equal($($('td.appId').get(1)).text().trim(), 'foo/bar');
  assert.equal($($('td.branch').get(1)).text().trim(), 'master');
  assert.equal($('.add-to-collection').length, 2);
  assert.equal($($('td.add .dropdown-menu span').get(0)).text().trim(), 'collection1');
  assert.equal($($('td.add .dropdown-menu span').get(1)).text().trim(), 'collection2');
  assert.equal($($('td.add .dropdown-menu span').get(2)).text().trim(), 'collection1');
  assert.equal($($('td.add .dropdown-menu span').get(3)).text().trim(), 'collection2');
});

test('it filters the list', function (assert) {
  const $ = this.$;
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const pipelines = [
    Ember.Object.create({
      id: 1,
      appId: 'foo/bar',
      branch: 'master'
    }),
    Ember.Object.create({
      id: 2,
      appId: 'batman/tumbler',
      branch: 'waynecorp'
    })
  ];

  this.set('pipelineList', pipelines);
  this.set('q', 'foo');

  this.render(hbs`{{search-list pipelines=pipelineList query=q}}`);

  assert.ok($('tr').length, 2);
  assert.equal($('td.appId').text().trim(), 'foo/bar');
  assert.equal($('td.branch').text().trim(), 'master');
});

test('it filters the list by single advanced search query', function (assert) {
  const $ = this.$;
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const pipelines = [
    Ember.Object.create({
      id: 1,
      appId: 'foo/bar',
      branch: 'master'
    }),
    Ember.Object.create({
      id: 2,
      appId: 'batman/tumbler',
      branch: 'waynecorp'
    })
  ];

  this.set('pipelineList', pipelines);
  this.set('q', 'branch:master');

  this.render(hbs`{{search-list pipelines=pipelineList query=q}}`);

  assert.ok($('tr').length, 2);
  assert.equal($('td.appId').text().trim(), 'foo/bar');
  assert.equal($('td.branch').text().trim(), 'master');
});

test('it filters the list by multiple advanced search queries', function (assert) {
  const $ = this.$;
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const pipelines = [
    Ember.Object.create({
      id: 1,
      appId: 'foo/bar',
      branch: 'master'
    }),
    Ember.Object.create({
      id: 2,
      appId: 'batman/tumbler',
      branch: 'waynecorp'
    })
  ];

  this.set('pipelineList', pipelines);
  this.set('q', 'branch:corp appId:tumbler');

  this.render(hbs`{{search-list pipelines=pipelineList query=q}}`);

  assert.ok($('tr').length, 2);
  assert.equal($('td.appId').text().trim(), 'batman/tumbler');
  assert.equal($('td.branch').text().trim(), 'waynecorp');
});

test('it adds a pipeline to a collection', function (assert) {
  assert.expect(3);

  const $ = this.$;
  const pipelines = [
    Ember.Object.create({
      id: 1,
      appId: 'foo/bar',
      branch: 'master'
    }),
    Ember.Object.create({
      id: 2,
      appId: 'batman/tumbler',
      branch: 'waynecorp'
    })
  ];
  const collections = [
    Ember.Object.create({
      id: 1,
      name: 'collection1',
      description: 'description1',
      pipelineIds: [2, 3]
    }),
    Ember.Object.create({
      id: 2,
      name: 'collection2',
      description: 'description2',
      pipelineIds: []
    })
  ];
  const addToCollectionMock = (pipelineId, collectionId) => {
    assert.strictEqual(pipelineId, 2);
    assert.strictEqual(collectionId, 1);

    return Ember.RSVP.resolve({
      id: 1,
      name: 'collection1',
      description: 'description1',
      pipelineIds: [1, 2, 3]
    });
  };

  this.set('pipelineList', pipelines);
  this.set('collections', collections);
  this.set('onAddToCollection', addToCollectionMock);

  this.render(hbs`
    {{search-list
      pipelines=pipelineList
      collections=collections
      onAddToCollection=onAddToCollection
    }}
  `);

  $($('td.add .dropdown-menu span').get(0)).click();

  assert.strictEqual($('.alert-success > span').text().trim(),
    'Successfully added Pipeline to collection1');
});

test('it fails to add a pipeline to a collection', function (assert) {
  assert.expect(1);

  const $ = this.$;
  const pipelines = [
    Ember.Object.create({
      id: 1,
      appId: 'foo/bar',
      branch: 'master'
    })
  ];
  const collections = [
    Ember.Object.create({
      id: 1,
      name: 'collection1',
      description: 'description1',
      pipelineIds: [2, 3]
    })
  ];
  const addToCollectionMock = () => Ember.RSVP.reject();

  this.set('pipelineList', pipelines);
  this.set('collections', collections);
  this.set('onAddToCollection', addToCollectionMock);

  this.render(hbs`
    {{search-list
      pipelines=pipelineList
      collections=collections
      onAddToCollection=onAddToCollection
    }}
  `);

  $($('td.add .dropdown-menu span').get(0)).click();

  assert.strictEqual($('.alert-warning > span').text().trim(),
    'Could not add Pipeline to collection1');
});
