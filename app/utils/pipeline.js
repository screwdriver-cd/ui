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

export { getStateIcon as default };
