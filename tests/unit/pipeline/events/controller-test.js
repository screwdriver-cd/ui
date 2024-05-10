import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import Pretender from 'pretender';
import Service from '@ember/service';

const sessionServiceMock = Service.extend({
  isAuthenticated: true,
  data: {
    authenticated: {
      // fake token for test, it has { username: apple } inside
      // eslint-disable-next-line max-len
      token:
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImFwcGxlIiwianRpIjoiNTA1NTQzYTUtNDhjZi00OTAyLWE3YTktZGY0NTI1ODFjYWM0IiwiaWF0IjoxNTIxNTcyMDE5LCJleHAiOjE1MjE1NzU2MTl9.ImS1ajOnksl1X74uL85jOjzdUXmBW3HfMdPfP1vjrmc'
    }
  }
});

let server;

module('Unit | Controller | pipeline/events', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    server = new Pretender();
    this.owner.register('service:session', sessionServiceMock);
  });

  hooks.afterEach(function () {
    server.shutdown();
  });

  test('it exists', function (assert) {
    assert.ok(this.owner.lookup('controller:pipeline/events'));
  });
});
