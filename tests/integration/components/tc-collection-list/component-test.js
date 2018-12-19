import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import { setBreakpointForIntegrationTest } from 'screwdriver-ui/tests/helpers/responsive';

const TEST_TEMPLATES = {
  model: [
    {
      id: 2,
      description: 'A test example',
      labels: ['car', 'armored'],
      maintainer: 'bruce@wayne.com',
      name: 'bar',
      namespace: 'foo',
      version: '2.0.0'
    },
    {
      id: 3,
      description: 'A fruity example',
      labels: ['fruit'],
      maintainer: 'thomas@wayne.com',
      name: 'strawberry',
      namespace: 'banana',
      version: '1.0.0'
    }
  ],
  targetNamespace: 'foo'
};

moduleForComponent('tc-collection-list', 'Integration | Component | tc collection list', {
  integration: true
});

test('it renders', function (assert) {
  const $ = this.$;

  setBreakpointForIntegrationTest(this, 'desktop');

  Object.keys(TEST_TEMPLATES).forEach(
    prop => this.set(prop, TEST_TEMPLATES[prop])
  );

  this.render(hbs`{{#tc-collection-list
    model=model
    targetNamespace=targetNamespace
    collectionType="Collection"
  }}
    This is a collection
  {{/tc-collection-list}}`);

  assert.equal($('header h4 a').text().trim(), 'Collection Docs');
  assert.equal($('header h4 a').attr('href'), 'http://docs.screwdriver.cd/user-guide/collection');
  assert.equal($('.collection-list-table th').length, 6);
  assert.equal($('.collection-list-table .lt-body td').length, 12);
});
