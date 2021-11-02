import classic from 'ember-classic-decorator';
import RESTSerializer from '@ember-data/serializer/rest';

@classic
export default class Serializer extends RESTSerializer {
  primaryKey = 'jobId';

  modelNameFromPayloadKey /* key */() {
    return 'build-history';
  }
}
