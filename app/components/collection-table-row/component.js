import classic from 'ember-classic-decorator';
import { tagName } from '@ember-decorators/component';
import { action, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { and } from '@ember/object/computed';
import Component from '@ember/component';
import { formatMetrics } from 'screwdriver-ui/utils/metric';

@classic
@tagName('')
export default class CollectionTableRow extends Component {
  @service
  store;

  @service
  inViewport;

  eventsInfo = null;

  lastEventInfo = null;

  isAuthenticated = false;

  isOrganizing = false;

  isDefaultCollection = false;

  pipeline = null;

  pipelineSelected = false;

  reset = false;

  storeQueryError = false;

  @and('eventsInfo', 'lastEventInfo')
  hasBothEventsAndLatestEventInfo;

  @and('isOrganizing', 'isAuthenticated')
  showCheckbox;

  @computed('pipeline.scmRepo')
  get branch() {
    const { branch, rootDir } = this.pipeline.scmRepo;

    return rootDir ? `${branch}#${rootDir}` : branch;
  }

  @computed('isOrganizing', 'isAuthenticated', 'isDefaultCollection')
  get showRemoveButton() {
    return (
      !this.isDefaultCollection && !this.isOrganizing && this.isAuthenticated
    );
  }

  updateEventMetrics = async () => {
    const metrics = await this.store
      .query('metric', {
        pipelineId: this.pipeline.id,
        page: 1,
        count: 20
      })
      .catch(() => {
        this.setProperties({
          storeQueryError: true
        });
      });

    const result = formatMetrics(metrics);
    const { eventsInfo, lastEventInfo } = result;

    this.setProperties({
      eventsInfo,
      lastEventInfo
    });
  };

  @action
  togglePipeline() {
    const pipelineId = this.pipeline.id;

    if (this.reset) {
      this.setProperties({
        pipelineSelected: false,
        reset: false
      });
    }

    if (this.pipelineSelected) {
      this.set('pipelineSelected', false);
      this.deselectPipeline(pipelineId);
    } else {
      this.set('pipelineSelected', true);
      this.selectPipeline(pipelineId);
    }
  }
}
