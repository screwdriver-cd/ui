const getStateIcon = state => {
  let icon;

  switch (state) {
    case 'ACTIVE':
      icon = 'check-circle';
      break;
    case 'INACTIVE':
      icon = 'times-circle';
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

export {
  getStateIcon,
  isInactivePipeline,
  hasInactivePipelines,
  isActivePipeline,
  hasActivePipelines
};
