import Component from '@ember/component';
import { get } from '@ember/object';

export default Component.extend({
  classNames: 'workflow-stage-actions-menu',
  classNameBindings: ['showMenu'],
  showMenu: false,

  didUpdateAttrs() {
    this._super(...arguments);

    const event = get(this, 'menuData.mouseevent');
    const stage = get(this, 'menuData.stage');
    const el = this.element;

    // setting menu position
    if (el && event) {
      const pipelineWorkflowElement =
        document.getElementsByClassName('pipelineWorkflow')[0];
      const pipelineWorkflowElementClientRect =
        pipelineWorkflowElement.getBoundingClientRect();
      const stageInfoWrapperElementClientRect = document
        .getElementsByClassName(`stage-info-wrapper _stage_${stage.name}`)[0]
        .getBoundingClientRect();

      const top =
        event.layerY +
        (stageInfoWrapperElementClientRect.y -
          pipelineWorkflowElementClientRect.y +
          pipelineWorkflowElement.scrollTop) +
        10;
      const left =
        event.layerX +
        (stageInfoWrapperElementClientRect.x -
          pipelineWorkflowElementClientRect.x +
          pipelineWorkflowElement.scrollLeft) -
        20;

      // const left = event.layerX + stageInfoWrapperElement.left - 20;

      el.style.top = `${top}px`;
      el.style.left = `${left}px`;
    }
  }
});
