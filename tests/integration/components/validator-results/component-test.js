import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('validator-results', 'Integration | Component | validator results', {
  integration: true
});

test('it renders jobs', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.set('validationMock', {
    errors: ['got an error'],
    workflow: ['main', 'foo'],
    jobs: {
      foo: [{
        image: 'int-test:1',
        commands: [
          { name: 'step1', command: 'echo hello' },
          { name: 'step2', command: 'echo goodbye' }
        ],
        secrets: [],
        environment: {},
        settings: {}
      }],
      main: [{
        image: 'int-test:1',
        commands: [
          { name: 'step1', command: 'echo hello' },
          { name: 'step2', command: 'echo goodbye' }
        ],
        secrets: [],
        environment: {},
        settings: {}
      },
      {
        image: 'int-test:1',
        commands: [
          { name: 'step1', command: 'echo hello' },
          { name: 'step2', command: 'echo goodbye' }
        ],
        secrets: [],
        environment: {},
        settings: {}
      }]
    }
  });

  this.render(hbs`{{validator-results results=validationMock}}`);

  assert.equal(this.$('.error').text().trim(), 'got an error');
  assert.equal(this.$('h4.pipeline').text().trim(), 'Pipeline Settings');
  assert.equal(this.$('h4.job').text().trim(), 'main main.1 foo');
});

test('it renders templates', function (assert) {
  this.set('validationMock', {
    errors: [],
    template: {
      name: 'batman/batmobile',
      version: '1.0.0',
      config: {
        image: 'int-test:1',
        steps: [{ forgreatjustice: 'ba.sh' }]
      }
    }
  });

  this.render(hbs`{{validator-results results=validationMock isTemplate=true}}`);

  assert.equal(this.$('.error').text().trim(), '');
  assert.equal(this.$('h4').text().trim(), 'batman/batmobile@1.0.0');
});

test('it renders joi error results', function (assert) {
  this.set('validationMock', {
    errors: [{ message: 'there is an error' }],
    template: {
      name: 'batman/batmobile',
      version: '1.0.0',
      config: {
        image: 'int-test:1',
        steps: [{ forgreatjustice: 'ba.sh' }]
      }
    }
  });

  this.render(hbs`{{validator-results results=validationMock isTemplate=true}}`);

  assert.equal(this.$('.error').text().trim(), 'there is an error');
  assert.equal(this.$('h4').text().trim(), 'batman/batmobile@1.0.0');
});
