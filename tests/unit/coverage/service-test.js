import { moduleFor, test } from 'ember-qunit';
import Pretender from 'pretender';
import Service from '@ember/service';

const sessionStub = Service.extend({
  data: {
    authenticated: {
      token: 'faketoken'
    }
  }
});

let server;

moduleFor('service:coverage', 'Unit | Service | coverage ', {
  beforeEach() {
    server = new Pretender();
    this.register('service:session', sessionStub);
  },

  afterEach() {
    server.shutdown();
  }
});

test('it fetches coverage info', function (assert) {
  assert.expect(3);
  server.get('http://localhost:8080/v4/coverage/info', () => [
    200,
    {
      'Content-Type': 'application/json'
    },
    JSON.stringify({ coverage: 98, projectUrl: 'https://sonar.foo.bar' })
  ]);

  let service = this.subject();

  assert.ok(service);

  const config = {
    buildId: 123,
    jobId: 1,
    startTime: '2018-05-10T19:05:53.123Z',
    endTime: '2018-05-10T19:06:53.123Z'
  };

  const p = service.getCoverageInfo(config);

  p.then((data) => {
    const [request] = server.handledRequests;

    assert.deepEqual(data, { coverage: 98, projectUrl: 'https://sonar.foo.bar' });
    assert.deepEqual(request.url,
    // eslint-disable-next-line max-len
      'http://localhost:8080/v4/coverage/info?buildId=123&jobId=1&startTime=2018-05-10T19%3A05%3A53.123Z&endTime=2018-05-10T19%3A06%3A53.123Z');
  });
});

test('it sets default coverage info', function (assert) {
  assert.expect(3);
  server.get('http://localhost:8080/v4/coverage/info', () => [
    200,
    {
      'Content-Type': 'application/json'
    },
    JSON.stringify({})
  ]);

  let service = this.subject();

  assert.ok(service);

  const config = {
    buildId: 123,
    jobId: 1,
    startTime: '2018-05-10T19:05:53.123Z',
    endTime: '2018-05-10T19:06:53.123Z'
  };

  const p = service.getCoverageInfo(config);

  p.then((data) => {
    const [request] = server.handledRequests;

    assert.deepEqual(data, { coverage: '', projectUrl: '#' });
    assert.deepEqual(request.url,
    // eslint-disable-next-line max-len
      'http://localhost:8080/v4/coverage/info?buildId=123&jobId=1&startTime=2018-05-10T19%3A05%3A53.123Z&endTime=2018-05-10T19%3A06%3A53.123Z');
  });
});
