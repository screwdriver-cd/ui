import EmberObject from '@ember/object';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

import injectSessionStub from '../../../helpers/inject-session';
import injectScmServiceStub from '../../../helpers/inject-scm';

moduleForComponent('search-list', 'Integration | Component | search list', {
  integration: true
});

test('it renders without collections', function (assert) {
  const $ = this.$;

  injectScmServiceStub(this);

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

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

  this.render(hbs`{{search-list pipelines=pipelineList collections=collections}}`);

  assert.equal($($('td.appId').get(0)).text().trim(), 'batman/tumbler');
  assert.equal($($('td.branch').get(0)).text().trim(), 'waynecorp');
  assert.equal($($('td.account').get(0)).text().trim(), 'bitbucket.org');
  assert.equal($($('td.appId').get(1)).text().trim(), 'foo/bar');
  assert.equal($($('td.branch').get(1)).text().trim(), 'master');
  assert.equal($($('td.account').get(1)).text().trim(), 'github.com');
  assert.equal($('.add-to-collection').length, 0);
});

test('it renders with collections', function (assert) {
  const $ = this.$;

  injectSessionStub(this);
  injectScmServiceStub(this);

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
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

  this.render(hbs`{{search-list pipelines=pipelineList collections=collections}}`);

  assert.equal($($('td.appId').get(0)).text().trim(), 'batman/tumbler');
  assert.equal($($('td.branch').get(0)).text().trim(), 'waynecorp');
  assert.equal($($('td.account').get(0)).text().trim(), 'bitbucket.org');
  assert.equal($($('td.appId').get(1)).text().trim(), 'foo/bar');
  assert.equal($($('td.branch').get(1)).text().trim(), 'master');
  assert.equal($($('td.account').get(1)).text().trim(), 'github.com');
  assert.equal($('.add-to-collection').length, 2);
  assert.equal($($('td.add .dropdown-menu span').get(0)).text().trim(), 'collection1');
  assert.equal($($('td.add .dropdown-menu span').get(1)).text().trim(), 'collection2');
  assert.equal($($('td.add .dropdown-menu span').get(2)).text().trim(), 'CREATE');
  assert.equal($($('td.add .dropdown-menu span').get(3)).text().trim(), 'collection1');
  assert.equal($($('td.add .dropdown-menu span').get(4)).text().trim(), 'collection2');
});

test('it filters the list', function (assert) {
  const $ = this.$;

  injectScmServiceStub(this);

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
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

  this.render(hbs`{{search-list pipelines=pipelineList query=q}}`);

  assert.ok($('tr').length, 2);
  assert.equal($('td.appId').text().trim(), 'foo/bar');
  assert.equal($('td.branch').text().trim(), 'master');
  assert.equal($('td.account').text().trim(), 'github.com');
});
