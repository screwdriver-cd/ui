import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, settled, click, findAll, find } from '@ember/test-helpers';
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

    assert.equal(find('h4').textContent.trim(), 'int-test');

    assert.equal(find('.image .label').textContent.trim(), 'Image:');
    assert.equal(find('.image .value').textContent.trim(), 'int-test:1');

    assert.equal(find('.steps .label').textContent.trim(), 'Steps:');
    assert.equal(find('.steps ul .value').textContent.trim(), 'echo helloecho goodbye');

    assert.equal(find('.secrets .label').textContent.trim(), 'Secrets:');
    assert.equal(find('.secrets ul li').textContent.trim(), 'None defined');

    assert.equal(find('.env .label').textContent.trim(), 'Environment Variables:');
    assert.equal(find('.env ul li').textContent.trim(), 'None defined');

    assert.equal(find('.settings .label').textContent.trim(), 'Settings:');
    assert.equal(find('.settings ul li').textContent.trim(), 'None defined');

    assert.equal(find('.annotations .label').textContent.trim(), 'Annotations:');
    assert.equal(find('.annotations .value').textContent.trim(), 'None defined');
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

    assert.equal(find('.template-description .label').textContent.trim(), 'Template Description:');
    assert.equal(find('.template-description .value').textContent.trim(), 'Test template');
    assert.equal(find('.images >.label').textContent.trim(), 'Supported Images:');
    assert.equal(this.$('.images >.value >ul >li:first-of-type').text().replace(/\s+/g, ' ').trim(),
      'stable: node:6');
    assert.equal(find('.images >.value >ul >li:nth-of-type(2)').textContent.replace(/\s+/g, ' ').trim(),
      'development: node:7');
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

    assert.equal(find('h4').textContent.trim(), 'int-test');
    assert.equal(find('.secrets .label').textContent.trim(), 'Secrets:');
    assert.equal(find('.secrets ul li').textContent.trim(), 'FOOBAR');

    assert.equal(find('.env .label').textContent.trim(), 'Environment Variables:');
    assert.equal(find('.env ul li').textContent.trim(), 'FOO: bar');

    assert.equal(find('.settings .label').textContent.trim(), 'Settings:');
    assert.equal(find('.settings ul li').textContent.replace(/\s+/g, ' ').trim(), 'FOO: bar');

    assert.equal(find('.annotations .label').textContent.trim(), 'Annotations:');
    assert.equal(find('.annotations ul li').textContent.trim(), 'FOO: bar');
  });

  test('it renders template steps', async function(assert) {
    this.set('jobMock', {
      image: 'int-test:1',
      steps: [
        { step1: 'echo hello' },
        { step2: 'echo goodbye' }
      ],
      secrets: [],
      environment: {},
      settings: {},
      annotations: {}
    });

    await render(hbs`{{validator-job name="int-test" index=0 job=jobMock}}`);

    assert.equal(find('h4').textContent.trim(), 'int-test');

    assert.equal(find('.image .label').textContent.trim(), 'Image:');
    assert.equal(find('.image .value').textContent.trim(), 'int-test:1');

    assert.equal(find('.steps .label').textContent.trim(), 'Steps:');
    assert.equal(find('.steps ul .value').textContent.trim(), 'echo helloecho goodbye');

    assert.equal(find('.secrets .label').textContent.trim(), 'Secrets:');
    assert.equal(find('.secrets ul li').textContent.trim(), 'None defined');

    assert.equal(find('.env .label').textContent.trim(), 'Environment Variables:');
    assert.equal(find('.env ul li').textContent.trim(), 'None defined');

    assert.equal(find('.settings .label').textContent.trim(), 'Settings:');
    assert.equal(find('.settings ul li').textContent.trim(), 'None defined');

    assert.equal(find('.annotations .label').textContent.trim(), 'Annotations:');
    assert.equal(find('.annotations .value').textContent.trim(), 'None defined');

    assert.equal(find('.sourcePaths .label').textContent.trim(), 'Source Paths:');
    assert.equal(find('.sourcePaths ul li').textContent.trim(), 'None defined');
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

    assert.equal(find('h4').textContent.trim(), 'int-test.1');
    assert.equal(find('.steps .label').textContent.trim(), 'Steps:');
    assert.equal(find('.steps ul .value').textContent.trim(), '');
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

    assert.equal(find('h4').textContent.trim(), 'int-test');
    assert.equal(find('.description .label').textContent.trim(), 'Description:');
    assert.equal(find('.description .value').textContent.trim(), 'This is a description');
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

    assert.equal(find('h4').textContent.trim(), 'int-test');
    assert.equal(find('.sourcePaths .label').textContent.trim(), 'Source Paths:');
    assert.equal(find('.sourcePaths .value ul li').textContent.trim(), 'README.mdsrc/folder/');
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
    assert.equal(findAll('h4').length, 0);
  });
});
