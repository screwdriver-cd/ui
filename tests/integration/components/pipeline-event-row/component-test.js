import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import EmberObject from '@ember/object';
import Service from '@ember/service';
import { assign } from '@ember/polyfills';
import { copy } from 'ember-copy';
import { Promise as EmberPromise } from 'rsvp';
import { toCustomLocaleString } from 'screwdriver-ui/utils/time-range';

const event = {
  id: 3,
  startFrom: '~commit',
  status: 'SUCCESS',
  type: 'pipeline',
  causeMessage: 'test',
  sha: 'sha3',
  commit: {
    author: {
      url: '#',
      name: 'batman'
    },
    url: '#',
    message: 'this was a test'
  },
  creator: {
    url: '#',
    name: 'batman'
  },
  createTime: '06/30/2021, 04:39 PM',
  createTimeWords: 'now',
  createTimeExact: '06/30/2021, 04:39 PM',
  durationText: '1 sec',
  truncatedMessage: 'this was a test',
  truncatedSha: 'abc123',
  workflowGraph: {
    nodes: [
      { name: '~pr' },
      { name: '~commit' },
      { name: '~sd@456:test' },
      { id: 1, name: 'main' },
      { id: 2, name: 'A' },
      { id: 3, name: 'B' }
    ],
    edges: [
      { src: '~pr', dest: 'main' },
      { src: '~commit', dest: 'main' },
      { src: '~sd@456:test', dest: 'main' },
      { src: 'main', dest: 'A' },
      { src: 'A', dest: 'B' }
    ]
  },
  builds: [
    { jobId: 1, id: 4, status: 'SUCCESS' },
    { jobId: 2, id: 5, status: 'SUCCESS' },
    { jobId: 3, id: 6, status: 'FAILURE' }
  ],
  isRunning: false
};

const eventWithLabel = {
  id: 3,
  startFrom: '~commit',
  status: 'SUCCESS',
  type: 'pipeline',
  causeMessage: 'test',
  sha: 'sha3',
  commit: {
    author: {
      url: '#',
      name: 'batman'
    },
    url: '#',
    message: 'this was a test'
  },
  creator: {
    url: '#',
    name: 'batman'
  },
  createTime: '06/30/2021, 04:39 PM',
  createTimeWords: 'now',
  createTimeExact: '06/30/2021, 04:39 PM',
  durationText: '1 sec',
  truncatedMessage: 'this was a test',
  truncatedSha: 'abc123',
  workflowGraph: {
    nodes: [
      { name: '~pr' },
      { name: '~commit' },
      { name: '~sd@456:test' },
      { id: 1, name: 'main' },
      { id: 2, name: 'A' },
      { id: 3, name: 'B' }
    ],
    edges: [
      { src: '~pr', dest: 'main' },
      { src: '~commit', dest: 'main' },
      { src: '~sd@456:test', dest: 'main' },
      { src: 'main', dest: 'A' },
      { src: 'A', dest: 'B' }
    ]
  },
  builds: [
    { jobId: 1, id: 4, status: 'SUCCESS' },
    { jobId: 2, id: 5, status: 'SUCCESS' },
    { jobId: 3, id: 6, status: 'FAILURE' }
  ],
  isRunning: false,
  label: 'Yahoo new project, and Version #2.0'
};

const eventWithLinksInLabel = {
  id: 3,
  startFrom: '~commit',
  status: 'SUCCESS',
  type: 'pipeline',
  causeMessage: 'test',
  sha: 'sha3',
  commit: {
    author: {
      url: '#',
      name: 'batman'
    },
    url: '#',
    message: 'this was a test'
  },
  creator: {
    url: '#',
    name: 'batman'
  },
  createTime: '06/30/2021, 04:39 PM',
  createTimeWords: 'now',
  createTimeExact: '06/30/2021, 04:39 PM',
  durationText: '1 sec',
  truncatedMessage: 'this was a test',
  truncatedSha: 'abc123',
  workflowGraph: {
    nodes: [
      { name: '~pr' },
      { name: '~commit' },
      { name: '~sd@456:test' },
      { id: 1, name: 'main' },
      { id: 2, name: 'A' },
      { id: 3, name: 'B' }
    ],
    edges: [
      { src: '~pr', dest: 'main' },
      { src: '~commit', dest: 'main' },
      { src: '~sd@456:test', dest: 'main' },
      { src: 'main', dest: 'A' },
      { src: 'A', dest: 'B' }
    ]
  },
  builds: [
    { jobId: 1, id: 4, status: 'SUCCESS' },
    { jobId: 2, id: 5, status: 'SUCCESS' },
    { jobId: 3, id: 6, status: 'FAILURE' }
  ],
  isRunning: false,
  label: 'Yahoo http://yahoo.com, and Version #2.0'
};

const userSettingsMock = {
  1018240: {
    showPRJobs: true
  },
  1048190: {
    showPRJobs: false
  },
  displayJobNameLength: 30,
  timestampFormat: 'UTC'
};

module('Integration | Component | pipeline event row', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.actions = {};
    this.send = (actionName, ...args) =>
      this.actions[actionName].apply(this, args);
  });

  test('it renders with pipeline event', async function (assert) {
    this.actions.eventClick = () => {
      assert.ok(true);
    };

    this.set('stopPRBuilds', Function.prototype);
    this.set('stopEvent', Function.prototype);

    let eventMock = EmberObject.create(copy(eventWithLabel, true));

    eventMock.isRunning = false;
    eventMock.status = 'SUCCESS';

    this.set('event', eventMock);
    this.set('latestCommit', {
      sha: 'sha3'
    });

    await render(hbs`{{pipeline-event-row 
      event=event
      startPRBuild=startPRBuild
      stopEvent=stopEvent
      selectedEvent=3
      latestCommit=latestCommit
      lastSuccessful=3
    }}`);

    assert.dom('.SUCCESS').exists({ count: 1 });
    assert.dom('.stopButton').doesNotExist();
    assert.dom('.status .fa-check-circle-o').exists({ count: 1 });
    assert.dom('.commit .latest-commit').hasText('#abc123');
    assert.dom('.commit .last-successful').hasText('Last successful');
    assert.dom('.message').hasText('this was a test');
    assert.dom('svg').exists({ count: 1 });
    assert.dom('.graph-node').exists({ count: 4 });
    assert.dom('.graph-edge').exists({ count: 3 });
    assert.dom('.by').hasText('Started and committed by: batman');
    assert.dom('.commit .label').hasText('Yahoo new project, and Version #2.0');
    assert
      .dom('.date')
      .hasText(
        `Started ${toCustomLocaleString(new Date('06/30/2021, 04:39 PM'))}`
      );
    assert.dom('.last-successful').exists({ count: 1 });
    assert.dom('.latest-commit').exists({ count: 1 });
  });

  test('it renders with running pipeline event', async function (assert) {
    this.actions.eventClick = () => {
      assert.ok(true);
    };

    this.set('stopPRBuilds', Function.prototype);
    this.set('stopEvent', Function.prototype);

    let eventMock = EmberObject.create(copy(event, true));

    eventMock.isRunning = true;
    eventMock.status = 'RUNNING';

    this.set('event', eventMock);
    this.set('latestCommit', {
      sha: 'sha3'
    });

    await render(hbs`{{pipeline-event-row
      event=event
      startPRBuild=startPRBuild
      stopEvent=stopEvent
      selectedEvent=3
      latestCommit=latestCommit
      lastSuccessful=3
    }}`);

    assert.dom('.RUNNING').exists({ count: 1 });
    assert.dom('.stopButton').exists({ count: 1 });
    assert.dom('.status').exists({ count: 1 });
    assert.dom('.fa-spinner').exists({ count: 1 });
    assert.dom('.commit').hasText('#abc123 Last successful Stop');
    assert.dom('.message').hasText('this was a test');
    assert.dom('svg').exists({ count: 1 });
    assert.dom('.graph-node').exists({ count: 4 });
    assert.dom('.graph-edge').exists({ count: 3 });
    assert.dom('.by').hasText('Started and committed by: batman');
    assert
      .dom('.date')
      .hasText(
        `Started ${toCustomLocaleString(new Date('06/30/2021, 04:39 PM'))}`
      );
    assert.dom('.last-successful').exists({ count: 1 });
    assert.dom('.latest-commit').exists({ count: 1 });
  });

  test('it renders with unknown pipeline event', async function (assert) {
    this.actions.eventClick = () => {
      assert.ok(true);
    };

    this.set('stopPRBuilds', Function.prototype);
    this.set('stopEvent', Function.prototype);

    let eventMock = EmberObject.create(copy(event, true));

    eventMock.isRunning = true;
    eventMock.status = 'UNKNOWN';

    this.set('event', eventMock);
    this.set('latestCommit', {
      sha: 'sha3'
    });

    await render(hbs`{{pipeline-event-row
      event=event
      startPRBuild=startPRBuild
      stopEvent=stopEvent
      selectedEvent=3
      latestCommit=latestCommit
      lastSuccessful=3
    }}`);

    assert.dom('.UNKNOWN').exists({ count: 1 });
    assert.dom('.stopButton').doesNotExist();
    assert.dom('.status').exists({ count: 1 });
    assert.dom('.commit').hasText('#abc123 Last successful');
    assert.dom('.message').hasText('this was a test');
    assert.dom('svg').exists({ count: 1 });
    assert.dom('.graph-node').exists({ count: 4 });
    assert.dom('.graph-edge').exists({ count: 3 });
    assert.dom('.by').hasText('Started and committed by: batman');
    assert
      .dom('.date')
      .hasText(
        `Started ${toCustomLocaleString(new Date('06/30/2021, 04:39 PM'))}`
      );
    assert.dom('.last-successful').exists({ count: 1 });
    assert.dom('.latest-commit').exists({ count: 1 });
  });

  test('it renders with pr event', async function (assert) {
    this.actions.eventClick = () => {
      assert.ok(true);
    };

    this.set('startBuild', (prNum, jobs) => {
      assert.equal(prNum, 2);
      assert.equal(jobs[0].group, 2);
    });
    this.set('stopEvent', Function.prototype);

    const eventMock = EmberObject.create(
      assign(copy(event, true), {
        id: 4,
        startFrom: '~pr',
        type: 'pr',
        pr: {
          url: 'https://foo/bar/baz/pull/2'
        },
        prNum: 2
      })
    );

    this.set('event', eventMock);
    this.set('latestCommit', {
      sha: 'sha3'
    });

    await render(hbs`{{pipeline-event-row 
      event=event 
      startPRBuild=startBuild
      stopEvent=stopEvent
      selectedEvent=4
      latestCommit=latestCommit
      lastSuccessful=3
    }}`);

    assert.dom('.SUCCESS').exists({ count: 1 });
    assert.dom('.status .fa-check-circle-o').exists({ count: 1 });
    assert.dom('.commit').hasText('PR-2 Start');
    assert.dom('.message').hasText('this was a test');
    assert.dom('svg').exists({ count: 1 });
    assert.dom('.graph-node').exists({ count: 4 });
    assert.dom('.graph-edge').exists({ count: 3 });
    assert.dom('.by').hasText('Started and committed by: batman');
    assert
      .dom('.date')
      .hasText(
        `Started ${toCustomLocaleString(new Date('06/30/2021, 04:39 PM'))}`
      );
    assert.dom('.last-successful').doesNotExist();
    assert.dom('.latest-commit').doesNotExist();
  });

  test('it render when event creator and commit author is different', async function (assert) {
    this.actions.eventClick = () => {
      assert.ok(true);
    };

    this.set('stopPRBuilds', Function.prototype);
    this.set('stopEvent', Function.prototype);

    const eventMock = EmberObject.create(
      assign(copy(event, true), {
        commit: {
          author: {
            url: '#',
            name: 'superman'
          }
        }
      })
    );

    this.set('event', eventMock);
    this.set('latestCommit', {
      sha: 'sha3'
    });

    await render(hbs`{{pipeline-event-row 
      event=event 
      startPRBuild=startPRBuild
      stopEvent=stopEvent
      selectedEvent=3
      latestCommit=latestCommit
      lastSuccessful=3
    }}`);

    assert.dom('.SUCCESS').exists({ count: 1 });
    assert.dom('.status .fa-check-circle-o').exists({ count: 1 });
    assert.dom('.commit').hasText('#abc123 Last successful');
    assert.dom('.message').hasText('this was a test');
    assert.dom('svg').exists({ count: 1 });
    assert.dom('.graph-node').exists({ count: 4 });
    assert.dom('.graph-edge').exists({ count: 3 });
    assert.dom('.by').hasText('Committed by: superman Started by: batman');
    assert
      .dom('.date')
      .hasText(
        `Started ${toCustomLocaleString(new Date('06/30/2021, 04:39 PM'))}`
      );
    assert.dom('.last-successful').exists({ count: 1 });
    assert.dom('.latest-commit').exists({ count: 1 });
  });

  test('it render when event is trigger by external pipeline', async function (assert) {
    this.actions.eventClick = () => {
      assert.ok(true);
    };

    this.set('stopPRBuilds', Function.prototype);
    this.set('stopEvent', Function.prototype);

    const eventMock = EmberObject.create(
      assign(copy(event, true), {
        causeMessage: 'Triggered by build 123',
        startFrom: '~sd@456:test'
      })
    );

    this.set('event', eventMock);
    this.set('latestCommit', {
      sha: 'sha3'
    });

    await render(hbs`{{pipeline-event-row 
      event=event 
      startPRBuild=startPRBuild
      stopEvent=stopEvent
      selectedEvent=3
      latestCommit=latestCommit
      lastSuccessful=3
    }}`);

    assert.dom('.SUCCESS').exists({ count: 1 });
    assert.dom('.status .fa-check-circle-o').exists({ count: 1 });
    assert.dom('.commit').hasText('#abc123 Last successful');
    assert.dom('.message').hasText('this was a test');
    assert.dom('svg').exists({ count: 1 });
    assert.dom('.graph-node').exists({ count: 4 });
    assert.dom('.graph-edge').exists({ count: 3 });
    assert
      .dom('.by')
      .hasText('Committed by: batman Started by: External Trigger');
    assert
      .dom('.date')
      .hasText(
        `Started ${toCustomLocaleString(new Date('06/30/2021, 04:39 PM'))}`
      );
    assert.dom('.last-successful').exists({ count: 1 });
    assert.dom('.latest-commit').exists({ count: 1 });
  });

  test('it render when event is trigger by same pipeline', async function (assert) {
    assert.expect(11);
    this.actions.eventClick = () => {
      assert.ok(true);
    };

    this.set('stopPRBuilds', Function.prototype);
    this.set('stopEvent', Function.prototype);

    const eventMock = EmberObject.create(
      assign(copy(event, true), {
        causeMessage: 'Triggered from API Deploy pipeline',
        startFrom: '~sd@456:test',
        pipelineId: 456
      })
    );

    this.set('event', eventMock);
    this.set('latestCommit', {
      sha: 'sha3'
    });

    await render(hbs`{{pipeline-event-row 
      event=event 
      startPRBuild=startPRBuild
      stopEvent=stopEvent
      selectedEvent=3
      latestCommit=latestCommit
      lastSuccessful=3
    }}`);

    assert.dom('.SUCCESS').exists({ count: 1 });
    assert.dom('.status .fa-check-circle-o').exists({ count: 1 });
    assert.dom('.commit').hasText('#abc123 Last successful');
    assert.dom('.message').hasText('this was a test');
    assert.dom('svg').exists({ count: 1 });
    assert.dom('.graph-node').exists({ count: 4 });
    assert.dom('.graph-edge').exists({ count: 3 });
    assert.dom('.by').hasText('Started and committed by: batman');
    assert
      .dom('.date')
      .hasText(
        `Started ${toCustomLocaleString(new Date('06/30/2021, 04:39 PM'))}`
      );
    assert.dom('.last-successful').exists({ count: 1 });
    assert.dom('.latest-commit').exists({ count: 1 });
  });

  test('it render when startFrom is missing', async function (assert) {
    assert.expect(8);
    this.actions.eventClick = () => {
      assert.ok(true);
    };

    this.set('stopPRBuilds', Function.prototype);
    this.set('stopEvent', Function.prototype);

    const eventMock = EmberObject.create(
      assign(copy(event, true), {
        startFrom: undefined
      })
    );

    this.set('event', eventMock);
    this.set('latestCommit', {
      sha: 'sha3'
    });

    await render(hbs`{{pipeline-event-row 
      event=event 
      startPRBuild=startPRBuild
      stopEvent=stopEvent
      selectedEvent=3
      latestCommit=latestCommit
      lastSuccessful=3
    }}`);

    assert.dom('.SUCCESS').exists({ count: 1 });
    assert.dom('.status .fa-check-circle-o').exists({ count: 1 });
    assert.dom('.commit').hasText('#abc123 Last successful');
    assert.dom('.message').hasText('this was a test');
    assert.dom('.by').hasText('Started and committed by: batman');
    assert
      .dom('.date')
      .hasText(
        `Started ${toCustomLocaleString(new Date('06/30/2021, 04:39 PM'))}`
      );
    assert.dom('.last-successful').exists({ count: 1 });
    assert.dom('.latest-commit').exists({ count: 1 });
  });

  test('it renders UTC timestamp', async function (assert) {
    this.actions.eventClick = () => {
      assert.ok(true);
    };
    const userSettingsStub = Service.extend({
      getUserPreference() {
        return new EmberPromise(resolve => resolve(userSettingsMock));
      },
      getDisplayJobNameLength() {
        return null;
      }
    });

    this.owner.unregister('service:userSettings');
    this.owner.register('service:userSettings', userSettingsStub);

    this.set('stopPRBuilds', Function.prototype);
    this.set('stopEvent', Function.prototype);

    let eventMock = EmberObject.create(copy(event, true));

    eventMock.isRunning = false;
    eventMock.status = 'SUCCESS';

    this.set('event', eventMock);
    this.set('latestCommit', {
      sha: 'sha3'
    });

    await render(hbs`{{pipeline-event-row 
      event=event 
      startPRBuild=startPRBuild
      stopEvent=stopEvent
      selectedEvent=3
      latestCommit=latestCommit
      lastSuccessful=3
    }}`);

    assert.dom('.date').hasText(
      `Started ${toCustomLocaleString(new Date('06/30/2021, 04:39 PM'), {
        timeZone: 'UTC'
      })}`
    );
  });

  test('it does not render graph when skipped event', async function (assert) {
    this.actions.eventClick = () => {
      assert.ok(true);
    };

    this.set('stopPRBuilds', Function.prototype);
    this.set('stopEvent', Function.prototype);

    const eventMock = EmberObject.create(
      assign(copy(event, true), {
        status: 'SKIPPED',
        commit: {
          author: {
            url: '#',
            name: 'batman'
          },
          url: '#',
          message: '[skip ci] skip ci build.'
        },
        truncatedMessage: '[skip ci] skip ci build.'
      })
    );

    this.set('event', eventMock);
    this.set('latestCommit', {
      sha: 'sha3'
    });

    await render(hbs`{{pipeline-event-row 
      event=event 
      startPRBuild=startPRBuild
      stopEvent=stopEvent
      selectedEvent=3
      latestCommit=latestCommit
      lastSuccessful=3
    }}`);

    assert.dom('.SKIPPED').exists({ count: 1 });
    assert.dom('.status .fa-exclamation-circle').exists({ count: 1 });
    assert.dom('.commit').hasText('#abc123 Last successful');
    assert.dom('.message').hasText('[skip ci] skip ci build.');
    assert.dom('.by').hasText('Started and committed by: batman');
    assert
      .dom('.date')
      .hasText(
        `Started ${toCustomLocaleString(new Date('06/30/2021, 04:39 PM'))}`
      );
    assert.dom('.last-successful').exists({ count: 1 });
    assert.dom('.latest-commit').exists({ count: 1 });
  });

  test('it renders with pipeline event with clickable links in label', async function (assert) {
    this.actions.eventClick = () => {
      assert.ok(true);
    };

    this.set('stopPRBuilds', Function.prototype);
    this.set('stopEvent', Function.prototype);

    let eventMock = EmberObject.create(copy(eventWithLinksInLabel, true));

    eventMock.isRunning = false;
    eventMock.status = 'SUCCESS';

    this.set('event', eventMock);
    this.set('latestCommit', {
      sha: 'sha3'
    });

    await render(hbs`{{pipeline-event-row 
      event=event
      startPRBuild=startPRBuild
      stopEvent=stopEvent
      selectedEvent=3
      latestCommit=latestCommit
      lastSuccessful=3
    }}`);

    const labelColumn = this.element
      .querySelector('.commit .label')
      .innerHTML.trim();

    assert.dom('.SUCCESS').exists({ count: 1 });
    assert.dom('.stopButton').doesNotExist();
    assert.dom('.status .fa-check-circle-o').exists({ count: 1 });
    assert.dom('.commit .latest-commit').hasText('#abc123');
    assert.dom('.commit .last-successful').hasText('Last successful');
    assert.dom('.message').hasText('this was a test');
    assert.dom('svg').exists({ count: 1 });
    assert.dom('.graph-node').exists({ count: 4 });
    assert.dom('.graph-edge').exists({ count: 3 });
    assert.strictEqual(
      labelColumn,
      'Yahoo <a href="http://yahoo.com" rel="nofollow" target="_blank">http://yahoo.com</a>, and Version #2.0'
    );
    assert.dom('.by').hasText('Started and committed by: batman');
    assert
      .dom('.date')
      .hasText(
        `Started ${toCustomLocaleString(new Date('06/30/2021, 04:39 PM'))}`
      );
    assert.dom('.last-successful').exists({ count: 1 });
    assert.dom('.latest-commit').exists({ count: 1 });
  });
});
