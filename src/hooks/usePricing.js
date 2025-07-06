// hooks/usePricing.js - Missing pricing hook

import { useMemo } from 'react';

export function usePricing(selectedComponents, components) {
  return useMemo(() => {
    let total = 0;
    const breakdown = {};
    
    // Calculate pricing based on selected components
    Object.entries(selectedComponents).forEach(([type, componentId]) => {
      if (componentId && components[type]) {
        const component = components[type].find(c => c.id === componentId);
        if (component && component.base_price) {
          breakdown[type] = component.base_price;
          total += component.base_price;
        }
      }
    });
    
    // Add base server cost if no components selected
    if (total === 0) {
      total = 50; // Default base price
    }
    
    return {
      total,
      breakdown,
      currency: 'USD'
    };
  }, [selectedComponents, components]);
}