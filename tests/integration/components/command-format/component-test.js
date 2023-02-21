import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

const DOCKER_COMMAND = {
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
};

const HABITAT_COMMAND = {
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
};

const BINARY_COMMAND = {
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
};

module('Integration | Component | command format', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders docker', async function (assert) {
    this.set('mock', DOCKER_COMMAND);
    await render(hbs`<CommandFormat @command={{this.mock}} />`);

    assert.dom('h4').hasText('Format: docker');
    assert.dom('.image .label').hasText('Image:');
    assert.dom('.image .value').hasText('test');
    assert.dom('.docker-command .label').hasText('Command:');
    assert.dom('.docker-command .value').hasText('example');
  });

  test('it renders habitat', async function (assert) {
    this.set('mock', HABITAT_COMMAND);
    await render(hbs`<CommandFormat @command={{this.mock}} />`);

    assert.dom('h4').hasText('Format: habitat');
    assert.dom('.mode .label').hasText('Mode:');
    assert.dom('.mode .value').hasText('remote');
    assert.dom('.package .label').hasText('Package:');
    assert.dom('.package .value').hasText('fruit');
    assert.dom('.habitat-command .label').hasText('Command:');
    assert.dom('.habitat-command .value').hasText('bananaberry');
  });

  test('it renders binary', async function (assert) {
    this.set('mock', BINARY_COMMAND);
    await render(hbs`<CommandFormat @command={{this.mock}} />`);

    assert.dom('h4').hasText('Format: binary');
    assert.dom('.file .label').hasText('File:');
    assert.dom('.file .value').hasText('./animals.sh');
  });
});
