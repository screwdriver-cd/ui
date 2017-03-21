import { moduleFor, test } from 'ember-qunit';
import Pretender from 'pretender';
let server;

const manifest = `.
./coverage
./coverage/coverage.json
./test.txt`;

const buildId = 1;

const parsedManifest = [{
  text: 'coverage',
  type: 'directory',
  children: [{
    text: 'coverage.json',
    type: 'file',
    a_attr: { href: `http://localhost:80/v1/builds/${buildId}/ARTIFACTS/coverage/coverage.json` }
  }]
},
{
  text: 'test.txt',
  type: 'file',
  a_attr: { href: `http://localhost:80/v1/builds/${buildId}/ARTIFACTS/test.txt` }
}
];

const getManifest = () => {
  server.get(`http://localhost:80/v1/builds/${buildId}/ARTIFACTS/manifest.txt`, () => [
    200,
    {
      'Content-Type': 'text/plain'
    },
    manifest
  ]);
};

moduleFor('service:build-artifact', 'Unit | Service | build artifact', {
  // Specify the other units that are required for this test.
  // needs: ['service:foo']

  beforeEach() {
    server = new Pretender();
  },

  afterEach() {
    server.shutdown();
  }
});

test('it exists', function (assert) {
  let service = this.subject();

  assert.ok(service);
});

test('it makes a call to get artifact manifest successfully', function (assert) {
  assert.expect(2);
  getManifest();
  const service = this.subject();
  const p = service.fetchManifest(buildId);

  p.then((data) => {
    const [request] = server.handledRequests;

    assert.equal(request.url, `http://localhost:80/v1/builds/${buildId}/ARTIFACTS/manifest.txt`);
    assert.deepEqual(data, parsedManifest);
  });
});
