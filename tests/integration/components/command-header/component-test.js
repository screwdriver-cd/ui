import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import Service from '@ember/service';
import { Promise as EmberPromise } from 'rsvp';

const COMMAND = {
  id: 2,
  namespace: 'foo',
  name: 'bar',
  version: '1.0.0',
  description: 'A test example',
  maintainer: 'test@example.com',
  format: 'docker',
  docker: '{"image":"test","command":"example"}',
  pipelineId: 100
};

const mockPipeline = {
  id: 1,
  scmRepo: {
    url: 'github.com/screwdriver-cd'
  },
  get(key) {
    return this[key];
  }
};

module('Integration | Component | command header', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    const storeStub = Service.extend({
      findRecord() {
        return new EmberPromise(resolve => resolve(mockPipeline));
      }
    });

    this.owner.register('service:store', storeStub);

    this.set('mock', COMMAND);
    await render(hbs`{{command-header command=mock}}`);

    assert.dom('h1').hasText('foo/bar');
    assert.dom('h2').hasText('1.0.0');
    assert.dom('p').hasText('A test example');
    assert.dom('ul li:first-child').hasText('Released by: test@example.com');
    assert.dom('ul li:first-child a').hasAttribute('href', 'mailto:test@example.com');
    assert.dom('h4').hasText('Usage:');
    assert.dom('pre').hasText('sd-cmd exec foo/bar@1.0.0');
  });
});
