import classic from 'ember-classic-decorator';
import { tagName } from '@ember-decorators/component';
import { inject as service } from '@ember/service';
import { equal, mapBy, filter } from '@ember/object/computed';
import Component from '@ember/component';
import { action, computed } from '@ember/object';

@tagName('')
@classic
export default class BuildStepCollection extends Component {
  iframeUrl = '';

  @service
  router;

  activeTab = 'steps';

  selectedArtifact = '';

  @equal('activeTab', 'artifacts')
  isArtifacts;

  @mapBy('buildSteps', 'name')
  stepNames;

  @filter('stepNames', item => /^sd-setup/.test(item))
  setupSteps;

  @filter('stepNames', item => /^sd-teardown/.test(item))
  teardownSteps;

  @computed('buildSteps.@each.{code,startTime,endTime}', 'preselectedStepName')
  get selectedStep() {
    const steps = this.buildSteps;
    const preselectedStep = steps.findBy('name', this.preselectedStepName);

    if (preselectedStep) {
      return preselectedStep.name;
    }

    return null;
  }

  @computed('selectedStep', 'setupSteps')
  get setupCollapsed() {
    const name = this.selectedStep;

    if (name && this.setupSteps.includes(name)) {
      return false;
    }

    return false; // FIXME: https://github.com/kaliber5/ember-bootstrap/issues/1681#issuecomment-988231870
  }

  @computed('selectedStep', 'teardownSteps')
  get teardownCollapsed() {
    const name = this.selectedStep;

    if (name && this.teardownSteps.includes(name)) {
      return false;
    }

    return false; // FIXME: https://github.com/kaliber5/ember-bootstrap/issues/1681#issuecomment-988231870
  }

  @filter(
    'stepNames',
    item => !/^sd-setup/.test(item) && !/^sd-teardown/.test(item)
  )
  userSteps;

  @action
  toggleSetup() {
    // set(this, 'setupCollapsed', !this.setupCollapsed);
  }

  @action
  toggleTeardown() {
    // set(this, 'teardownCollapsed', !this.teardownCollapsed);
  }

  @action
  changeActiveTabPane(activeTab) {
    this.changeRouteTo(activeTab);
  }
}
