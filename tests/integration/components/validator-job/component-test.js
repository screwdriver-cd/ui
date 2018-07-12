import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';

moduleForComponent('validator-job', 'Integration | Component | validator job', {
  integration: true
});

test('it renders', function (assert) {
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

  this.render(hbs`{{validator-job name="int-test" index=0 job=jobMock}}`);

  assert.equal(this.$('h4').text().trim(), 'int-test');

  assert.equal(this.$('.image .label').text().trim(), 'Image:');
  assert.equal(this.$('.image .value').text().trim(), 'int-test:1');

  assert.equal(this.$('.steps .label').text().trim(), 'Steps:');
  assert.equal(this.$('.steps ul .value').text().trim(), 'echo helloecho goodbye');

  assert.equal(this.$('.secrets .label').text().trim(), 'Secrets:');
  assert.equal(this.$('.secrets ul li').text().trim(), 'None defined');

  assert.equal(this.$('.env .label').text().trim(), 'Environment Variables:');
  assert.equal(this.$('.env ul li').text().trim(), 'None defined');

  assert.equal(this.$('.settings .label').text().trim(), 'Settings:');
  assert.equal(this.$('.settings ul li').text().trim(), 'None defined');

  assert.equal(this.$('.annotations .label').text().trim(), 'Annotations:');
  assert.equal(this.$('.annotations .value').text().trim(), 'None defined');
});

test('it renders a template, description, images', function (assert) {
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

  this.render(hbs`{{validator-job name="int-test" index=0 job=jobMock template=templateMock}}`);

  assert.equal(this.$('.template-description .label').text().trim(), 'Template Description:');
  assert.equal(this.$('.template-description .value').text().trim(), 'Test template');
  assert.equal(this.$('.images >.label').text().trim(), 'Supported Images:');
  assert.equal(this.$('.images >.value >ul >li:first-of-type').text().replace(/\s+/g, ' ').trim(),
    'stable: node:6');
  assert.equal(this.$('.images >.value >ul >li:nth-of-type(2)').text().replace(/\s+/g, ' ').trim(),
    'development: node:7');
});

test('it renders settings, env, secrets, annotations', function (assert) {
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

  this.render(hbs`{{validator-job name="int-test" index=0 job=jobMock}}`);

  assert.equal(this.$('h4').text().trim(), 'int-test');
  assert.equal(this.$('.secrets .label').text().trim(), 'Secrets:');
  assert.equal(this.$('.secrets ul li').text().trim(), 'FOOBAR');

  assert.equal(this.$('.env .label').text().trim(), 'Environment Variables:');
  assert.equal(this.$('.env ul li').text().trim(), 'FOO: bar');

  assert.equal(this.$('.settings .label').text().trim(), 'Settings:');
  assert.equal(this.$('.settings ul li').text().replace(/\s+/g, ' ').trim(), 'FOO: bar');

  assert.equal(this.$('.annotations .label').text().trim(), 'Annotations:');
  assert.equal(this.$('.annotations ul li').text().trim(), 'FOO: bar');
});

test('it renders template steps', function (assert) {
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

  this.render(hbs`{{validator-job name="int-test" index=0 job=jobMock}}`);

  assert.equal(this.$('h4').text().trim(), 'int-test');

  assert.equal(this.$('.image .label').text().trim(), 'Image:');
  assert.equal(this.$('.image .value').text().trim(), 'int-test:1');

  assert.equal(this.$('.steps .label').text().trim(), 'Steps:');
  assert.equal(this.$('.steps ul .value').text().trim(), 'echo helloecho goodbye');

  assert.equal(this.$('.secrets .label').text().trim(), 'Secrets:');
  assert.equal(this.$('.secrets ul li').text().trim(), 'None defined');

  assert.equal(this.$('.env .label').text().trim(), 'Environment Variables:');
  assert.equal(this.$('.env ul li').text().trim(), 'None defined');

  assert.equal(this.$('.settings .label').text().trim(), 'Settings:');
  assert.equal(this.$('.settings ul li').text().trim(), 'None defined');

  assert.equal(this.$('.annotations .label').text().trim(), 'Annotations:');
  assert.equal(this.$('.annotations .value').text().trim(), 'None defined');

  assert.equal(this.$('.sourcePaths .label').text().trim(), 'Source Paths:');
  assert.equal(this.$('.sourcePaths ul li').text().trim(), 'None defined');
});

test('it renders when there are no steps or commands', function (assert) {
  this.set('jobMock', {
    image: 'int-test:1',
    secrets: [],
    environment: {},
    settings: {},
    annotations: {}
  });

  this.render(hbs`{{validator-job name="int-test" index=1 job=jobMock}}`);

  assert.equal(this.$('h4').text().trim(), 'int-test.1');
  assert.equal(this.$('.steps .label').text().trim(), 'Steps:');
  assert.equal(this.$('.steps ul .value').text().trim(), '');
});

test('it handles clicks on header', function (assert) {
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
  this.render(hbs`{{validator-job name="int-test" index=0 job=jobMock isOpen=openMock}}`);

  assert.ok(this.get('openMock'));
  this.$('h4').click();

  return wait().then(() => {
    assert.notOk(this.get('openMock'));
    this.$('h4').click();

    return wait().then(() => {
      assert.ok(this.get('openMock'));
    });
  });
});

test('it renders a description', function (assert) {
  this.set('jobMock', {
    image: 'int-test:1',
    description: 'This is a description',
    secrets: [],
    environment: {},
    settings: {},
    annotations: {}
  });

  this.render(hbs`{{validator-job name="int-test" index=0 job=jobMock}}`);

  assert.equal(this.$('h4').text().trim(), 'int-test');
  assert.equal(this.$('.description .label').text().trim(), 'Description:');
  assert.equal(this.$('.description .value').text().trim(), 'This is a description');
});

test('it renders sourcePaths', function (assert) {
  this.set('jobMock', {
    image: 'int-test:1',
    description: 'This is a description',
    secrets: [],
    environment: {},
    settings: {},
    annotations: {},
    sourcePaths: ['README.md', 'src/folder/']
  });

  this.render(hbs`{{validator-job name="int-test" index=0 job=jobMock}}`);

  assert.equal(this.$('h4').text().trim(), 'int-test');
  assert.equal(this.$('.sourcePaths .label').text().trim(), 'Source Paths:');
  assert.equal(this.$('.sourcePaths .value ul li').text().trim(), 'README.mdsrc/folder/');
});

test('it renders without a collapsible heading', function (assert) {
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

  this.render(hbs`{{validator-job name="int-test" index=0 job=jobMock collapsible=false}}`);
  assert.equal(this.$('h4').length, 0);
});
