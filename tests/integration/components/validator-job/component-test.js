import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

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

  assert.equal(this.$('.settings .label').text().trim(), 'Job Settings:');
  assert.equal(this.$('.settings ul li').text().trim(), 'None defined');
});

test('it renders settings, env, secrets', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
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
    }
  });

  this.render(hbs`{{validator-job name="int-test" index=0 job=jobMock}}`);

  assert.equal(this.$('h4').text().trim(), 'int-test');
  assert.equal(this.$('.secrets .label').text().trim(), 'Secrets:');
  assert.equal(this.$('.secrets ul li').text().trim(), 'FOOBAR');

  assert.equal(this.$('.env .label').text().trim(), 'Environment Variables:');
  assert.equal(this.$('.env ul li').text().trim(), 'FOO: bar');

  assert.equal(this.$('.settings .label').text().trim(), 'Job Settings:');
  assert.equal(this.$('.settings ul li').text().trim(), 'FOO: bar');
});
