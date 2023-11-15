import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import Service from '@ember/service';
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
  },
  trusted: true
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

module('Integration | Component | template header', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    const storeStub = Service.extend({
      findRecord() {
        return new EmberPromise(resolve => resolve(mockPipeline));
      }
    });

    this.set('mock', TEMPLATE);
    this.set('isAdmin', false);

    this.owner.unregister('service:store');
    this.owner.register('service:store', storeStub);

    await render(
      hbs`<TemplateHeader @template={{this.mock}} @trusted={{this.trusted}} @isAdmin={{this.isAdmin}} />`
    );

    assert.dom('.header .left-header h1').hasText('foo/bar Source code');
    assert.dom('.header .right-header h1').hasText('Delete template');
    assert.dom('h2').hasText('2.0.0');
    assert.dom('p').hasText('A test example');
    assert.dom('#template-namespace').hasText('Namespace: foo');
    assert.dom('#template-name').hasText('Name: bar');
    assert.dom('#template-maintainer').hasText('Released by: bruce@wayne.com');
    assert
      .dom('#template-maintainer > .template-details--value > a')
      .hasAttribute('href', 'mailto:bruce@wayne.com');
    assert.dom('#template-tags').hasText('Tags: car armored');
    assert.dom('h4').hasText('Usage:');
    assert.dom('pre').hasText('jobs: main: template: foo/bar@2.0.0');

    this.set('isAdmin', true);

    assert.dom('svg').exists({ count: 3 });
    assert.dom('.x-toggle-component').exists({ count: 1 });
  });
});
