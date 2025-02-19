import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
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

    assert.dom('div.pipeline-name').hasText('batman/batmobile');
    assert.dom('span.branch').hasText('master');
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
        scmUri: 'github.com:123456:master'
      },
      {
        id: 2,
        scmRepo: {
          branch: 'efg'
        },
        scmUri: 'github.com:123456:efg'
      },
      {
        id: 3,
        scmRepo: {
          branch: 'efg',
          rootDir: 'src'
        },
        scmUri: 'github.com:123456:efg:src'
      },
      {
        id: 4,
        scmRepo: {
          branch: 'abc',
          rootDir: 'zzz'
        },
        scmUri: 'github.com:123456:abc:zzz'
      },
      {
        id: 5,
        scmRepo: {
          branch: 'abc',
          rootDir: 'aaa'
        },
        scmUri: 'github.com:123456:abc:aaa'
      }
    ];

    const pipelineStub = Service.extend({
      getSiblingPipeline(_, page) {
        if (page === 1) return Promise.resolve(siblingPipelineMock);

        return Promise.resolve([]);
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

  test('it renders branch-move when API returns multiple pages', async function (assert) {
    const baseScmUri = 'github.com:123456';
    const pipelineMock = EmberObject.create({
      id: 1,
      scmContext: 'github:github.com',
      scmUri: `${baseScmUri}:master`,
      scmRepo: {
        name: 'batman/batmobile'
      }
    });

    const createSiblingPipelineMock = id => {
      return {
        id,
        scmRepo: {
          name: pipelineMock.scmRepo.name,
          branch: `branch-${id}`
        },
        scmUri: `${baseScmUri}:branch-${id}`
      };
    };

    // In test, NUM_PIPELINES_LISTED is 3
    const firstPageSiblingPipelines = [
      pipelineMock,
      createSiblingPipelineMock(2),
      createSiblingPipelineMock(3)
    ];
    const secondPageSiblingPipelines = [
      createSiblingPipelineMock(4),
      createSiblingPipelineMock(5),
      createSiblingPipelineMock(6)
    ];

    const loadPages = [];

    const pipelineStub = Service.extend({
      getSiblingPipeline(_, page) {
        loadPages.push(page);

        if (page === 1) return Promise.resolve(firstPageSiblingPipelines);
        if (page === 2) return Promise.resolve(secondPageSiblingPipelines);
        if (page === 3) return Promise.resolve([]);

        return assert.fails('This line should not run.');
      }
    });

    this.owner.unregister('service:pipeline');
    this.owner.register('service:pipeline', pipelineStub);

    injectScmServiceStub(this);

    this.set('pipelineMock', pipelineMock);
    await render(hbs`<PipelineHeader @pipeline={{this.pipelineMock}} />`);

    await click('span.branch');
    assert.dom('li.branch-item').exists({ count: 5 });
    assert.deepEqual(loadPages, [1, 2, 3]);
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

    assert
      .dom('div.header-items-container .header-item:nth-child(4)')
      .hasText('Parent Pipeline');
  });
});
