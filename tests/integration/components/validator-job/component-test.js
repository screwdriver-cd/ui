import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render, click } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | validator job', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    this.set('jobMock', {
      image: 'int-test:1',
      commands: [
        { name: 'step1', command: 'echo hello' },
        { name: 'step2', command: 'echo goodbye' }
      ],
      secrets: [],
      environment: {},
      settings: {}
    });

    await render(
      hbs`<ValidatorJob @name="int-test" @index={{0}} @job={{this.jobMock}} />`
    );

    assert.dom('h4').hasText('int-test');
    assert.dom('.image .label').hasText('Image:');
    assert.dom('.image .value').hasText('int-test:1');
    assert.dom('.steps .label').hasText('Steps:');
    assert.dom('.steps ul li:first-child .value').hasText('echo hello');
    assert.dom('.steps ul li:last-child .value').hasText('echo goodbye');
    assert.dom('.secrets .label').hasText('Secrets:');
    assert.dom('.secrets ul li').hasText('None defined');
    assert.dom('.env .label').hasText('Environment Variables:');
    assert.dom('.env ul li').hasText('None defined');
    assert.dom('.settings .label').hasText('Settings:');
    assert.dom('.settings ul li').hasText('None defined');
    assert.dom('.annotations .label').hasText('Annotations:');
    assert.dom('.annotations .value').hasText('None defined');
  });

  test('it renders a template, description, images', async function (assert) {
    this.set('templateMock', {
      description: 'Test template',
      maintainer: 'bruce@wayne.com',
      images: {
        stable: 'node:6',
        development: 'node:7'
      },
      name: 'test',
      namespace: 'batman',
      version: '2.0.0'
    });

    this.set('jobMock', {
      image: 'int-test:1',
      commands: [
        { name: 'step1', command: 'echo hello' },
        { name: 'step2', command: 'echo goodbye' }
      ],
      secrets: ['FOO', 'BAR'],
      environment: {
        FOO: 'bar'
      },
      settings: {
        FOO: 'bar'
      },
      annotations: {
        FOO: 'bar'
      }
    });

    await render(
      hbs`<ValidatorJob @name="int-test" @index={{0}} @job={{this.jobMock}} @template={{this.templateMock}} />`
    );

    assert.dom('.template-description .label').hasText('Template Description:');
    assert.dom('.template-description .value').hasText('Test template');
    assert.dom('.images > .label').hasText('Supported Images:');
    assert
      .dom('.images > .value > ul > li:first-child')
      .hasText('stable: node:6');
    assert
      .dom('.images > .value > ul > li:nth-child(2)')
      .hasText('development: node:7');
  });

  test('it renders settings, env, secrets, annotations', async function (assert) {
    this.set('jobMock', {
      image: 'int-test:1',
      commands: [
        { name: 'step1', command: 'echo hello' },
        { name: 'step2', command: 'echo goodbye' }
      ],
      secrets: ['FOO', 'BAR'],
      environment: {
        FOO: 'bar'
      },
      settings: {
        FOO: 'bar'
      },
      annotations: {
        FOO: 'bar'
      }
    });

    await render(
      hbs`<ValidatorJob @name="int-test" @index={{0}} @job={{this.jobMock}} />`
    );

    assert.dom('h4').hasText('int-test');
    assert.dom('.secrets .label').hasText('Secrets:');
    assert.dom('.secrets ul li:first-child').hasText('FOO');
    assert.dom('.secrets ul li:last-child').hasText('BAR');
    assert.dom('.env .label').hasText('Environment Variables:');
    assert.dom('.env ul li').hasText('FOO: bar');
    assert.dom('.settings .label').hasText('Settings:');
    assert.dom('.settings ul li').hasText('FOO: bar');
    assert.dom('.annotations .label').hasText('Annotations:');
    assert.dom('.annotations ul li').hasText('FOO: bar');
  });

  test('it renders template steps', async function (assert) {
    this.set('jobMock', {
      image: 'int-test:1',
      steps: [{ step1: 'echo hello' }, { step2: 'echo goodbye' }],
      secrets: [],
      environment: {},
      settings: {},
      annotations: {}
    });

    await render(
      hbs`<ValidatorJob @name="int-test" @index={{0}} @job={{this.jobMock}} />`
    );

    assert.dom('h4').hasText('int-test');
    assert.dom('.image .label').hasText('Image:');
    assert.dom('.image .value').hasText('int-test:1');
    assert.dom('.steps .label').hasText('Steps:');
    assert.dom('.steps ul li:first-child .value').hasText('echo hello');
    assert.dom('.steps ul li:last-child .value').hasText('echo goodbye');
    assert.dom('.secrets .label').hasText('Secrets:');
    assert.dom('.secrets ul li').hasText('None defined');
    assert.dom('.env .label').hasText('Environment Variables:');
    assert.dom('.env ul li').hasText('None defined');
    assert.dom('.settings .label').hasText('Settings:');
    assert.dom('.settings ul li').hasText('None defined');
    assert.dom('.annotations .label').hasText('Annotations:');
    assert.dom('.annotations .value').hasText('None defined');
    assert.dom('.sourcePaths .label').hasText('Source Paths:');
    assert.dom('.sourcePaths ul li').hasText('None defined');
  });

  test('it renders template name when template is used', async function (assert) {
    this.set('templateMock', {
      description: 'Test template',
      maintainer: 'bruce@wayne.com',
      images: {
        stable: 'node:6',
        development: 'node:7'
      },
      name: 'test',
      namespace: 'batman',
      version: '2.0.0'
    });
    this.set('jobMock', {
      image: 'int-test:1',
      template: 'baz',
      steps: [{ step1: 'echo hello' }, { step2: 'echo goodby' }],
      secrets: [],
      environment: {
        SD_TEMPLATE_FULLNAME: 'baz',
        SD_TEMPLATE_NAMESPACE: 'default',
        SD_TEMPLATE_NAME: 'baz',
        SD_TEMPLATE_VERSION: '2.0.0'
      },
      settings: {},
      annotations: {}
    });

    await render(
      hbs`<ValidatorJob @name="int-test" @index={{0}} @job={{this.jobMock}} @template={{this.templateMock}} />`
    );

    assert.dom('h4:nth-of-type(1)').hasText('int-test');
    assert
      .dom('h4:nth-of-type(2)')
      .hasText('This template extends baz template.');
    assert
      .dom('h4:nth-of-type(2) a')
      .hasAttribute('href', '/templates/job/default/baz/2.0.0');
  });

  test('it renders template name with version tag', async function (assert) {
    this.set('jobMock', {
      image: 'int-test:1',
      steps: [{ step1: 'echo hello' }, { step2: 'echo goodby' }],
      secrets: [],
      environment: {
        SD_TEMPLATE_FULLNAME: 'foo/bar',
        SD_TEMPLATE_NAMESPACE: 'foo',
        SD_TEMPLATE_NAME: 'bar',
        SD_TEMPLATE_VERSION: 'latest'
      },
      settings: {},
      annotations: {}
    });

    await render(
      hbs`<ValidatorJob @name="int-test" @index={{0}} @job={{this.jobMock}} />`
    );

    assert.dom('h4:nth-of-type(1)').hasText('int-test');
    assert.dom('h4:nth-of-type(2)').hasText('This job uses foo/bar template.');
    assert
      .dom('h4:nth-of-type(2) a')
      .hasAttribute('href', '/templates/job/foo/bar/latest');
  });

  test('it renders template name with version number', async function (assert) {
    this.set('jobMock', {
      image: 'int-test:1',
      steps: [{ step1: 'echo hello' }, { step2: 'echo goodby' }],
      secrets: [],
      environment: {
        SD_TEMPLATE_FULLNAME: 'foo/bar',
        SD_TEMPLATE_NAMESPACE: 'foo',
        SD_TEMPLATE_NAME: 'bar',
        SD_TEMPLATE_VERSION: '0.0.1'
      },
      settings: {},
      annotations: {}
    });

    await render(
      hbs`<ValidatorJob @name="int-test" @index={{0}} @job={{this.jobMock}} />`
    );

    assert.dom('h4:nth-of-type(1)').hasText('int-test');
    assert.dom('h4:nth-of-type(2)').hasText('This job uses foo/bar template.');
    assert
      .dom('h4:nth-of-type(2) a')
      .hasAttribute('href', '/templates/job/foo/bar/0.0.1');
  });

  test('it renders when there are no steps or commands', async function (assert) {
    this.set('jobMock', {
      image: 'int-test:1',
      secrets: [],
      environment: {},
      settings: {},
      annotations: {}
    });

    await render(
      hbs`<ValidatorJob @name="int-test" @index={{1}} @job={{this.jobMock}} />`
    );

    assert.dom('h4').hasText('int-test.1');
    assert.dom('.steps .label').hasText('Steps:');
    assert.dom('.steps ul .value').doesNotExist();
  });

  test('it handles clicks on header', async function (assert) {
    this.set('jobMock', {
      image: 'int-test:1',
      commands: [
        { name: 'step1', command: 'echo hello' },
        { name: 'step2', command: 'echo goodbye' }
      ],
      secrets: ['FOO', 'BAR'],
      environment: {
        FOO: 'bar'
      },
      settings: {
        FOO: 'bar'
      },
      annotations: {}
    });

    this.set('openMock', true);

    await render(
      hbs`<ValidatorJob @name="int-test" @index={{0}} @job={{this.jobMock}} @isOpen={{this.openMock}} />`
    );

    assert.ok(this.openMock);

    await click('h4');

    assert.notOk(this.openMock);

    await click('h4');

    assert.ok(this.openMock);
  });

  test('it renders a description', async function (assert) {
    this.set('jobMock', {
      image: 'int-test:1',
      description: 'This is a description',
      secrets: [],
      environment: {},
      settings: {},
      annotations: {}
    });

    await render(
      hbs`<ValidatorJob @name="int-test" @index={{0}} @job={{this.jobMock}} />`
    );

    assert.dom('h4').hasText('int-test');
    assert.dom('.description .label').hasText('Description:');
    assert.dom('.description .value').hasText('This is a description');
  });

  test('it renders sourcePaths', async function (assert) {
    this.set('jobMock', {
      image: 'int-test:1',
      description: 'This is a description',
      secrets: [],
      environment: {},
      settings: {},
      annotations: {},
      sourcePaths: ['README.md', 'src/folder/']
    });

    await render(
      hbs`<ValidatorJob @name="int-test" @index={{0}} @job={{this.jobMock}} />`
    );

    assert.dom('h4').hasText('int-test');
    assert.dom('.sourcePaths .label').hasText('Source Paths:');
    assert.dom('.sourcePaths .value ul li:first-child').hasText('README.md');
    assert.dom('.sourcePaths .value ul li:last-child').hasText('src/folder/');
  });

  test('it renders sd-commands', async function (assert) {
    this.set('jobMock', {
      image: 'int-test:1',
      commands: [
        { name: 'step1', command: 'sd-cmd exec bar/foo@latest' },
        { name: 'step2', command: 'sd-cmd exec foo/bar@0.0.1 foobar' },
        { name: 'step3', command: 'sd-cmd exec bar/foo@stable' },
        {
          name: 'step4',
          command: 'sd-cmd exec foo/bar@stable; sd-cmd exec foo/bar@stable'
        },
        {
          name: 'step5',
          command: 'sd-cmd exec foo/bar@stable; sd-cmd exec foo/bar@latest'
        },
        { name: 'step6', command: 'sd-cmd exec bar/foo@latest' }
      ],
      secrets: [],
      environment: {},
      settings: {},
      annotations: {}
    });

    await render(
      hbs`<ValidatorJob @name="int-test" @index={{0}} @job={{this.jobMock}} />`
    );

    assert.dom('h4').hasText('int-test');
    assert.dom('.sd-commands .label').hasText('Commands:');
    assert.dom('.sd-commands ul li:nth-of-type(1)').hasText('bar/foo@latest');
    assert
      .dom('.sd-commands ul li:nth-of-type(1) a')
      .hasAttribute('href', '/commands/bar/foo/latest');
    assert.dom('.sd-commands ul li:nth-of-type(2)').hasText('foo/bar@0.0.1');
    assert
      .dom('.sd-commands ul li:nth-of-type(2) a')
      .hasAttribute('href', '/commands/foo/bar/0.0.1');
    assert.dom('.sd-commands ul li:nth-of-type(3)').hasText('bar/foo@stable');
    assert
      .dom('.sd-commands ul li:nth-of-type(3) a')
      .hasAttribute('href', '/commands/bar/foo/stable');

    assert.dom('.sd-commands ul li:nth-of-type(4)').hasText('foo/bar@stable');
    assert.dom('.sd-commands ul li:nth-of-type(5)').hasText('foo/bar@latest');
    assert.dom('.sd-commands ul li:nth-of-type(6)').doesNotExist();
  });

  test('it renders without a collapsible heading', async function (assert) {
    this.set('jobMock', {
      image: 'int-test:1',
      commands: [
        { name: 'step1', command: 'echo hello' },
        { name: 'step2', command: 'echo goodbye' }
      ],
      secrets: [],
      environment: {},
      settings: {}
    });

    await render(
      hbs`<ValidatorJob @name="int-test" @index={{0}} @job={{this.jobMock}} @collapsible={{false}} />`
    );

    assert.dom('h4').doesNotExist();
  });

  test('it has freezeWindow data and renders freezeWindow', async function (assert) {
    this.set('jobMock', {
      image: 'int-test:1',
      commands: [
        { name: 'step1', command: 'echo hello' },
        { name: 'step2', command: 'echo goodbye' }
      ],
      secrets: [],
      environment: {},
      settings: {},
      freezeWindows: ['* * 01 01 ?', '* * 16 01 ?']
    });

    await render(
      hbs`<ValidatorJob @name="int-test" @index={{0}} @job={{this.jobMock}} />`
    );

    assert.dom('.freezeWindow .label').hasText('Freeze Windows:');
    assert
      .dom('.freezeWindow .value ul > li:nth-child(1)')
      .hasText('* * 01 01 ?');
    assert
      .dom('.freezeWindow .value ul > li:nth-child(2)')
      .hasText('* * 16 01 ?');
  });

  test('it has no freezeWindow data and renders freezeWindow', async function (assert) {
    this.set('jobMock', {
      image: 'int-test:1',
      commands: [
        { name: 'step1', command: 'echo hello' },
        { name: 'step2', command: 'echo goodbye' }
      ],
      secrets: [],
      environment: {},
      settings: {}
    });

    await render(
      hbs`<ValidatorJob @name="int-test" @index={{0}} @job={{this.jobMock}} />`
    );

    assert.dom('.freezeWindow .label').hasText('Freeze Windows:');
    assert.dom('.freezeWindow .value').hasText('None defined');
  });
});
