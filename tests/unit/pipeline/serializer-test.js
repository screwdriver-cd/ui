import { run } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { settled } from '@ember/test-helpers';
import Pretender from 'pretender';
let server;
const pipelinePayload = {
  id: 3,
  name: 'adong/sd-sorting-jobs',
  scmUri: 'github.com:242007195:master',
  scmContext: 'github:github.com',
  scmRepo: {
    branch: 'master',
    name: 'adong/sd-sorting-jobs',
    url: 'https://github.com/adong/sd-sorting-jobs/tree/master',
    rootDir: ''
  },
  createTime: '2020-02-20T22:52:36.978Z',
  admins: {
    adong: true
  },
  workflowGraph: {
    nodes: [
      {
        name: '~pr'
      },
      {
        name: '~commit'
      },
      {
        name: 'main',
        id: 34
      },
      {
        name: 'fan1',
        id: 35
      },
      {
        name: 'fan2',
        id: 36
      },
      {
        name: 'fan10',
        id: 37
      }
    ],
    edges: [
      {
        src: '~pr',
        dest: 'main'
      },
      {
        src: '~commit',
        dest: 'main'
      },
      {
        src: 'main',
        dest: 'fan1'
      },
      {
        src: 'main',
        dest: 'fan2'
      },
      {
        src: 'main',
        dest: 'fan10'
      }
    ]
  },
  annotations: {},
  lastEventId: 49,
  prChain: false,
  parameters: {},
  links: {
    events: 'events',
    jobs: 'jobs',
    secrets: 'secrets',
    tokens: 'tokens',
    metrics: 'metrics'
  }
};
const getPipeline = () => {
  server.get('http://localhost:8080/v4/pipelines/3', () => [
    200,
    {
      'Content-Type': 'application/json'
    },
    JSON.stringify(pipelinePayload)
  ]);
};

module('Unit | Serializer | pipeline', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    server = new Pretender();
  });

  hooks.afterEach(function() {
    server.shutdown();
  });

  test('it serializes records', function(assert) {
    let record = run(() => this.owner.lookup('service:store').createRecord('pipeline'));

    let serializedRecord = record.serialize();

    assert.ok(serializedRecord);
  });

  test('it does not post with model name as key', function(assert) {
    assert.expect(2);
    server.post('http://localhost:8080/v4/pipelines', function() {
      return [200, {}, JSON.stringify({ id: 'abcd' })];
    });

    run(() => {
      const pipeline = this.owner.lookup('service:store').createRecord('pipeline', {
        checkoutUrl: 'git@example.com:foo/bar.git'
      });

      pipeline.save().then(() => {
        assert.equal(pipeline.get('id'), 'abcd');
      });
    });

    return settled().then(() => {
      const [request] = server.handledRequests;
      const payload = JSON.parse(request.requestBody);

      assert.deepEqual(payload, {
        checkoutUrl: 'git@example.com:foo/bar.git',
        rootDir: ''
      });
    });
  });

  test('it has workflow edges sorted alphabetically via normalize', function(assert) {
    assert.expect(3);
    getPipeline();

    const alphabeticalSortedOrder = [
      {
        src: 'main',
        dest: 'fan1'
      },
      {
        src: 'main',
        dest: 'fan10'
      },
      {
        src: 'main',
        dest: 'fan2'
      },
      {
        src: '~pr',
        dest: 'main'
      },
      {
        src: '~commit',
        dest: 'main'
      }
    ];

    return this.owner
      .lookup('service:store')
      .findRecord('pipeline', 3)
      .then(pipeline => {
        assert.equal(pipeline.workflowGraph.edges.length, 5, 'has 5 edges');
        assert.deepEqual(
          pipeline.workflowGraph.edges,
          alphabeticalSortedOrder,
          'edges order is sorted'
        );
        assert.notDeepEqual(
          pipeline.workflowGraph.edges,
          pipelinePayload.workflowGraph.edges,
          'payload and response edges order is not the same'
        );
      });
  });
});
