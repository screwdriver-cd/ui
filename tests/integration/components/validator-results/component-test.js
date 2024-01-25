import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, findAll } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | validator results', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders jobs', async function (assert) {
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
        foo: [
          {
            image: 'int-test:1',
            commands: [
              { name: 'step1', command: 'echo hello' },
              { name: 'step2', command: 'echo goodbye' }
            ],
            secrets: [],
            environment: {},
            settings: {}
          }
        ],
        main: [
          {
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
          }
        ]
      }
    });

    await render(hbs`<ValidatorResults @results={{this.validationMock}} />`);
    const jobs = findAll('h4.job');

    assert.dom(jobs[0]).hasText('main');
    assert.dom(jobs[1]).hasText('main.1');
    assert.dom(jobs[2]).hasText('foo');
    assert.dom('.error').hasText('got an error');
    assert.dom('h4.pipeline').hasText('Pipeline Settings');
  });

  test('it renders templates', async function (assert) {
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

    await render(
      hbs`<ValidatorResults @results={{this.validationMock}} @isJobTemplate={{true}} />`
    );

    assert.dom('.error').doesNotExist();
    assert.dom('h4').hasText('batman/batmobile@1.0.0');
  });

  test('it renders templates with a namespace', async function (assert) {
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

    await render(
      hbs`<ValidatorResults @results={{this.validationMock}} @isJobTemplate={{true}} />`
    );

    assert.dom('.error').doesNotExist();
    assert.dom('h4').hasText('batman/batmobile@1.0.0');
  });

  test('it renders joi error results', async function (assert) {
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

    await render(
      hbs`<ValidatorResults @results={{this.validationMock}} @isJobTemplate={{true}} />`
    );

    assert.dom('.error').hasText('there is an error');
    assert.dom('h4').hasText('batman/batmobile@1.0.0');
  });

  test('it renders warnMessages results', async function (assert) {
    this.set('validationMock', {
      warnMessages: ['there is an warning'],
      template: {
        name: 'batman/batmobile',
        version: '1.0.0',
        config: {
          image: 'int-test:1',
          steps: [{ forgreatjustice: 'ba.sh' }]
        }
      }
    });

    await render(
      hbs`<ValidatorResults @results={{this.validationMock}} @isJobTemplate={{true}} />`
    );

    assert.dom('.warning').hasText('there is an warning');
    assert.dom('h4').hasText('batman/batmobile@1.0.0');
  });
});
