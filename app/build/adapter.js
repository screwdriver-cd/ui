import ENV from 'screwdriver-ui/config/environment';
import BaseAdapter from 'screwdriver-ui/application/adapter';

export default BaseAdapter.extend({
  queryRecord(store, type, data) {
    let url = `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/jobs/${data.jobId}/latestBuild`;
    let query = { status: data.status };

    return this.ajax(url, 'GET', { data: query });
  }
});
