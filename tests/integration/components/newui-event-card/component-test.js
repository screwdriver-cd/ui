import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import EmberObject from '@ember/object';
import { Promise as EmberPromise } from 'rsvp';
import Service from '@ember/service';

module('Integration | Component | newui-event-card', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });

    const userSettingsStub = Service.extend({
      getUserPreference() {
        return new EmberPromise(resolve => {
          resolve({
            timestampFormat: 'UTC'
          });
        });
      }
    });

    this.owner.unregister('service:userSettings');
    this.owner.register('service:userSettings', userSettingsStub);

    const mockEvent = EmberObject.create({
      id: 786169,
      groupEventId: 786169,
      causeMessage: 'Merged by adong',
      commit: {
        author: {
          id: '15989893',
          avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
          name: 'Alan',
          username: 'adong',
          url: 'https://github.com/adong'
        },
        committer: {
          id: '19864447',
          avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
          name: 'GitHub Web Flow',
          username: 'web-flow',
          url: 'https://github.com/web-flow'
        },
        message: 'Update screwdriver.yaml',
        url: 'https://github.com/adong/Alan_SD_Template/commit/4552cd7e840a90921e9fd6c00078f736b9b12e8c'
      },
      createTime: '2024-01-29T20:00:17.298Z',
      creator: {
        id: '15989893',
        avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
        name: 'Alan',
        username: 'adong',
        url: 'https://github.com/adong'
      },
      meta: {
        build: {
          buildId: '919790',
          coverageKey: 'job:116161',
          eventId: '786169',
          jobId: '116161',
          jobName: 'publish',
          pipelineId: '12977',
          sha: '4552cd7e840a90921e9fd6c00078f736b9b12e8c'
        },
        commit: {
          author: {
            avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
            id: '15989893',
            name: 'Alan',
            url: 'https://github.com/adong',
            username: 'adong'
          },
          changedFiles: 'screwdriver.yaml',
          committer: {
            avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
            id: '19864447',
            name: 'GitHub Web Flow',
            url: 'https://github.com/web-flow',
            username: 'web-flow'
          },
          message: 'Update screwdriver.yaml',
          url: 'https://github.com/adong/Alan_SD_Template/commit/4552cd7e840a90921e9fd6c00078f736b9b12e8c'
        },
        event: {
          creator: 'adong'
        }
      },
      pipelineId: 12977,
      sha: '4552cd7e840a90921e9fd6c00078f736b9b12e8c',
      configPipelineSha: '4552cd7e840a90921e9fd6c00078f736b9b12e8c',
      startFrom: '~commit',
      type: 'pipeline',
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
            id: 116160
          },
          {
            name: 'publish',
            id: 116161
          },
          {
            name: 'remove',
            id: 116162
          },
          {
            name: 'remove_tag',
            id: 116163
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
            dest: 'publish'
          }
        ]
      },
      pr: {},
      baseBranch: 'main'
    });
    const selectedEventId = '786169';
    const pipelineId = '12977';
    const lastSuccessful = '786169';

    this.setProperties({
      event: mockEvent,
      selectedEventId,
      pipelineId,
      lastSuccessful
    });

    await render(hbs`<NewuiEventCard 
      @event={{this.event}} 
      @selectedEventId={{this.selectedEventId}} 
      @pipelineId={{this.pipelineId}}
      @lastSuccessful={{this.lastSuccessful}}/>`);

    assert
      .dom(this.element)
      .hasText(
        '# main Started 01/29/2024, 08:00 PM UTC Duration: Started and committed by: Alan'
      );
  });
});
