import { tagName } from '@ember-decorators/component';
import classic from 'ember-classic-decorator';
import { action } from '@ember/object';
import Component from '@ember/component';

@tagName('')
@classic
export default class PipelineVizNav extends Component {
  noResult = true;

  isLoading = false;

  collaspe = false;

  selectedPipeline = null;

  selectedConnectedPipeline = null;

  @action
  toggleCollapse() {
    this.toggleProperty('collaspe');
  }

  @action
  async handleSelectedConnectedPipeline(pipeline) {
    this.onClickConnectedPipeline(pipeline);
  }

  @action
  async handleSelectedPipeline(pipeline) {
    this.onSelectPipeline(pipeline);
  }

  @action
  async handleSearch(pipelineName) {
    try {
      const pipelines = await this.onSearchPipeline(pipelineName);

      return pipelines;
    } catch (e) {
      return [];
    }
  }
}
