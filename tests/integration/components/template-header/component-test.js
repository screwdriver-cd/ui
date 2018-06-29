import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import EmberObject from '@ember/object';
import { Promise as EmberPromise } from 'rsvp';

const TEMPLATE = {
  id: 2,
  config: {
    image: 'node:8'
  },
  createTime: '2018-06-16T00:36:50.603Z',
  description: 'A test example',
  labels: ['car', 'armored'],
  maintainer: 'bruce@wayne.com',
  pipelineId: 1,
  namespace: 'foo',
  name: 'bar',
  fullName: 'foo/bar',
  version: '2.0.0',
  images: {
    stable: 'node:6',
    development: 'node:7'
  }
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

moduleForComponent('template-header', 'Integration | Component | template header', {
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

  this.set('mock', TEMPLATE);
  this.render(hbs`{{template-header template=mock}}`);

  assert.equal($('h1').text().trim(), 'foo/bar');
  assert.equal($('h2').text().trim(), '2.0.0');
  assert.equal($('p').text().trim(), 'A test example');
  assert.equal($('#template-namespace').text().replace(/\n +(?= )/g, '').trim(),
    'Namespace: foo');
  assert.equal($('#template-name').text().replace(/\n +(?= )/g, '').trim(),
    'Name: bar');
  assert.equal($('#template-images > .template-details--value > div:first-child').text().trim(),
    'stable: node:6');
  assert.equal($('#template-images > .template-details--value > div:nth-child(2)').text().trim(),
    'development: node:7');
  assert.equal($('#template-maintainer').text().replace(/\n +(?= )/g, '').trim(),
    'Released by: bruce@wayne.com');
  assert.equal($('#template-maintainer > .template-details--value > a').attr('href'),
    'mailto:bruce@wayne.com');
  assert.equal($('#template-tags').text().replace(/\n +(?= )/g, '').trim(),
    'Tags:  car armored');
  assert.equal($('h4').text().trim(),
    'Usage:');
  // Messy regexp instead of .includes due to phantomjs limitation
  assert.ok(new RegExp('template: foo/bar@2.0.0').test($('pre').text().trim()));
});
