import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';

moduleForComponent('collection-view', 'Integration | Component | collection view', {
  integration: true
});

test('it renders', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const $ = this.$;
  const testCollection = Ember.Object.create({
    id: 1,
    name: 'Test',
    description: 'Test Collection',
    pipelines: [
      {
        id: 12742,
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
        id: 12743,
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
