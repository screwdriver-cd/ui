import { resolve } from 'rsvp';
import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import sinonTest from 'ember-sinon-qunit/test-support/test';

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

module('Unit | Route | templates/detail', function(hooks) {
  setupTest(hooks);

  // Specify the other units that are required for this test.
  // needs: ['controller:foo']
  hooks.beforeEach(function beforeEach() {
    this.owner.register('service:template', templateServiceStub);
  });

  test('it asks for the list of templates for a given name without version', function(assert) {
    let route = this.owner.lookup('route:templates/detail');

    assert.ok(route);
    assert.equal(
      route.titleToken({
        namespace: 'foo',
        name: 'baz'
      }),
      'foo/baz'
    );

    return route.model({ namespace: 'foo', name: 'baz' }).then(templates => {
      assert.equal(templates.templateData.length, 4);
      assert.equal(templates.templateData[0].namespace, 'foo');
      assert.equal(templates.templateData[0].name, 'baz');
      assert.equal(templates.versionOrTagFromUrl, undefined);
      assert.equal(templates.templateData[0].metrics.jobs.count, 1);
      assert.equal(templates.templateData[0].metrics.builds.count, 3);
    });
  });

  test('it asks for the list of templates for a given name and exist version', function(assert) {
    let route = this.owner.lookup('route:templates/detail');

    assert.ok(route);
    assert.equal(
      route.titleToken({
        namespace: 'foo',
        name: 'baz',
        versionOrTagFromUrl: '1.0.0'
      }),
      'foo/baz@1.0.0'
    );

    return route.model({ namespace: 'foo', name: 'baz', version: '1.0.0' }).then(templates => {
      assert.equal(templates.templateData.length, 4);
      assert.equal(templates.templateData[0].namespace, 'foo');
      assert.equal(templates.templateData[0].name, 'baz');
      assert.equal(templates.versionOrTagFromUrl, '1.0.0');
      assert.equal(templates.templateData[3].metrics.jobs.count, 0);
      assert.equal(templates.templateData[3].metrics.builds.count, 0);
    });
  });

  test('it asks for the list of templates for a given name and exist version of according to ember', function(assert) {
    let route = this.owner.lookup('route:templates/detail');

    assert.ok(route);

    return route.model({ namespace: 'foo', name: 'baz', version: '1' }).then(templates => {
      assert.equal(templates.templateData.length, 4);
      assert.equal(templates.templateData[0].namespace, 'foo');
      assert.equal(templates.templateData[0].name, 'baz');
      assert.equal(templates.versionOrTagFromUrl, '1.1.0');
      assert.equal(templates.templateData[2].metrics.jobs.count, 7);
      assert.equal(templates.templateData[2].metrics.builds.count, 9);
    });
  });

  test('it asks for the list of templates for a given name and exist tag', function(assert) {
    let route = this.owner.lookup('route:templates/detail');

    assert.ok(route);
    assert.equal(
      route.titleToken({
        namespace: 'foo',
        name: 'baz',
        versionOrTagFromUrl: 'stable'
      }),
      'foo/baz@stable'
    );

    return route.model({ namespace: 'foo', name: 'baz', version: 'stable' }).then(templates => {
      assert.equal(templates.templateData.length, 4);
      assert.equal(templates.templateData[0].namespace, 'foo');
      assert.equal(templates.templateData[0].name, 'baz');
      assert.equal(templates.versionOrTagFromUrl, 'stable');
      assert.equal(templates.templateData[3].metrics.jobs.count, 0);
      assert.equal(templates.templateData[3].metrics.builds.count, 0);
    });
  });

  sinonTest('it asks for the list of templates for a given name and non-exist version', function(
    assert
  ) {
    let route = this.owner.lookup('route:templates/detail');
    const stub = this.stub(route, 'transitionTo');

    assert.ok(route);

    return route.model({ namespace: 'foo', name: 'baz', version: '9.9.9' }).then(() => {
      assert.ok(stub.calledOnce, 'transitionTo was called once');
    });
  });

  sinonTest('it asks for the list of templates for a given name and non-exist tag', function(
    assert
  ) {
    let route = this.owner.lookup('route:templates/detail');
    const stub = this.stub(route, 'transitionTo');

    assert.ok(route);

    return route.model({ namespace: 'foo', name: 'baz', version: 'foo' }).then(() => {
      assert.ok(stub.calledOnce, 'transitionTo was called once');
    });
  });
});
