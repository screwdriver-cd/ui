import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { setBreakpoint } from 'ember-responsive/test-support';

const TEST_TEMPLATES = {
  model: [
    {
      id: 2,
      description: 'A test example',
      labels: ['car', 'armored'],
      maintainer: 'bruce@wayne.com',
      name: 'bar',
      namespace: 'foo',
      version: '2.0.0'
    },
    {
      id: 3,
      description: 'A fruity example',
      labels: ['fruit'],
      maintainer: 'thomas@wayne.com',
      name: 'strawberry',
      namespace: 'banana',
      version: '1.0.0'
    }
  ],
  targetNamespace: 'foo'
};

module('Integration | Component | tc collection list', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    setBreakpoint('desktop');

    Object.keys(TEST_TEMPLATES).forEach(prop =>
      this.set(prop, TEST_TEMPLATES[prop])
    );

    await render(hbs`<TcCollectionList
      @model={{this.model}}
      @collectionType="Collection"
    />
    "This is a collection"
    `);

    assert.dom('table').exists({ count: 1 });
    assert.dom('thead').exists({ count: 1 });
    assert.dom('tbody').exists({ count: 1 });
    assert.dom('th.table-header').exists({ count: 5 });
    assert.dom('tbody tr td').exists({ count: 10 });
  });

  test('it renders with filter namespace', async function (assert) {
    setBreakpoint('desktop');

    Object.keys(TEST_TEMPLATES).forEach(prop =>
      this.set(prop, TEST_TEMPLATES[prop])
    );

    await render(hbs`<TcCollectionList
      @model={{this.model}}
      @filteringNamespace={{this.targetNamespace}}
      @collectionType="Collection"
    />
      "This is a collection"
    `);

    assert.dom('table').exists({ count: 1 });
    assert.dom('thead').exists({ count: 1 });
    assert.dom('tbody').exists({ count: 1 });
    assert.dom('th.table-header').exists({ count: 5 });
    assert.dom('tbody tr td').exists({ count: 5 });
  });

  test('it renders with commands', async function (assert) {
    const commandsMock = [
      {
        id: 16,
        namespace: 'demo',
        version: '1.0.0',
        description: 'A little binary that prints a goodbye message\n',
        maintainer: 'pscott@zeptohost.com',
        format: 'binary',
        name: 'goodbye',
        pipelineId: 654,
        latest: true
      },
      {
        id: 6,
        namespace: 'FenrirUnbound',
        version: '0.1.5',
        description: 'Simple Go-based templating tool\n',
        maintainer: 'aeneascorrupt@gmail.com',
        format: 'binary',
        name: 'mplater',
        pipelineId: 484,
        latest: true
      }
    ];

    this.setProperties({
      model: commandsMock,
      filteringNamespace: ''
    });

    await render(hbs`<TcCollectionList
      @model={{this.model}}
      @filteringNamespace={{this.targetNamespace}}
      @collectionType="Commands"
    />`);

    assert.dom('table tr td:first-child a').exists({ count: 2 });
    assert.dom('table tr td:nth-child(3)').exists({ count: 2 });
    assert.dom('table a').exists({ count: 4 });

    assert
      .dom('table tr:first-child td:first-child a')
      .hasAttribute('href', '/commands/demo/goodbye');
    assert
      .dom('table tr:nth-child(2) td:first-child a')
      .hasAttribute('href', '/commands/FenrirUnbound/mplater');
  });

  test('it renders with job templates', async function (assert) {
    const jobTemplatesMock = [
      {
        id: 17,
        labels: [],
        name: 'nodejs_main',
        version: '0.0.1',
        description:
          'Template for a NodeJS main job. Installs the NPM module dependencies and executes\nthe test target.\n',
        maintainer: 'mia.cheung2@gmail.com',
        pipelineId: 155,
        namespace: 'jerry',
        latest: true,
        fullName: 'jerry/nodejs_main'
      },
      {
        id: 19,
        labels: [],
        name: 'nodejs_main',
        version: '1.2.0',
        description:
          'Template for building a NodeJS module\nInstalls dependencies and runs tests\n',
        maintainer: 'me@nowhere.com',
        pipelineId: 111,
        namespace: 'template_namespace',
        latest: true,
        fullName: 'template_namespace/nodejs_main'
      }
    ];

    this.setProperties({
      model: jobTemplatesMock,
      filteringNamespace: ''
    });

    await render(hbs`<TcCollectionList
      @model={{this.model}}
      @filteringNamespace={{this.targetNamespace}}
      @collectionType="Job"
    />`);

    assert.dom('table tr td:first-child a').exists({ count: 2 });
    assert.dom('table tr td:nth-child(3)').exists({ count: 2 });
    assert.dom('table a').exists({ count: 4 });

    assert
      .dom('table tr:first-child td:first-child a')
      .hasAttribute('href', '/templates/job/jerry/nodejs_main');
    assert
      .dom('table tr:nth-child(2) td:first-child a')
      .hasAttribute('href', '/templates/job/template_namespace/nodejs_main');
  });

  test('it renders with pipeline templates', async function (assert) {
    const pipelineTemplatesMock = [
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
        templateType: 'PIPELINE',
        fullName: 'adong/sd-job-template-builder',
        lastUpdated: '1 week ago',
        description: '',
        trusted: true
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
        templateType: 'PIPELINE',
        fullName: 'sagar1312/sd-job-template-builder',
        lastUpdated: '1 week ago',
        description: ''
      }
    ];

    this.setProperties({
      model: pipelineTemplatesMock,
      filteringNamespace: ''
    });

    await render(hbs`<TcCollectionList
      @model={{this.model}}
      @filteringNamespace={{this.targetNamespace}}
      @collectionType="Pipeline"
    />`);

    assert.dom('table tr td:first-child a').exists({ count: 2 });
    assert.dom('table tr td:nth-child(3)').exists({ count: 2 });
    assert.dom('table a').exists({ count: 4 });

    assert
      .dom('table tr:first-child td:first-child a')
      .hasAttribute(
        'href',
        '/templates/pipeline/adong/sd-job-template-builder'
      );
    assert
      .dom('table tr:nth-child(2) td:first-child a')
      .hasAttribute(
        'href',
        '/templates/pipeline/sagar1312/sd-job-template-builder'
      );
  });
});
