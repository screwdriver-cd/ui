import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

const TEST_COMMANDS = [
  {
    id: 2,
    namespace: 'foo',
    name: 'bar',
    version: '1.0.0',
    description: 'A test example',
    maintainer: 'test@example.com',
    format: 'docker',
    docker: {
      image: 'test',
      command: 'example'
    },
    pipelineId: 100
  },
  {
    id: 3,
    namespace: 'banana',
    name: 'strawberry',
    version: '1.0.0',
    description: 'A fruity example',
    maintainer: 'fruity@example.com',
    format: 'habitat',
    habitat: {
      mode: 'remote',
      package: 'fruit',
      command: 'bananaberry'
    },
    pipelineId: 201
  },
  {
    id: 4,
    namespace: 'dog',
    name: 'cat',
    version: '1.0.0',
    description: 'An animal example',
    maintainer: 'animal@example.com',
    format: 'binary',
    binary: {
      file: './animals.sh'
    },
    pipelineId: 303
  }
];

moduleForComponent('command-list', 'Integration | Component | command list', {
  integration: true
});

test('it renders', function (assert) {
  const $ = this.$;

  this.set('mocks', TEST_COMMANDS);
  this.render(hbs`{{command-list commands=mocks}}`);

  assert.equal($('h1').text().trim(), 'Commands');
  assert.equal($('h1 a').attr('href'), 'https://docs.screwdriver.cd/user-guide/commands');
  assert.equal($('.row article').length, 3);
});
