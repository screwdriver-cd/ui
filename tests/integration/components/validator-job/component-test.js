import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, settled, click, find } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | validator job', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
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

    await render(hbs`{{validator-job name="int-test" index=0 job=jobMock}}`);

    assert.dom('h4').hasText('int-test');

    assert.dom('.image .label').hasText('Image:');
    assert.dom('.image .value').hasText('int-test:1');

    assert.dom('.steps .label').hasText('Steps:');
    assert.dom('.steps ul .value').hasText('echo helloecho goodbye');

    assert.dom('.secrets .label').hasText('Secrets:');
    assert.dom('.secrets ul li').hasText('None defined');

    assert.dom('.env .label').hasText('Environment Variables:');
    assert.dom('.env ul li').hasText('None defined');

    assert.dom('.settings .label').hasText('Settings:');
    assert.dom('.settings ul li').hasText('None defined');

    assert.dom('.annotations .label').hasText('Annotations:');
    assert.dom('.annotations .value').hasText('None defined');
  });

  test('it renders a template, description, images', async function(assert) {
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

    await render(hbs`{{validator-job name="int-test" index=0 job=jobMock template=templateMock}}`);

    assert.dom('.template-description .label').hasText('Template Description:');
    assert.dom('.template-description .value').hasText('Test template');
    assert.dom('.images >.label').hasText('Supported Images:');
    assert.equal(
      this.$('.images >.value >ul >li:first-of-type')
        .text()
        .replace(/\s+/g, ' ')
        .trim(),
      'stable: node:6'
    );
    assert.equal(
      find('.images >.value >ul >li:nth-of-type(2)')
        .textContent.replace(/\s+/g, ' ')
        .trim(),
      'development: node:7'
    );
  });

  test('it renders settings, env, secrets, annotations', async function(assert) {
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

    await render(hbs`{{validator-job name="int-test" index=0 job=jobMock}}`);

    assert.dom('h4').hasText('int-test');
    assert.dom('.secrets .label').hasText('Secrets:');
    assert.dom('.secrets ul li').hasText('FOOBAR');

    assert.dom('.env .label').hasText('Environment Variables:');
    assert.dom('.env ul li').hasText('FOO: bar');

    assert.dom('.settings .label').hasText('Settings:');
    assert.equal(
      find('.settings ul li')
        .textContent.replace(/\s+/g, ' ')
        .trim(),
      'FOO: bar'
    );

    assert.dom('.annotations .label').hasText('Annotations:');
    assert.dom('.annotations ul li').hasText('FOO: bar');
  });

  test('it renders template steps', async function(assert) {
    this.set('jobMock', {
      image: 'int-test:1',
      steps: [{ step1: 'echo hello' }, { step2: 'echo goodbye' }],
      secrets: [],
      environment: {},
      settings: {},
      annotations: {}
    });

    await render(hbs`{{validator-job name="int-test" index=0 job=jobMock}}`);

    assert.dom('h4').hasText('int-test');

    assert.dom('.image .label').hasText('Image:');
    assert.dom('.image .value').hasText('int-test:1');

    assert.dom('.steps .label').hasText('Steps:');
    assert.dom('.steps ul .value').hasText('echo helloecho goodbye');

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

  test('it renders when there are no steps or commands', async function(assert) {
    this.set('jobMock', {
      image: 'int-test:1',
      secrets: [],
      environment: {},
      settings: {},
      annotations: {}
    });

    await render(hbs`{{validator-job name="int-test" index=1 job=jobMock}}`);

    assert.dom('h4').hasText('int-test.1');
    assert.dom('.steps .label').hasText('Steps:');
    assert.dom('.steps ul .value').hasText('');
  });

  test('it handles clicks on header', async function(assert) {
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
    await render(hbs`{{validator-job name="int-test" index=0 job=jobMock isOpen=openMock}}`);

    assert.ok(this.get('openMock'));
    await click('h4');

    return settled().then(async () => {
      assert.notOk(this.get('openMock'));
      await click('h4');

      return settled().then(() => {
        assert.ok(this.get('openMock'));
      });
    });
  });

  test('it renders a description', async function(assert) {
    this.set('jobMock', {
      image: 'int-test:1',
      description: 'This is a description',
      secrets: [],
      environment: {},
      settings: {},
      annotations: {}
    });

    await render(hbs`{{validator-job name="int-test" index=0 job=jobMock}}`);

    assert.dom('h4').hasText('int-test');
    assert.dom('.description .label').hasText('Description:');
    assert.dom('.description .value').hasText('This is a description');
  });

  test('it renders sourcePaths', async function(assert) {
    this.set('jobMock', {
      image: 'int-test:1',
      description: 'This is a description',
      secrets: [],
      environment: {},
      settings: {},
      annotations: {},
      sourcePaths: ['README.md', 'src/folder/']
    });

    await render(hbs`{{validator-job name="int-test" index=0 job=jobMock}}`);

    assert.dom('h4').hasText('int-test');
    assert.dom('.sourcePaths .label').hasText('Source Paths:');
    assert.dom('.sourcePaths .value ul li').hasText('README.mdsrc/folder/');
  });

  test('it renders without a collapsible heading', async function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
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

    await render(hbs`{{validator-job name="int-test" index=0 job=jobMock collapsible=false}}`);
    assert.dom('h4').doesNotExist();
  });
});
