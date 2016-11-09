import { test } from 'qunit';
import moduleForAcceptance from 'screwdriver-ui/tests/helpers/module-for-acceptance';
import { authenticateSession } from 'screwdriver-ui/tests/helpers/ember-simple-auth';
import Pretender from 'pretender';
let server;

moduleForAcceptance('Acceptance | create', {
  beforeEach() {
    server = new Pretender();
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
      id: 'abcd'
    })
  ]);

  server.get('http://localhost:8080/v4/pipelines/abcd', () => [
    200,
    { 'Content-Type': 'application/json' },
    JSON.stringify({
      id: 'abcd'
    })
  ]);

  server.get('http://localhost:8080/v4/pipelines/abcd/events', () => [
    200,
    { 'Content-Type': 'application/json' },
    JSON.stringify([])
  ]);

  server.get('http://localhost:8080/v4/builds', () => [
    200,
    { 'Content-Type': 'application/json' },
    JSON.stringify([])
  ]);

  server.get('http://localhost:8080/v4/pipelines/abcd/jobs', () => [
    200,
    { 'Content-Type': 'application/json' },
    JSON.stringify([])
  ]);

  authenticateSession(this.application, { token: 'faketoken' });

  visit('/create');

  andThen(() => {
    assert.equal(currentURL(), '/create');
    fillIn('.scm-url', 'git@github.com:foo/bar.git');
    triggerEvent('.scm-url', 'keyup');
    click('input.blue-button');
    andThen(() => {
      click('button');
      andThen(() => {
        assert.equal(currentURL(), '/pipelines/abcd');
      });
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
    fillIn('.scm-url', 'git@github.com:foo/bar.git');
    triggerEvent('.scm-url', 'keyup');
    click('input.blue-button');
    andThen(() => {
      click('button');
      andThen(() => {
        assert.equal(currentURL(), '/create');
        assert.equal(find('.info-message span').text(), 'something conflicting');
      });
    });
  });
});
