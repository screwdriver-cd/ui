import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, find } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | validator results', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders jobs', async function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    this.set('validationMock', {
      errors: ['got an error'],
      workflow: ['main', 'foo'],
      workflowGraph: {
        nodes: [
          { name: '~pr' },
          { name: '~commit' },
          { name: 'main' },
          { name: 'foo' }
        ],
        edges: []
      },
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

    await render(hbs`{{validator-results results=validationMock}}`);

    assert.equal(find('.error').textContent.trim(), 'got an error');
    assert.equal(find('h4.pipeline').textContent.trim(), 'Pipeline Settings');
    assert.equal(find('h4.job').textContent.trim(), 'main main.1 foo');
  });

  test('it renders templates', async function(assert) {
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

    await render(hbs`{{validator-results results=validationMock isTemplate=true}}`);

    assert.equal(find('.error').textContent.trim(), '');
    assert.equal(find('h4').textContent.trim(), 'batman/batmobile@1.0.0');
  });

  test('it renders templates with a namespace', async function(assert) {
    this.set('validationMock', {
      errors: [],
      template: {
        namespace: 'batman',
        name: 'batmobile',
        version: '1.0.0',
        config: {
          image: 'int-test:1',
          steps: [{ forgreatjustice: 'ba.sh' }]
        }
      }
    });

    await render(hbs`{{validator-results results=validationMock isTemplate=true}}`);

    assert.equal(find('.error').textContent.trim(), '');
    assert.equal(find('h4').textContent.trim(), 'batman/batmobile@1.0.0');
  });

  test('it renders joi error results', async function(assert) {
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

    await render(hbs`{{validator-results results=validationMock isTemplate=true}}`);

    assert.equal(find('.error').textContent.trim(), 'there is an error');
    assert.equal(find('h4').textContent.trim(), 'batman/batmobile@1.0.0');
  });
});
