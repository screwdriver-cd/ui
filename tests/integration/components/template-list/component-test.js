import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

const TEST_TEMPLATES = [
  {
    id: 2,
    config: {
      image: 'node:8'
    },
    description: 'A test example',
    labels: ['car', 'armored'],
    maintainer: 'bruce@wayne.com',
    name: 'foo/bar',
    version: '2.0.0'
  },
  {
    id: 3,
    config: {
      image: 'node:6'
    },
    description: 'A fruity example',
    labels: ['fruit'],
    maintainer: 'thomas@wayne.com',
    name: 'banana/strawberry',
    version: '1.0.0'
  }
];

moduleForComponent('template-list', 'Integration | Component | template list', {
  integration: true
});

test('it renders', function (assert) {
  const $ = this.$;

  this.set('mocks', TEST_TEMPLATES);
  this.render(hbs`{{template-list templates=mocks}}`);

  assert.equal($('h1').text().trim(), 'Templates');
  assert.equal($('h1 a').attr('href'), 'http://docs.screwdriver.cd/user-guide/templates');
  assert.equal($('.row article').length, 2);
});
