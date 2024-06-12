import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
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

    assert.equal(jobs.length, 3);
    assert.dom(jobs[0]).hasText('foo');
    assert.dom(jobs[1]).hasText('main');
    assert.dom(jobs[2]).hasText('main.1');
    assert.dom('.error').hasText('got an error');
    assert.dom('h4.pipeline').hasText('Pipeline Settings');
  });

  /**
   * Do not show configs of implicit stage setup/teardown jobs
   * Should render stages in the workflow graph
   */
  test('it renders stages', async function (assert) {
    this.set('validationMock', {
      errors: ['got an error'],
      annotations: {},
      jobs: {
        component: [
          {
            annotations: {
              'screwdriver.cd/displayName': 'compJob'
            },
            commands: [
              {
                name: 'init',
                command: "echo 'init'"
              }
            ],
            environment: {},
            image: 'node:14',
            secrets: [],
            settings: {},
            requires: ['~pr', '~commit']
          }
        ],
        publish: [
          {
            annotations: {},
            commands: [
              {
                name: 'init',
                command: "echo 'init'"
              }
            ],
            environment: {},
            image: 'node:14',
            secrets: [],
            settings: {},
            requires: ['component']
          }
        ],
        'ci-deploy': [
          {
            annotations: {},
            commands: [
              {
                name: 'init',
                command: "echo 'init'"
              }
            ],
            environment: {},
            image: 'node:14',
            secrets: [],
            settings: {},
            requires: ['~stage@integration:setup'],
            stage: {
              name: 'integration'
            }
          }
        ],
        'ci-test': [
          {
            annotations: {},
            commands: [
              {
                name: 'init',
                command: "echo 'init'"
              }
            ],
            environment: {},
            image: 'node:14',
            secrets: [],
            settings: {},
            requires: ['ci-deploy'],
            stage: {
              name: 'integration'
            }
          }
        ],
        'ci-certify': [
          {
            annotations: {},
            commands: [
              {
                name: 'init',
                command: "echo 'init'"
              }
            ],
            environment: {},
            image: 'node:14',
            secrets: [],
            settings: {},
            requires: ['ci-test'],
            stage: {
              name: 'integration'
            }
          }
        ],
        'prod-deploy': [
          {
            annotations: {},
            commands: [
              {
                name: 'init',
                command: "echo 'init'"
              }
            ],
            environment: {},
            image: 'node:14',
            secrets: [],
            settings: {},
            requires: ['~stage@production:setup'],
            stage: {
              name: 'production'
            }
          }
        ],
        'prod-test': [
          {
            annotations: {},
            commands: [
              {
                name: 'init',
                command: "echo 'init'"
              }
            ],
            environment: {},
            image: 'node:14',
            secrets: [],
            settings: {},
            requires: ['prod-deploy'],
            stage: {
              name: 'production'
            }
          }
        ],
        'prod-certify': [
          {
            annotations: {},
            commands: [
              {
                name: 'init',
                command: "echo 'init'"
              }
            ],
            environment: {},
            image: 'node:14',
            secrets: [],
            settings: {},
            requires: ['prod-test'],
            stage: {
              name: 'production'
            }
          }
        ],
        'stage@integration:setup': [
          {
            annotations: {
              'screwdriver.cd/virtualJob': true
            },
            commands: [
              {
                name: 'noop',
                command: 'echo noop'
              }
            ],
            environment: {},
            image: 'node:18',
            secrets: [],
            settings: {},
            requires: ['publish'],
            stage: {
              name: 'integration'
            }
          }
        ],
        'stage@integration:teardown': [
          {
            annotations: {
              'screwdriver.cd/virtualJob': true
            },
            commands: [
              {
                name: 'noop',
                command: 'echo noop'
              }
            ],
            environment: {},
            image: 'node:18',
            secrets: [],
            settings: {},
            requires: ['ci-certify'],
            stage: {
              name: 'integration'
            }
          }
        ],
        'stage@production:setup': [
          {
            annotations: {},
            commands: [
              {
                name: 'init',
                command: "echo 'prod setup'"
              }
            ],
            environment: {},
            image: 'node:14',
            secrets: [],
            settings: {},
            requires: ['~stage@integration:teardown'],
            stage: {
              name: 'production'
            }
          }
        ],
        'stage@production:teardown': [
          {
            annotations: {},
            commands: [
              {
                name: 'init',
                command: "echo 'prod teardown'"
              }
            ],
            environment: {},
            image: 'node:14',
            secrets: [],
            settings: {},
            requires: ['prod-certify'],
            stage: {
              name: 'production'
            }
          }
        ]
      },
      workflowGraph: {
        nodes: [
          { name: '~pr' },
          { name: '~commit' },
          { name: 'component', displayName: 'compJob' },
          { name: 'publish' },
          { name: 'ci-deploy', stageName: 'integration' },
          {
            name: 'stage@integration:setup',
            stageName: 'integration',
            virtual: true
          },
          { name: 'ci-test', stageName: 'integration' },
          { name: 'ci-certify', stageName: 'integration' },
          { name: 'prod-deploy', stageName: 'production' },
          { name: 'stage@production:setup', stageName: 'production' },
          { name: 'prod-test', stageName: 'production' },
          { name: 'prod-certify', stageName: 'production' },
          {
            name: 'stage@integration:teardown',
            stageName: 'integration',
            virtual: true
          },
          { name: 'stage@production:teardown', stageName: 'production' }
        ],
        edges: [
          { src: '~pr', dest: 'component' },
          { src: '~commit', dest: 'component' },
          { src: 'component', dest: 'publish', join: true },
          { src: 'stage@integration:setup', dest: 'ci-deploy' },
          { src: 'ci-deploy', dest: 'ci-test', join: true },
          { src: 'ci-test', dest: 'ci-certify', join: true },
          { src: 'stage@production:setup', dest: 'prod-deploy' },
          { src: 'prod-deploy', dest: 'prod-test', join: true },
          { src: 'prod-test', dest: 'prod-certify', join: true },
          { src: 'publish', dest: 'stage@integration:setup', join: true },
          { src: 'ci-certify', dest: 'stage@integration:teardown', join: true },
          { src: 'stage@integration:teardown', dest: 'stage@production:setup' },
          { src: 'prod-certify', dest: 'stage@production:teardown', join: true }
        ]
      },
      parameters: {},
      subscribe: {},
      stages: {
        integration: {
          jobs: ['ci-deploy', 'ci-test', 'ci-certify'],
          requires: ['publish'],
          description:
            'This stage will deploy the latest application to CI environment and certifies it after the tests are passed.'
        },
        production: {
          jobs: ['prod-deploy', 'prod-test', 'prod-certify'],
          requires: ['~stage@integration:teardown'],
          description:
            'This stage will deploy the CI certified application to production environment and certifies it after the tests are passed.'
        }
      }
    });

    await render(hbs`<ValidatorResults @results={{this.validationMock}} />`);

    assert.dom('.error').hasText('got an error');
    assert.dom('h4.pipeline').hasText('Pipeline Settings');

    const jobs = findAll('h4.job');

    assert.equal(jobs.length, 10);
    assert.dom(jobs[0]).hasText('component');
    assert.dom(jobs[1]).hasText('publish');
    assert.dom(jobs[2]).hasText('ci-deploy');
    assert.dom(jobs[3]).hasText('ci-test');
    assert.dom(jobs[4]).hasText('ci-certify');
    assert.dom(jobs[5]).hasText('prod-deploy');
    assert.dom(jobs[6]).hasText('prod-test');
    assert.dom(jobs[7]).hasText('prod-certify');
    assert.dom(jobs[8]).hasText('stage@production:setup');
    assert.dom(jobs[9]).hasText('stage@production:teardown');

    assert.equal(this.element.querySelectorAll('div.workflow svg').length, 1);
    assert.equal(
      this.element.querySelectorAll('svg > g.graph-node').length,
      12
    );
    assert.equal(
      this.element.querySelectorAll('svg > path.graph-edge').length,
      11
    );

    assert.equal(
      this.element.querySelectorAll('svg > .stage-container').length,
      2
    );
    assert.equal(
      this.element.querySelectorAll(
        'svg > .stage-info-wrapper .stage-info .stage-name'
      ).length,
      2
    );
    assert
      .dom('svg > .stage-info-wrapper:nth-of-type(1) .stage-info .stage-name')
      .hasText('integration');
    assert
      .dom('svg > .stage-info-wrapper:nth-of-type(2) .stage-info .stage-name')
      .hasText('production');
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

  test('it renders a pipeline template', async function (assert) {
    this.set('validationMock', {
      errors: [],
      template: {
        namespace: 'batman',
        name: 'batmobile',
        version: '1.0.0',
        config: {
          cache: {
            pipeline: ['node_modules']
          },
          shared: {
            image: 'int-test:1'
          },
          jobs: {
            main: {
              steps: [{ forgreatjustice: 'ba.sh' }]
            },
            publish: {
              steps: [{ joker: 'ha' }]
            }
          }
        }
      }
    });

    await render(
      hbs`<ValidatorResults @results={{this.validationMock}} @isPipelineTemplate={{true}} />`
    );

    assert.dom('.error').doesNotExist();
    assert.dom('h4').hasText('batman/batmobile@1.0.0');
    assert.dom('span').hasText('node_modules');
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
    assert.dom('span').hasText('batman/batmobile@1.0.0');
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
