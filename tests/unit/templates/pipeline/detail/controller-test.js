import { resolve } from 'rsvp';
import { module, test } from 'qunit';
import Service from '@ember/service';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import Controller from '@ember/controller';

const templateServiceStub = Service.extend({
  deletePipelineTemplate() {
    return resolve();
  },
  deletePipelineTemplateByVersion() {
    return resolve();
  }
});

const sessionServiceMock = Service.extend({
  isAuthenticated: true,
  data: {
    authenticated: {
      // fake token for test, it has { username: apple } inside
      // eslint-disable-next-line max-len
      token:
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImFwcGxlIiwic2NvcGUiOlsidXNlciIsImFkbWluIl0sImp0aSI6IjUwNTU0M2E1LTQ4Y2YtNDkwMi1hN2E5LWRmNDUyNTgxY2FjNCIsImlhdCI6MTUyMTU3MjAxOSwiZXhwIjoxNTIxNTc1NjE5fQ.85SkUix6FemFGM5SU6hJ1NzzI0fFS_9JxQw6Qt-Cnsc'
    }
  }
});

const modelMock = {
  name: 'sd-job-template-builder',
  namespace: 'adong',
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
      trusted: true,
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
  ],
  pipelineTemplateTags: [],
  pipelineTemplateMeta: {
    id: 14,
    pipelineId: 13606,
    namespace: 'adong',
    name: 'sd-job-template-builder',
    maintainer: 'adong@example.com',
    trustedSinceVersion: '1.0.2',
    latestVersion: '1.0.2',
    createTime: '2024-03-27T17:29:23.242Z',
    updateTime: '2024-03-27T17:30:53.396Z',
    templateType: 'PIPELINE'
  }
};

module('Unit | Controller | templates/pipeline/detail', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function beforeEach() {
    this.owner.register('service:session', sessionServiceMock);
    this.owner.register('service:template', templateServiceStub);
  });

  test('it exists', function (assert) {
    let controller = this.owner.lookup('controller:templates/pipeline/detail');

    assert.ok(controller);
  });

  test('it handles template deletion', function (assert) {
    const controller = this.owner.lookup(
      'controller:templates/pipeline/detail'
    );

    controller.set('model', modelMock);

    controller.router.transitionTo = route => {
      assert.equal(route, '/templates/pipeline');
    };

    controller.send('removeTemplate');
  });

  test('it handles template version deletion', function (assert) {
    const controller = this.owner.lookup(
      'controller:templates/pipeline/detail'
    );

    controller.set('model', modelMock);

    controller.set(
      'target',
      Controller.extend({
        actions: {
          reloadModel: () => assert.ok(true, 'reloadModel action bubbled')
        }
      }).create()
    );

    controller.send('removeVersion');
  });

  test('it handles template update trust', function (assert) {
    const controller = this.owner.lookup(
      'controller:templates/pipeline/detail'
    );

    controller.set('model', modelMock);
    const isTrusted = controller.selectedVersionTemplate.trusted;

    controller.set(
      'template.updateTrustPipelineTemplate',
      (namespace, name, toggleTrust) => {
        assert.equal(isTrusted, !toggleTrust);

        return resolve();
      }
    );

    controller.send('updateTrust');
  });
});
