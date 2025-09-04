import { resolve } from 'rsvp';
import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import sinon from 'sinon';

const templateServiceStub = Service.extend({
  getOneTemplate() {
    return resolve([
      { id: 4, name: 'baz', version: '10.0.0', namespace: 'foo' },
      { id: 3, name: 'baz', version: '2.0.0', namespace: 'foo' },
      { id: 2, name: 'baz', version: '1.1.0', namespace: 'foo' },
      { id: 1, name: 'baz', version: '1.0.0', namespace: 'foo' },
      { id: 7, name: 'baz', version: '10.0.0', namespace: 'bar' },
      { id: 6, name: 'baz', version: '2.0.0', namespace: 'bar' },
      { id: 5, name: 'baz', version: '1.0.0', namespace: 'bar' }
    ]);
  },
  getOneTemplateWithMetrics() {
    return resolve([
      {
        id: 4,
        name: 'baz',
        version: '10.0.0',
        namespace: 'foo',
        metrics: { jobs: { count: 1 }, builds: { count: 3 } }
      },
      {
        id: 3,
        name: 'baz',
        version: '2.0.0',
        namespace: 'foo',
        metrics: { jobs: { count: 0 }, builds: { count: 0 } }
      },
      {
        id: 2,
        name: 'baz',
        version: '1.1.0',
        namespace: 'foo',
        metrics: { jobs: { count: 7 }, builds: { count: 9 } }
      },
      {
        id: 1,
        name: 'baz',
        version: '1.0.0',
        namespace: 'foo',
        metrics: { jobs: { count: 0 }, builds: { count: 0 } }
      },
      {
        id: 7,
        name: 'baz',
        version: '10.0.0',
        namespace: 'bar',
        metrics: { jobs: { count: 7 }, builds: { count: 7 } }
      },
      {
        id: 6,
        name: 'baz',
        version: '2.0.0',
        namespace: 'bar',
        metrics: { jobs: { count: 0 }, builds: { count: 0 } }
      },
      {
        id: 5,
        name: 'baz',
        version: '1.0.0',
        namespace: 'bar',
        metrics: { jobs: { count: 1 }, builds: { count: 3 } }
      }
    ]);
  },
  getTemplateTags(namespace, name) {
    return resolve([
      { id: 5, name, version: '10.0.0', tag: 'latest' },
      { id: 6, name, version: '10.0.0', tag: 'stable' },
      { id: 7, name, version: '2.0.0', tag: 'meeseeks' }
    ]);
  }
});

const templateServiceStub2 = Service.extend({
  getOneTemplate() {
    return resolve([]);
  },
  getOneTemplateWithMetrics() {
    return resolve([]);
  },
  getTemplateTags() {
    return resolve([]);
  }
});

module('Unit | Route | templates/job/detail', function (hooks) {
  setupTest(hooks);

  test('it asks for the list of templates for a given name', function (assert) {
    this.owner.register('service:template', templateServiceStub);
    const route = this.owner.lookup('route:templates/job/detail');

    assert.ok(route);

    return route.model({ namespace: 'foo', name: 'baz' }).then(templates => {
      assert.equal(templates.templateData.length, 4);
      assert.equal(templates.templateData[0].namespace, 'foo');
      assert.equal(templates.templateData[0].name, 'baz');
      assert.equal(templates.templateData[0].metrics.jobs.count, 1);
      assert.equal(templates.templateData[0].metrics.builds.count, 3);
    });
  });

  test('it asks for the list of templates for a non-exist name', async function (assert) {
    this.owner.register('service:template', templateServiceStub2);
    const route = this.owner.lookup('route:templates/job/detail');
    const stub = sinon.stub();

    const routerServiceMock = Service.extend({
      transitionTo: stub
    });

    this.owner.unregister('service:router');
    this.owner.register('service:router', routerServiceMock);

    assert.ok(route);
    await assert.rejects(route.model({ namespace: 'foo', name: 'hoge' }));
    assert.ok(stub.notCalled);
  });
});
