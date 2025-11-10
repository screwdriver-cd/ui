/* eslint-disable require-jsdoc,import/prefer-default-export */

import { makeBuilds } from '../builds';
import { INVALID_EVENT_ID, mockEvents } from '../events';

export function eventRoutes(mockApi) {
  mockApi.get('/events/:id', req => {
    const eventId = parseInt(req.params.id, 10);

    if (!eventId || eventId === INVALID_EVENT_ID) {
      return [404, {}];
    }

    return [200, mockEvents.find(event => event.id === eventId)];
  });

  mockApi.get('/events/:id/builds', req => {
    const eventId = parseInt(req.params.id, 10);

    return [200, makeBuilds(eventId)];
  });
}
