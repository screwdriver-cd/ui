import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import EmberObject from '@ember/object';
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

moduleForComponent('command-header', 'Integration | Component | command header', {
  integration: true
});

test('it renders', function (assert) {
  const $ = this.$;

  const storeStub = EmberObject.extend({
    findRecord() {
      return new EmberPromise(resolve => resolve(mockPipeline));
    }
  });

  this.register('service:store', storeStub);
  this.inject.service('store');

  this.set('mock', COMMAND);
  this.render(hbs`{{command-header command=mock}}`);

  assert.equal($('h1').text().trim(), 'foo/bar');
  assert.equal($('h2').text().trim(), '1.0.0');
  assert.equal($('p').text().trim(), 'A test example');
  assert.equal($('ul li:first-child').text().trim(), 'Released by: test@example.com');
  assert.equal($('ul li:first-child a').attr('href'), 'mailto:test@example.com');
  assert.equal($('h4').text().trim(), 'Usage:');
  assert.equal($('pre').text().trim(), 'sd-cmd exec foo/bar@1.0.0');
});
