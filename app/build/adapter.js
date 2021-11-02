import classic from 'ember-classic-decorator';
import ENV from 'screwdriver-ui/config/environment';
import BaseAdapter from 'screwdriver-ui/application/adapter';

@classic
export default class Adapter extends BaseAdapter {
  queryRecord(store, type, data) {
    this.modelKey = 'build';
    let url = `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/jobs/${data.jobId}/latestBuild`;

    let query = { status: data.status };

    return this.ajax(url, 'GET', { data: query });
  }
}
