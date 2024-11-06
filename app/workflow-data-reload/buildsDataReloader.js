import { setBuildStatus } from 'screwdriver-ui/utils/pipeline/build';
import DataReloader from './dataReloader';

export default class BuildsDataReloader extends DataReloader {
  async fetchDataForId(eventId) {
    return this.shuttle
      .fetchFromApi('get', `/events/${eventId}/builds?fetchSteps=false`)
      .then(builds => {
        builds.forEach(build => {
          setBuildStatus(build);
        });

        return builds;
      });
  }

  getBuildsForEvent(eventId) {
    return this.responseCache.get(eventId);
  }
}
