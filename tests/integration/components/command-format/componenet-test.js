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

module('Integration | Component | command format', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders docker', async function(assert) {
    const { $ } = this;

    this.set('mock', DOCKER_COMMAND);
    await render(hbs`{{command-format command=mock}}`);

    assert.equal(
      $('h4')
        .text()
        .trim(),
      'Format: docker'
    );
    assert.equal(
      $('.image .label')
        .text()
        .trim(),
      'Image:'
    );
    assert.equal(
      $('.image .value')
        .text()
        .trim(),
      'test'
    );
    assert.equal(
      $('.docker-command .label')
        .text()
        .trim(),
      'Command:'
    );
    assert.equal(
      $('.docker-command .value')
        .text()
        .trim(),
      'example'
    );
  });

  test('it renders habitat', async function(assert) {
    const { $ } = this;

    this.set('mock', HABITAT_COMMAND);
    await render(hbs`{{command-format command=mock}}`);

    assert.equal(
      $('h4')
        .text()
        .trim(),
      'Format: habitat'
    );
    assert.equal(
      $('.mode .label')
        .text()
        .trim(),
      'Mode:'
    );
    assert.equal(
      $('.mode .value')
        .text()
        .trim(),
      'remote'
    );
    assert.equal(
      $('.package .label')
        .text()
        .trim(),
      'Package:'
    );
    assert.equal(
      $('.package .value')
        .text()
        .trim(),
      'fruit'
    );
    assert.equal(
      $('.habitat-command .label')
        .text()
        .trim(),
      'Command:'
    );
    assert.equal(
      $('.habitat-command .value')
        .text()
        .trim(),
      'bananaberry'
    );
  });

  test('it renders binary', async function(assert) {
    const { $ } = this;

    this.set('mock', BINARY_COMMAND);
    await render(hbs`{{command-format command=mock}}`);

    assert.equal(
      $('h4')
        .text()
        .trim(),
      'Format: binary'
    );
    assert.equal(
      $('.file .label')
        .text()
        .trim(),
      'File:'
    );
    assert.equal(
      $('.file .value')
        .text()
        .trim(),
      './animals.sh'
    );
  });
});
