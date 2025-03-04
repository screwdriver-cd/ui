import DataReloader from './dataReloader';

export default class BuildsDataReloader extends DataReloader {
  async fetchDataForId(eventId) {
    return this.shuttle.fetchFromApi('get', `/events/${eventId}/stageBuilds`);
  }

  getStageBuildsForEvent(eventId) {
    return this.responseCache.get(eventId);
  }
}
