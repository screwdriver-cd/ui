import { test } from 'qunit';
import moduleForAcceptance from 'screwdriver-ui/tests/helpers/module-for-acceptance';
import { authenticateSession } from 'screwdriver-ui/tests/helpers/ember-simple-auth';
import Pretender from 'pretender';
let server;

moduleForAcceptance('Acceptance | create', {
  beforeEach() {
    server = new Pretender();

    server.get('http://localhost:8080/v4/collections', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([])
    ]);
  },
  afterEach() {
    server.shutdown();
  }
});

test('/create a pipeline: not logged in will redirect', function (assert) {
  visit('/create');

  andThen(() => {
    assert.equal(currentURL(), '/login');
  });
});

test('/create a pipeline: SUCCESS', function (assert) {
  server.post('http://localhost:8080/v4/pipelines', () => [
    200,
    { 'Content-Type': 'application/json' },
    JSON.stringify({
      id: '1'
    })
  ]);

  server.get('http://localhost:8080/v4/pipelines/1', () => [
    200,
    { 'Content-Type': 'application/json' },
    JSON.stringify({
      id: '1'
    })
  ]);

  server.get('http://localhost:8080/v4/pipelines/1/events', () => [
    200,
    { 'Content-Type': 'application/json' },
    JSON.stringify([])
  ]);

  server.get('http://localhost:8080/v4/builds', () => [
    200,
    { 'Content-Type': 'application/json' },
    JSON.stringify([])
  ]);

  server.get('http://localhost:8080/v4/pipelines/1/jobs', () => [
    200,
    { 'Content-Type': 'application/json' },
    JSON.stringify([])
  ]);

  authenticateSession(this.application, { token: 'faketoken' });

  visit('/create');

  andThen(() => {
    assert.equal(currentURL(), '/create');
    fillIn('.text-input', 'git@github.com:foo/bar.git');
    triggerEvent('.text-input', 'keyup');
    click('button.blue-button');
    andThen(() => {
      assert.equal(currentURL(), '/pipelines/1/events');
    });
  });
});

test('/create a pipeline: FAILURE', function (assert) {
  server.post('http://localhost:8080/v4/pipelines', () => [
    409,
    { 'Content-Type': 'application/json' },
    JSON.stringify({
      statusCode: 409,
      error: 'Conflict',
      message: 'something conflicting'
    })
  ]);

  authenticateSession(this.application, { token: 'faketoken' });

  visit('/create');

  andThen(() => {
    assert.equal(currentURL(), '/create');
    fillIn('.text-input', 'git@github.com:foo/bar.git');
    triggerEvent('.text-input', 'keyup');
    click('button.blue-button');
    andThen(() => {
      assert.equal(currentURL(), '/create');
      assert.equal(find('.alert > span').text(), 'something conflicting');
    });
  });
});
