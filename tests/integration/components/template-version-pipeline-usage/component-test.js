import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

const metrics = [
  {
    id: 6,
    name: 'test/pipeline1',
    scmRepo: {
      branch: 'main',
      name: 'test/template',
      url: 'https://github.com/test/template/tree/main/pipe1',
      rootDir: null,
      private: false
    },
    lastRun: '2023-08-17T18:26:41.507Z',
    admins: {
      test: true
    }
  },
  {
    id: 5,
    name: 'test/pipeline2',
    scmRepo: {
      branch: 'main',
      name: 'test/template',
      url: 'https://github.com/test/template/tree/main/pipe3',
      rootDir: 'pipe3',
      private: false
    },
    lastRun: null,
    admins: {
      test: true
    }
  },
  {
    id: 4,
    name: 'test/pipeline3',
    scmRepo: {
      branch: 'main',
      name: 'test/template',
      url: 'https://github.com/test/template/tree/main/pipe2',
      rootDir: 'pipe2',
      private: false
    },
    lastRun: '2023-07-31T17:15:37.510Z',
    admins: {
      test: true
    }
  }
];

module(
  'Integration | Component | template-version-pipeline-usage',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders template versions in a table', async function (assert) {
      this.set('templateName', 'test');
      this.set('templateNamespace', 'nodejs');
      this.set('templateVersion', '2.0.1');
      this.set('pipelineMetrics', metrics);

      await render(
        hbs`<TemplateVersionPipelineUsage @templateName={{this.templateName}} @templateNamespace={{this.templateNamespace}} @templateVersion={{this.templateVersion}} @pipelineMetrics={{this.pipelineMetrics}}
/>
`
      );
      // Header
      assert.dom('table').exists({ count: 1 });
      assert.dom('thead').exists({ count: 1 });
      assert.dom('thead tr th').exists({ count: 4 });
      assert.dom('thead tr th:nth-child(1)').hasText('NAME');
      assert.dom('thead tr th:nth-child(2)').hasText('BRANCH');
      assert.dom('thead tr th:nth-child(3)').hasText('LAST RUN');
      assert.dom('thead tr th:nth-child(4)').hasText('ADMIN');
      assert.dom('tbody').exists({ count: 1 });
      assert.dom('tbody tr').exists({ count: 3 });

      // First row
      assert.dom('tbody tr:nth-child(1) td').exists({ count: 4 });
      assert
        .dom('tbody tr:nth-child(1) td:nth-child(1)')
        .hasText(metrics[0].name);
      assert
        .dom('tbody tr:nth-child(1) td:nth-child(1) a')
        .hasAttribute('href', `/pipelines/${metrics[0].id}`);
      assert.dom('tbody tr:nth-child(1) td:nth-child(2)').hasText('main');
      assert
        .dom('tbody tr:nth-child(1) td:nth-child(2) svg.fa-code-branch')
        .exists({ count: 1 });
      assert
        .dom('tbody tr:nth-child(1) td:nth-child(2) a')
        .hasAttribute('href', metrics[0].scmRepo.url);
      assert.dom('tbody tr:nth-child(1) td:nth-child(3)').hasText('08/17/2023');
      assert.dom('tbody tr:nth-child(1) td:nth-child(4)').hasText('test');

      // Second row
      assert.dom('tbody tr:nth-child(2) td').exists({ count: 4 });
      assert
        .dom('tbody tr:nth-child(2) td:nth-child(1)')
        .hasText(metrics[1].name);
      assert
        .dom('tbody tr:nth-child(2) td:nth-child(1) a')
        .hasAttribute('href', `/pipelines/${metrics[1].id}`);
      assert.dom('tbody tr:nth-child(2) td:nth-child(2)').hasText('main:pipe3');
      assert
        .dom('tbody tr:nth-child(2) td:nth-child(2) svg.fa-code-branch')
        .exists({ count: 1 });
      assert
        .dom('tbody tr:nth-child(2) td:nth-child(2) a')
        .hasAttribute('href', metrics[1].scmRepo.url);
      assert.dom('tbody tr:nth-child(2) td:nth-child(3)').hasText('--/--/----');
      assert.dom('tbody tr:nth-child(2) td:nth-child(4)').hasText('test');

      // Third row
      assert.dom('tbody tr:nth-child(3) td').exists({ count: 4 });
      assert
        .dom('tbody tr:nth-child(3) td:nth-child(1)')
        .hasText(metrics[2].name);
      assert
        .dom('tbody tr:nth-child(3) td:nth-child(1) a')
        .hasAttribute('href', `/pipelines/${metrics[2].id}`);
      assert.dom('tbody tr:nth-child(3) td:nth-child(2)').hasText('main:pipe2');
      assert
        .dom('tbody tr:nth-child(3) td:nth-child(2) svg.fa-code-branch')
        .exists({ count: 1 });
      assert
        .dom('tbody tr:nth-child(3) td:nth-child(2) a')
        .hasAttribute('href', metrics[2].scmRepo.url);
      assert.dom('tbody tr:nth-child(3) td:nth-child(3)').hasText('07/31/2023');
      assert.dom('tbody tr:nth-child(3) td:nth-child(4)').hasText('test');
    });
  }
);
