// utils/componentUtils.js 

export function getSelectedComponentDetails(selectedComponents, components) {
  const details = {};
  
  Object.entries(selectedComponents).forEach(([type, componentId]) => {
    if (componentId && components[type]) {
      const component = components[type].find(c => c.id === componentId);
      if (component) {
        details[type] = component;
      }
    }
  });
  
  return details;
}

export function createComponentSelectHandler(setSelectedComponents, components) {
  return (type, componentId) => {
    setSelectedComponents(prev => ({
      ...prev,
      [type]: componentId
    }));
  };
}