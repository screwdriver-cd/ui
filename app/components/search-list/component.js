import classic from 'ember-classic-decorator';
import { tagName } from '@ember-decorators/component';
import { inject as service } from '@ember/service';
import { empty } from '@ember/object/computed';
import { set, action, computed } from '@ember/object';
import ENV from 'screwdriver-ui/config/environment';
import Component from '@ember/component';

@classic
@tagName('')
export default class SearchList extends Component {
  errorMessage = '';

  showModal = false;

  @service
  session;

  @service('scm')
  scmService;

  addCollectionError = null;

  addCollectionSuccess = null;

  @empty('filteredPipelines')
  isEmpty;

  @computed('moreToShow', 'filteredPipelines')
  get showMore() {
    const pipelines = this.filteredPipelines;

    if (
      Array.isArray(pipelines) &&
      pipelines.length < ENV.APP.NUM_PIPELINES_LISTED
    ) {
      return false;
    }

    return this.moreToShow;
  }

  @computed('pipelines')
  get filteredPipelines() {
    let filtered = this.pipelines || [];

    // add scm contexts into pipelines.
    return filtered.map(pipeline => {
      const scm = this.scmService.getScm(pipeline.get('scmContext'));

      pipeline.set('scm', scm.displayName);
      pipeline.set('scmIcon', scm.iconType);

      return pipeline;
    });
  }

  init() {
    super.init(...arguments);

    set(this, 'pipelinesPage', 1);
  }

  /**
   * Reset show more when component is destroyed
   * @method willDestroyElement
   */
  willDestroyElement() {
    super.willDestroyElement(...arguments);

    // Reset moreToShow value
    set(this, 'moreToShow', true);
  }

  @action
  moreClick() {
    const pipelinesPage = this.pipelinesPage + 1;
    const fn = this.updatePipelines;

    set(this, 'pipelinesPage', pipelinesPage);

    if (typeof fn === 'function') {
      fn({ page: pipelinesPage, search: this.query }).catch(error =>
        this.set('errorMessage', error)
      );
    }
  }

  @action
  openModal() {
    this.set('showModal', true);
  }

  @action
  addNewCollectionHelper() {
    let addNewCollectionParent = this.addNewCollection;

    addNewCollectionParent();
  }

  @action
  addPipelineToCollection(pipelineId, collection) {
    return this.addToCollection(+pipelineId, collection.id)
      .then(() => {
        this.set('addCollectionError', null);
        this.set(
          'addCollectionSuccess',
          `Successfully added Pipeline to Collection ${collection.get('name')}`
        );
      })
      .catch(() => {
        this.set(
          'addCollectionError',
          `Could not add Pipeline to Collection ${collection.get('name')}`
        );
        this.set('addCollectionSuccess', null);
      });
  }
}
