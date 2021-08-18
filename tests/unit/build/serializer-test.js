import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Pretender from 'pretender';
let server;

module('Unit | Serializer | build', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    server = new Pretender();
  });

  hooks.afterEach(function () {
    server.shutdown();
  });

  test('it converts container to buildContainer and haves right defaults', async function (assert) {
    assert.expect(2);
    server.get('http://localhost:8080/v4/builds/abcd', function () {
      return [200, {}, JSON.stringify({ id: 'abcd', container: 'node:6' })];
    });

    const build = await this.owner
      .lookup('service:store')
      .findRecord('build', 'abcd');

    assert.equal(build.get('buildContainer'), 'node:6');
    assert.equal(build.get('statusMessage'), null);
  });

  test('it POSTs only a jobId for create', async function (assert) {
    assert.expect(2);
    server.post('http://localhost:8080/v4/builds', function () {
      return [200, {}, JSON.stringify({ id: 'abcd' })];
    });

    const build = await this.owner
      .lookup('service:store')
      .createRecord('build', { jobId: '1234' });

    await build.save();

    assert.equal(build.get('id'), 'abcd');

    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.deepEqual(payload, { jobId: '1234' });
  });

  test('it PUTs only a status for update', async function (assert) {
    assert.expect(1);
    server.put('http://localhost:8080/v4/builds/1234', function () {
      return [200, {}, JSON.stringify({ id: 1234 })];
    });

    this.owner.lookup('service:store').push({
      data: {
        id: 1234,
        type: 'build',
        attributes: {
          jobId: 'abcd',
          status: 'RUNNING'
        }
      }
    });

    const build = await this.owner
      .lookup('service:store')
      .peekRecord('build', 1234);

    build.set('status', 'ABORTED');

    await build.save();

    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.deepEqual(payload, { status: 'ABORTED' });
  });
});
