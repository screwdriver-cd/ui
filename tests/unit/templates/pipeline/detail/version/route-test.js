import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';

module('Unit | Route | templates/pipeline/detail/version', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    let route = this.owner.lookup('route:templates/pipeline/detail/version');

    assert.ok(route);
  });

  test('it renders 1.0.2 as versionOrTagFromUrl template version', function (assert) {
    let route = this.owner.lookup('route:templates/pipeline/detail/version');

    const oldModelFor = route.modelFor;

    route.modelFor = () => {
      return {
        pipelineTemplateVersions: [
          {
            id: 79,
            templateId: 14,
            description: 'Pipeline to validate and publish pipeline template',
            version: '1.0.2',
            config: {
              shared: {
                image: 'node:18'
              },
              jobs: {
                validate: {
                  requires: ['~pr', '~commit'],
                  steps: [
                    {
                      install_prerequisites:
                        'npm install screwdriver-template-main'
                    },
                    {
                      validate_default_template:
                        './node_modules/.bin/template-validate'
                    }
                  ]
                },
                publish: {
                  requires: ['validate'],
                  steps: [
                    {
                      install_prerequisites:
                        'npm install screwdriver-template-main'
                    },
                    {
                      publish: './node_modules/.bin/template-publish'
                    }
                  ]
                }
              },
              parameters: {}
            },
            createTime: '2024-03-27T17:30:53.391Z',
            pipelineId: 13606,
            name: 'sd-job-template-builder',
            namespace: 'adong',
            fullName: 'adong/sd-job-template-builder',
            metrics: {
              jobs: {
                count: ''
              },
              builds: {
                count: ''
              },
              pipelines: {
                count: ''
              }
            }
          },
          {
            id: 78,
            templateId: 14,
            description: 'Pipeline to validate and publish pipeline template',
            version: '1.0.1',
            config: {
              shared: {
                image: 'node:18'
              },
              jobs: {
                validate: {
                  requires: ['~pr', '~commit'],
                  steps: [
                    {
                      install_prerequisites:
                        'npm install screwdriver-template-main'
                    },
                    {
                      validate_default_template:
                        './node_modules/.bin/template-validate'
                    }
                  ]
                },
                publish: {
                  requires: ['validate'],
                  steps: [
                    {
                      install_prerequisites:
                        'npm install screwdriver-template-main'
                    },
                    {
                      publish: './node_modules/.bin/template-publish'
                    }
                  ]
                }
              },
              parameters: {}
            },
            createTime: '2024-03-27T17:30:28.922Z',
            pipelineId: 13606,
            name: 'sd-job-template-builder',
            namespace: 'adong',
            fullName: 'adong/sd-job-template-builder',
            metrics: {
              jobs: {
                count: ''
              },
              builds: {
                count: ''
              },
              pipelines: {
                count: ''
              }
            }
          },
          {
            id: 77,
            templateId: 14,
            description: 'Pipeline to validate and publish pipeline template',
            version: '1.0.0',
            config: {
              shared: {
                image: 'node:18'
              },
              jobs: {
                validate: {
                  requires: ['~pr', '~commit'],
                  steps: [
                    {
                      install_prerequisites:
                        'npm install screwdriver-template-main'
                    },
                    {
                      validate_default_template:
                        './node_modules/.bin/template-validate'
                    }
                  ]
                },
                publish: {
                  requires: ['validate'],
                  steps: [
                    {
                      install_prerequisites:
                        'npm install screwdriver-template-main'
                    },
                    {
                      publish: './node_modules/.bin/template-publish'
                    }
                  ]
                }
              },
              parameters: {}
            },
            createTime: '2024-03-27T17:29:23.242Z',
            pipelineId: 13606,
            name: 'sd-job-template-builder',
            namespace: 'adong',
            fullName: 'adong/sd-job-template-builder',
            metrics: {
              jobs: {
                count: ''
              },
              builds: {
                count: ''
              },
              pipelines: {
                count: ''
              }
            }
          }
        ],
        pipelineTemplateTags: []
      };
    };

    return route
      .model({
        version: '1.0.2'
      })
      .then(() => {
        const versionOrTagFromUrl = route
          .controllerFor('templates.pipeline.detail')
          .get('versionOrTagFromUrl');

        assert.equal(versionOrTagFromUrl, '1.0.2');
        route.modelFor = oldModelFor;
      });
  });
});
