import { mockEvents } from './mocks/events';
import { makeBuilds } from './mocks/builds';
import { pipeline, PIPELINE_ID } from './mocks/pipeline';
import type { RouteTable } from './route-table';

const SCHEDULER = 'sd:scheduler';

export interface FeedEvent {
  id: number;
  creator: { username: string; name: string };
  [key: string]: unknown;
}

/**
 * A pipeline's event history with the cursor semantics of
 * GET /pipelines/:id/events (`id=lt:N|gt:N`, `count`, `sort`,
 * `creator=ne:sd:scheduler`). The default route (support/mocks/routes.ts) returns [] for
 * every cursor, so it cannot exercise the event rail's pagination.
 *
 * Ids run 1..count; every `schedulerEvery`-th event is created by the
 * scheduler (0 = none).
 */
export class EventFeed {
  readonly events: FeedEvent[] = [];

  constructor(
    count: number,
    private options: { schedulerEvery?: number; filterSchedulerEvents?: boolean } = {}
  ) {
    for (let i = 0; i < count; i += 1) {
      this.add();
    }
  }

  /** Appends a new newest event, e.g. to simulate a commit during polling. */
  add(): FeedEvent {
    const id = this.events.length + 1;
    const { schedulerEvery = 0 } = this.options;
    const isScheduler = schedulerEvery > 0 && id % schedulerEvery === 0;
    const creator = isScheduler
      ? { username: SCHEDULER, name: SCHEDULER }
      : { username: 'batman', name: 'Bruce W' };
    const sha = id.toString(16).padStart(40, '0');
    const event: FeedEvent = {
      ...(mockEvents[0] as unknown as FeedEvent),
      id,
      groupEventId: id,
      sha,
      creator,
      commit: { ...mockEvents[0].commit, message: `Commit ${id}`, author: creator },
      createTime: new Date(Date.UTC(2016, 10, 4, 20, 0, id)).toISOString()
    };

    this.events.push(event);
    return event;
  }

  get newest() {
    return this.events[this.events.length - 1];
  }

  find(id: number) {
    return this.events.find(event => event.id === id);
  }

  register(api: RouteTable, pipelineId = PIPELINE_ID) {
    const { filterSchedulerEvents = false } = this.options;

    api.get('/pipelines/:id', () => [
      200,
      {
        ...pipeline,
        id: pipelineId,
        lastEventId: this.newest.id,
        settings: { ...(pipeline as { settings?: object }).settings, filterSchedulerEvents }
      }
    ]);

    api.get('/pipelines/:id/events', req => {
      const q = req.queryParams;

      // PR history is covered by its own feed; not part of this one.
      if (q.type === 'pr') {
        return [200, []];
      }

      let events = [...this.events];

      if (q.creator === `ne:${SCHEDULER}`) {
        events = events.filter(event => event.creator.username !== SCHEDULER);
      }

      const cursor = /^(lt|gt):(\d+)$/.exec(q.id ?? '');

      if (cursor) {
        const n = Number(cursor[2]);

        events = events.filter(event =>
          cursor[1] === 'lt' ? event.id < n : event.id > n
        );
      }

      events.sort((a, b) => (q.sort === 'ascending' ? a.id - b.id : b.id - a.id));

      return [200, events.slice(0, Number(q.count ?? 50))];
    });

    api.get('/events/:id', req => {
      const event = this.find(Number(req.params.id));

      return event ? [200, event] : [404, { message: 'Event not found' }];
    });

    // makeBuilds() is random (status, ids); pin them so specs are stable.
    api.get('/events/:id/builds', req => {
      const eventId = Number(req.params.id);

      return [
        200,
        makeBuilds(eventId).map((build, i) => ({
          ...build,
          id: eventId * 100 + i,
          number: eventId * 100 + i,
          status: 'SUCCESS'
        }))
      ];
    });

    api.get('/pipelines/:id/latestCommitEvent', () => [200, this.newest]);
    api.get('/pipelines/:id/lastSuccessfulEvent', () => [200, this.newest]);
  }
}
