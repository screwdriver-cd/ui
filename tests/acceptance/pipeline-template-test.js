import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'screwdriver-ui/tests/helpers';

module('Acceptance | pipeline template', function (hooks) {
  const mockApi = setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    mockApi.get('/pipeline/template/sd-test/example-template', () => [
      200,
      {
        id: 5,
        pipelineId: 13352,
        namespace: 'sd-test',
        name: 'example-template',
        maintainer: 'foo@bar.com',
        latestVersion: '1.0.3',
        createTime: '2024-03-04T16:18:27.365Z',
        updateTime: '2024-04-08T20:52:12.403Z',
        templateType: 'PIPELINE'
      }
    ]);

    mockApi.get('/pipeline/templates', () => [
      200,
      [
        {
          id: 14,
          pipelineId: 13606,
          namespace: 'adong',
          name: 'sd-job-template-builder',
          maintainer: 'adong@yahooinc.com',
          trustedSinceVersion: '1.0.2',
          latestVersion: '1.0.5',
          createTime: '2024-03-27T17:29:23.242Z',
          updateTime: '2024-04-02T20:51:49.270Z',
          templateType: 'PIPELINE'
        },
        {
          id: 9,
          pipelineId: 13603,
          namespace: 'sagar1312',
          name: 'sd-job-template-builder',
          maintainer: 'sagar1312@gmail.com',
          latestVersion: '1.0.9',
          createTime: '2024-03-26T14:34:30.236Z',
          updateTime: '2024-03-27T22:30:13.109Z',
          templateType: 'PIPELINE'
        },
        {
          id: 8,
          pipelineId: 13602,
          namespace: 'ibu-test',
          name: 'template-publish-test',
          maintainer: 'foo@bar.com',
          latestVersion: '1.0.6',
          createTime: '2024-03-25T06:36:20.548Z',
          updateTime: '2024-03-25T07:23:16.758Z',
          templateType: 'PIPELINE'
        },
        {
          id: 7,
          pipelineId: 13542,
          namespace: 'ibu-test',
          name: 'sd-ibu-pipeline-template',
          maintainer: 'foo@bar.com',
          latestVersion: '1.0.4',
          createTime: '2024-03-25T04:29:33.257Z',
          updateTime: '2024-03-26T04:08:32.455Z',
          templateType: 'PIPELINE'
        },
        {
          id: 5,
          pipelineId: 13352,
          namespace: 'sd-test',
          name: 'example-template',
          maintainer: 'foo@bar.com',
          latestVersion: '1.0.3',
          createTime: '2024-03-04T16:18:27.365Z',
          updateTime: '2024-04-08T20:52:12.403Z',
          templateType: 'PIPELINE'
        },
        {
          id: 4,
          pipelineId: 13183,
          namespace: 'screwdriver-cd-test',
          name: 'test-trusted-pipeline-template',
          maintainer: 'test@example.com',
          trustedSinceVersion: '1.0.0',
          latestVersion: '1.0.21',
          createTime: '2024-02-22T17:51:31.974Z',
          updateTime: '2024-04-08T20:39:32.804Z',
          templateType: 'PIPELINE'
        },
        {
          id: 3,
          pipelineId: 13183,
          namespace: 'screwdriver-cd-test',
          name: 'test-distrusted-pipeline-template',
          maintainer: 'test@example.com',
          latestVersion: '1.0.21',
          createTime: '2024-02-22T17:51:31.922Z',
          updateTime: '2024-04-08T20:40:08.642Z',
          templateType: 'PIPELINE'
        },
        {
          id: 2,
          pipelineId: 13183,
          namespace: 'screwdriver-cd-test',
          name: 'test-pipeline-template',
          maintainer: 'test@example.com',
          latestVersion: '1.0.0',
          createTime: '2024-02-22T17:51:15.116Z',
          updateTime: '2024-02-22T17:51:15.122Z',
          templateType: 'PIPELINE'
        },
        {
          id: 1,
          pipelineId: 13183,
          namespace: 'screwdriver-cd-test',
          name: 'publish-pipeline-template-test',
          maintainer: 'test@example.com',
          latestVersion: '1.0.23',
          createTime: '2024-02-22T07:29:20.855Z',
          updateTime: '2024-04-08T20:35:57.904Z',
          templateType: 'PIPELINE'
        }
      ]
    ]);

    mockApi.get('/pipeline/templates/sd-test/example-template/tags', () => [
      200,
      [
        {
          id: 179,
          createTime: '2024-03-04T16:18:27.391Z',
          namespace: 'sd-test',
          name: 'example-template',
          tag: 'latest',
          version: '1.0.3',
          templateType: 'PIPELINE'
        }
      ]
    ]);

    mockApi.get('/pipeline/templates/sd-test/example-template/versions', () => [
      200,
      [
        {
          id: 120,
          templateId: 5,
          description: 'An example pipeline template for testing golang files',
          version: '1.0.3',
          config: {
            parameters: {
              nameA: 'value1'
            },
            annotations: {
              'screwdriver.cd/restrictPR': 'none',
              'screwdriver.cd/chainPR': false
            },
            shared: {
              image: 'golang'
            },
            jobs: {
              main: {
                steps: [
                  {
                    name: 'echo "pipeline template test"'
                  }
                ]
              }
            }
          },
          createTime: '2024-04-08T20:52:12.397Z'
        },
        {
          id: 119,
          templateId: 5,
          description: 'An example pipeline template for testing golang files',
          version: '1.0.2',
          config: {
            parameters: {
              nameA: 'value1'
            },
            shared: {
              image: 'golang'
            },
            jobs: {
              main: {
                steps: [
                  {
                    name: 'echo "pipeline template test"'
                  }
                ]
              }
            }
          },
          createTime: '2024-04-08T20:48:14.213Z'
        },
        {
          id: 94,
          templateId: 5,
          description: 'An example pipeline template for testing golang files',
          version: '1.0.1',
          config: {
            shared: {
              image: 'golang'
            },
            jobs: {
              main: {
                steps: [
                  {
                    name: 'echo "pipeline template test"'
                  }
                ]
              }
            },
            parameters: {}
          },
          createTime: '2024-03-29T23:09:31.669Z'
        },
        {
          id: 21,
          templateId: 5,
          description: 'An example pipeline template for testing golang files',
          version: '1.0.0',
          config: {
            shared: {
              image: 'golang'
            },
            jobs: {
              main: {
                steps: [
                  {
                    name: 'echo "pipeline template test"'
                  }
                ]
              }
            },
            parameters: {}
          },
          createTime: '2024-03-04T16:18:27.365Z'
        }
      ]
    ]);
  });

  test('visiting /templates/pipeline/sd-test/example-template', async function (assert) {
    await visit('/templates/pipeline/sd-test/example-template');

    assert.strictEqual(
      currentURL(),
      '/templates/pipeline/sd-test/example-template'
    );

    assert.dom('div.annotations > span.label').includesText('Annotations');
    assert
      .dom('div.annotations > span.value > ul > li:nth-child(1) > span.name')
      .includesText('screwdriver.cd/restrictPR');
    assert
      .dom('div.annotations > span.value > ul > li:nth-child(1) > span.value')
      .includesText('none');
    assert
      .dom('div.annotations > span.value > ul > li:nth-child(2) > span.name')
      .includesText('screwdriver.cd/chainPR');
    assert
      .dom('div.annotations > span.value > ul > li:nth-child(2) > span.value')
      .includesText('false');

    assert.dom('div.parameters > span.label').includesText('Parameters');
    assert
      .dom('div.parameters > span.value > ul > li > span.name')
      .includesText('nameA');
    assert
      .dom('div.parameters > span.value > ul > li > span.value')
      .includesText('value1');

    assert
      .dom('table.table td div.version-cell')
      .includesText('1.0.3 - latest');
  });

  test('visiting /templates/pipeline/not/exist', async function (assert) {
    await visit('/templates/pipeline/not/exist');

    assert.strictEqual(currentURL(), '/templates/pipeline/not/exist');
    assert.dom('.code').hasText('404');
  });
});
