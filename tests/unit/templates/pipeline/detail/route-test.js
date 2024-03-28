import { resolve } from 'rsvp';
import { module, test } from 'qunit';
import Service from '@ember/service';
import { setupTest } from 'screwdriver-ui/tests/helpers';

const templateServiceStub = Service.extend({
  getPipelineTemplateMeta(/* namespace, name */) {
    return resolve({
      id: 14,
      pipelineId: 13606,
      namespace: 'adong',
      name: 'sd-job-template-builder',
      maintainer: 'adong@yahooinc.com',
      latestVersion: '1.0.2',
      createTime: '2024-03-27T17:29:23.242Z',
      updateTime: '2024-03-27T17:30:53.396Z',
      templateType: 'PIPELINE'
    });
  },
  getPipelineTemplateVersions(/* namespace, name */) {
    return resolve([
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
                  install_prerequisites: 'npm install screwdriver-template-main'
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
                  install_prerequisites: 'npm install screwdriver-template-main'
                },
                {
                  publish: './node_modules/.bin/template-publish'
                }
              ]
            }
          },
          parameters: {}
        },
        createTime: '2024-03-27T17:30:53.391Z'
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
                  install_prerequisites: 'npm install screwdriver-template-main'
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
                  install_prerequisites: 'npm install screwdriver-template-main'
                },
                {
                  publish: './node_modules/.bin/template-publish'
                }
              ]
            }
          },
          parameters: {}
        },
        createTime: '2024-03-27T17:30:28.922Z'
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
                  install_prerequisites: 'npm install screwdriver-template-main'
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
                  install_prerequisites: 'npm install screwdriver-template-main'
                },
                {
                  publish: './node_modules/.bin/template-publish'
                }
              ]
            }
          },
          parameters: {}
        },
        createTime: '2024-03-27T17:29:23.242Z'
      }
    ]);
  },
  getPipelineTemplateTags(/* namespace, name */) {
    return resolve([]);
  }
});

module('Unit | Route | templates/pipeline/detail', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function beforeEach() {
    this.owner.register('service:template', templateServiceStub);
  });

  test('it exists', function (assert) {
    let route = this.owner.lookup('route:templates/pipeline/detail');

    assert.ok(route);
  });

  test('it renders pipeline data with metadata', function (assert) {
    let route = this.owner.lookup('route:templates/pipeline/detail');

    const expectedPipelineTemplateVersions = [
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
                  install_prerequisites: 'npm install screwdriver-template-main'
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
                  install_prerequisites: 'npm install screwdriver-template-main'
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
        fullName: 'adong/sd-job-template-builder'
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
                  install_prerequisites: 'npm install screwdriver-template-main'
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
                  install_prerequisites: 'npm install screwdriver-template-main'
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
        fullName: 'adong/sd-job-template-builder'
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
                  install_prerequisites: 'npm install screwdriver-template-main'
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
                  install_prerequisites: 'npm install screwdriver-template-main'
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
        fullName: 'adong/sd-job-template-builder'
      }
    ];

    return route
      .model({
        namespace: 'adong',
        name: 'sd-job-template-builder'
      })
      .then(
        ({
          /* name,
        namespace,
        pipelineTemplateMeta,
        pipelineTemplateTags, */
          pipelineTemplateVersions
        }) => {
          assert.deepEqual(
            pipelineTemplateVersions,
            expectedPipelineTemplateVersions
          );
        }
      );
  });
});
