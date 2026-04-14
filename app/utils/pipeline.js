const getStateIcon = state => {
  let icon;

  switch (state) {
    case 'ACTIVE':
      icon = 'circle-check';
      break;
    case 'INACTIVE':
      icon = 'circle-xmark';
      break;
    case 'DISABLED':
      icon = 'ban';
      break;
    default:
      icon = '';
      break;
  }

  return icon;
};

const isInactivePipeline = pipeline => {
  return pipeline.state === 'INACTIVE';
};

const hasInactivePipelines = pipelines => {
  const inactivePipeline = pipelines.find(p => isInactivePipeline(p));

  return !!inactivePipeline;
};

const isActivePipeline = pipeline => {
  return pipeline.state === 'ACTIVE';
};

const hasActivePipelines = pipelines => {
  const activePipeline = pipelines.find(p => isActivePipeline(p));

  return !!activePipeline;
};

const isDisabledPipeline = pipeline => {
  return pipeline.state === 'DISABLED';
};

const hasDisabledPipelines = pipelines => {
  const disabledPipeline = pipelines.find(p => isDisabledPipeline(p));

  return !!disabledPipeline;
};

const hasSonarBadge = pipeline => {
  const sonar = pipeline.badges?.sonar;

  if (sonar) {
    if (sonar.name && sonar.uri) {
      return sonar.name !== '' && sonar.uri !== '';
    }
  }

  return false;
};

export {
  getStateIcon,
  isInactivePipeline,
  hasInactivePipelines,
  isActivePipeline,
  hasActivePipelines,
  isDisabledPipeline,
  hasDisabledPipelines,
  hasSonarBadge
};
