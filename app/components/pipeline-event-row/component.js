import { set, action, computed } from '@ember/object';
import classic from 'ember-classic-decorator';
import { tagName } from '@ember-decorators/component';
import { bool } from '@ember/object/computed';
import Component from '@ember/component';
import { statusIcon } from 'screwdriver-ui/utils/build';
import MAX_NUM_OF_PARAMETERS_ALLOWED from 'screwdriver-ui/utils/constants';

@classic
@tagName('')
export default class PipelineEventRow extends Component {
  @computed('selectedEvent', 'event.id')
  get highlighted() {
    return this.selectedEvent === this.event.id;
  }

  init() {
    super.init(...arguments);

    const pipelineParameters = {};
    const jobParameters = {};

    // Segregate pipeline level and job level parameters
    Object.entries(this.event?.meta?.parameters || {}).forEach(
      ([propertyName, propertyVal]) => {
        const keys = Object.keys(propertyVal);

        if (keys.length === 1 && keys[0] === 'value') {
          pipelineParameters[propertyName] = propertyVal;
        } else {
          jobParameters[propertyName] = propertyVal;
        }
      }
    );

    set(this, 'pipelineParameters', pipelineParameters);
    set(this, 'jobParameters', jobParameters);
  }

  @computed('event.status')
  get icon() {
    return statusIcon(this.event.status, true);
  }

  @computed('event.{workflowGraph,isSkipped}')
  get isShowGraph() {
    return this.event.workflowGraph && !this.event.isSkipped;
  }

  @computed('pipelineParameters', 'jobParameters')
  get numberOfParameters() {
    return (
      Object.keys(this.pipelineParameters).length +
      Object.values(this.jobParameters).reduce((count, parameters) => {
        if (count) {
          return count + Object.keys(parameters).length;
        }

        return Object.keys(parameters).length;
      }, 0)
    );
  }

  @computed('numberOfParameters')
  get isInlineParameters() {
    return this.numberOfParameters < MAX_NUM_OF_PARAMETERS_ALLOWED;
  }

  @computed('event.{pipelineId,startFrom}')
  get isExternalTrigger() {
    const { startFrom } = this.event;
    const { pipelineId } = this.event;

    let isExternal = false;

    if (startFrom && startFrom.match(/^~sd@(\d+):([\w-]+)$/)) {
      isExternal =
        Number(startFrom.match(/^~sd@(\d+):([\w-]+)$/)[1]) !== pipelineId;
    }

    return isExternal;
  }

  @computed('isExternalTrigger', 'event.{creator.name,commit.author.name}')
  get isCommitterDifferent() {
    const creatorName = this.event.creator.name;
    const authorName = this.event.commit.author.name;

    return this.isExternalTrigger || creatorName !== authorName;
  }

  @bool('event.meta.subscribedSourceUrl')
  isSubscribedEvent;

  @computed('event.{causeMessage,startFrom}')
  get externalBuild() {
    // using underscore because router.js doesn't pick up camelcase
    /* eslint-disable camelcase */
    let pipeline_id = this.event.startFrom.match(/^~sd@(\d+):[\w-]+$/);

    let build_id = this.event.causeMessage.match(/\s(\d+)$/);

    if (build_id) {
      build_id = build_id[1];
    }
    if (pipeline_id) {
      pipeline_id = pipeline_id[1];
    }
    /* eslint-enable camelcase */

    return { build_id, pipeline_id };
  }

  @action
  clickRow() {
    const fn = this.eventClick;

    if (typeof fn === 'function') {
      const { id, type } = this.event;

      fn(id, type);
    }
  }

  @action
  toggleParametersPreview() {
    this.toggleProperty('isShowingModal');
  }
}
