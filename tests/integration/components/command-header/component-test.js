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
    const { $ } = this;

    const storeStub = Service.extend({
      findRecord() {
        return new EmberPromise(resolve => resolve(mockPipeline));
      }
    });

    this.owner.register('service:store', storeStub);
    this.store = this.owner.lookup('service:store');

    this.set('mock', COMMAND);
    await render(hbs`{{command-header command=mock}}`);

    assert.equal(
      $('h1')
        .text()
        .trim(),
      'foo/bar'
    );
    assert.equal(
      $('h2')
        .text()
        .trim(),
      '1.0.0'
    );
    assert.equal(
      $('p')
        .text()
        .trim(),
      'A test example'
    );
    assert.equal(
      $('ul li:first-child')
        .text()
        .trim(),
      'Released by: test@example.com'
    );
    assert.equal($('ul li:first-child a').attr('href'), 'mailto:test@example.com');
    assert.equal(
      $('h4')
        .text()
        .trim(),
      'Usage:'
    );
    assert.equal(
      $('pre')
        .text()
        .trim(),
      'sd-cmd exec foo/bar@1.0.0'
    );
  });
});
