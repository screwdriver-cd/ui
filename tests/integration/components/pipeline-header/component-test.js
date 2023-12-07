import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { click, render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import Service from '@ember/service';
import injectScmServiceStub from '../../../helpers/inject-scm';

module('Integration | Component | pipeline header', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    const pipelineMock = EmberObject.create({
      appId: 'batman/batmobile',
      hubUrl: 'http://example.com/batman/batmobile',
      branch: 'master',
      scmContext: 'github:github.com'
    });

    injectScmServiceStub(this);

    this.set('pipelineMock', pipelineMock);
    await render(hbs`<PipelineHeader @pipeline={{this.pipelineMock}} />`);

    assert.dom('h1').hasText('batman/batmobile');
    assert.dom('span.branch').hasText('Source code master');
    assert.dom('a.dropdown-toggle').exists();
    assert
      .dom('a.scm')
      .hasAttribute('href', 'http://example.com/batman/batmobile');

    assert.dom('a.scm').hasText('github.com');
    assert.dom('.scm > .fa-github').exists({ count: 1 });
  });

  test('it renders branch-move', async function (assert) {
    const pipelineMock = EmberObject.create({
      id: 1,
      appId: 'batman/batmobile',
      hubUrl: 'http://example.com/batman/batmobile',
      branch: 'master',
      scmContext: 'github:github.com',
      scmUri: 'github.com:123456:master',
      scmRepo: {
        name: 'batman/batmobile',
        branch: 'master'
      }
    });

    const siblingPipelineMock = [
      {
        id: 1,
        scmRepo: {
          branch: 'master'
        },
        scmUri: 'github.com:123456:master',
      },
      {
        id: 2,
        scmRepo: {
          branch: 'efg'
        },
        scmUri: 'github.com:123456:efg',
      },
      {
        id: 3,
        scmRepo: {
          branch: 'efg',
          rootDir: 'src'
        },
        scmUri: 'github.com:123456:efg:src',
      },
      {
        id: 4,
        scmRepo: {
          branch: 'abc',
          rootDir: 'zzz'
        },
        scmUri: 'github.com:123456:abc:zzz',
      },
      {
        id: 5,
        scmRepo: {
          branch: 'abc',
          rootDir: 'aaa'
        },
        scmUri: 'github.com:123456:abc:aaa',
      },
      {
        id: 6,
        scmRepo: {
          branch: 'abc'
        },
        scmUri: 'github.com:654321:abc',
      },
    ];

    const pipelineStub = Service.extend({
      getSiblingPipeline() {
        return Promise.resolve(siblingPipelineMock);
      }
    });

    this.owner.unregister('service:pipeline');
    this.owner.register('service:pipeline', pipelineStub);

    injectScmServiceStub(this);

    this.set('pipelineMock', pipelineMock);
    await render(hbs`<PipelineHeader @pipeline={{this.pipelineMock}} />`);

    await click('span.branch');

    assert.dom('li.branch-item').exists({ count: 4 });
    assert.dom('li.branch-item:nth-child(1)').hasText('link abc:aaa');
    assert.dom('li.branch-item:nth-child(2)').hasText('link abc:zzz');
    assert.dom('li.branch-item:nth-child(3)').hasText('link efg');
    assert.dom('li.branch-item:nth-child(4)').hasText('link efg:src');
  });

  test('it renders link to parent pipeline for child pipeline', async function (assert) {
    const pipelineMock = EmberObject.create({
      appId: 'batman/batmobile',
      hubUrl: 'http://example.com/batman/batmobile',
      branch: 'master',
      scmContext: 'github:github.com',
      configPipelineId: '123'
    });

    injectScmServiceStub(this);

    this.set('pipelineMock', pipelineMock);
    await render(hbs`<PipelineHeader @pipeline={{this.pipelineMock}} />`);

    assert.dom('a:nth-child(5)').hasText('Parent Pipeline');
  });
});
