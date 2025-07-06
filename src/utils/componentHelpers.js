// utils/componentHelpers.js

export const getSimplifiedStorageTypes = (components) => {
  if (!components.storage) return [];
  
  const types = new Set();
  components.storage.forEach(item => {
    try {
      const specs = typeof item.specs === 'string' ? JSON.parse(item.specs) : item.specs;
      const storageType = specs.type?.toLowerCase();
      
      // Group all SSD variants under 'ssd'
      if (['ssd', 'nvme', 'sata_ssd', 'nvme_ssd'].includes(storageType)) {
        types.add('ssd');
      } else if (storageType === 'hdd') {
        types.add('hdd');
      }
    } catch (error) {
      // Fallback: try to determine from name
      const itemName = item.name?.toLowerCase() || '';
      if (itemName.includes('ssd') || itemName.includes('nvme')) {
        types.add('ssd');
      } else if (itemName.includes('hdd')) {
        types.add('hdd');
      }
    }
  });
  
  return Array.from(types).sort();
};

export const getStorageBySimplifiedType = (components, selectedType) => {
  if (!components.storage) return [];
  
  return components.storage.filter(item => {
    try {
      const specs = typeof item.specs === 'string' ? JSON.parse(item.specs) : item.specs;
      const storageType = specs.type?.toLowerCase();
      
      if (selectedType === 'ssd') {
        return ['ssd', 'nvme', 'sata_ssd', 'nvme_ssd'].includes(storageType);
      } else if (selectedType === 'hdd') {
        return storageType === 'hdd';
      }
      
      return false;
    } catch (error) {
      const itemName = item.name?.toLowerCase() || '';
      if (selectedType === 'ssd') {
        return itemName.includes('ssd') || itemName.includes('nvme');
      } else if (selectedType === 'hdd') {
        return itemName.includes('hdd');
      }
      return false;
    }
  });
};

export const getActualStorageType = (item) => {
  try {
    const specs = typeof item.specs === 'string' ? JSON.parse(item.specs) : item.specs;
    return specs.type?.toUpperCase() || 'UNKNOWN';
  } catch (error) {
    const itemName = item.name?.toLowerCase() || '';
    if (itemName.includes('nvme')) return 'NVME';
    if (itemName.includes('sata') && itemName.includes('ssd')) return 'SATA_SSD';
    if (itemName.includes('ssd')) return 'SSD';
    if (itemName.includes('hdd')) return 'HDD';
    return 'UNKNOWN';
  }
};

export function getFilteredOptions(components, type, filters = {}) {
  const items = components[type] || [];
  
  return items.filter(item => {
    // UPDATED: Check if component is enabled (admin setting)
    if (item.is_enabled === false) {
      return false;
    }
    
    // UPDATED: Apply availability filter using new structure
    if (filters.available !== undefined) {
      const isAvailable = item.is_available !== undefined ? item.is_available : true;
      if (filters.available && !isAvailable) {
        return false;
      }
    }
    
    // UPDATED: Apply price filters using custom_price fallback
    const price = item.custom_price !== null && item.custom_price !== undefined 
      ? item.custom_price 
      : item.base_price;
      
    if (filters.maxPrice && price > filters.maxPrice) {
      return false;
    }
    
    if (filters.minPrice && price < filters.minPrice) {
      return false;
    }
    
    // Apply search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const matchesName = item.name.toLowerCase().includes(search);
      const matchesCustomName = item.custom_name && item.custom_name.toLowerCase().includes(search);
      
      // UPDATED: Handle specs as both string and object
      let matchesSpecs = false;
      if (item.specs) {
        try {
          const specs = typeof item.specs === 'string' ? JSON.parse(item.specs) : item.specs;
          const specsString = JSON.stringify(specs).toLowerCase();
          matchesSpecs = specsString.includes(search);
        } catch {
          matchesSpecs = item.specs.toString().toLowerCase().includes(search);
        }
      }
      
      if (!matchesName && !matchesCustomName && !matchesSpecs) {
        return false;
      }
    }
    
    return true;
  });
}

export function getStorageByType(components, storageType) {
  if (!components?.storage) return [];
  
  return components.storage.filter(item => {
    try {
      // Try to get storage type from specs first
      const specs = typeof item.specs === 'string' ? JSON.parse(item.specs) : item.specs;
      
      if (specs?.type) {
        return specs.type.toLowerCase() === storageType.toLowerCase();
      } else if (specs?.storageType) {
        return specs.storageType.toLowerCase() === storageType.toLowerCase();
      } else {
        // Fallback: extract from ID and normalize
        const typeFromId = item.id?.split('-')[0]?.toLowerCase();
        if (typeFromId) {
          // Normalize the extracted type
          let normalizedType;
          if (typeFromId.includes('hdd')) {
            normalizedType = 'hdd';
          } else {
            // Everything else becomes ssd
            normalizedType = 'ssd';
          }
          return normalizedType === storageType.toLowerCase();
        }
      }
    } catch (error) {
      console.warn('Error parsing storage specs for item:', item.id, error);
      // Fallback: try to match from name or ID
      const name = item.name?.toLowerCase() || '';
      const id = item.id?.toLowerCase() || '';
      const targetType = storageType.toLowerCase();
      
      if (targetType === 'ssd') {
        // SSD matches: ssd, sata, nvme, etc. (anything that's not HDD)
        return !name.includes('hdd') && !id.includes('hdd');
      } else if (targetType === 'hdd') {
        // HDD matches: only hdd
        return name.includes('hdd') || id.includes('hdd');
      }
      
      return false;
    }
  });
}

// NEW: Get available storage types from enabled components
export function getAvailableStorageTypes(components) {
  if (!components?.storage) return ['ssd']; // Default fallback
  
  const types = new Set();
  
  components.storage.forEach(item => {
    try {
      // Try to get storage type from specs first
      const specs = typeof item.specs === 'string' ? JSON.parse(item.specs) : item.specs;
      if (specs?.type) {
        types.add(specs.type.toLowerCase());
      } else if (specs?.storageType) {
        types.add(specs.storageType.toLowerCase());
      } else {
        // Fallback: extract from ID and normalize
        const typeFromId = item.id?.split('-')[0]?.toLowerCase();
        if (typeFromId) {
          // Normalize to ssd or hdd only
          if (typeFromId.includes('hdd')) {
            types.add('hdd');
          } else {
            // Everything else becomes ssd
            types.add('ssd');
          }
        }
      }
    } catch (error) {
      console.warn('Error parsing storage specs for item:', item.id, error);
      // Fallback: try to extract from name or ID
      const name = item.name?.toLowerCase() || '';
      const id = item.id?.toLowerCase() || '';
      
      if (name.includes('hdd') || id.includes('hdd')) {
        types.add('hdd');
      } else {
        // Default to ssd for anything else (SSD, SATA SSD, NVMe, etc.)
        types.add('ssd');
      }
    }
  });
  
  // Convert to sorted array - SSD first, then HDD
  const typeArray = Array.from(types);
  return typeArray.sort((a, b) => {
    if (a === 'ssd' && b === 'hdd') return -1;
    if (a === 'hdd' && b === 'ssd') return 1;
    return 0;
  });
}


// NEW: Get component price (with custom price support)
export function getComponentPrice(component) {
  if (!component) return 0;
  
  // Use custom_price if available, otherwise use base_price
  const price = component.custom_price !== null && component.custom_price !== undefined 
    ? component.custom_price 
    : component.base_price;
    
  return parseFloat(price) || 0;
}

// NEW: Get display name for component (with custom name support)
export function getComponentDisplayName(component) {
  if (!component) return '';
  
  // Use custom_name if available, otherwise use name
  return component.custom_name || component.name;
}

// NEW: Check if component is available
// utils/componentHelpers.js - Updated availability checking

// Check if component is available (in stock and enabled)
export function isComponentAvailable(component) {
  if (!component) return false;
  
  // Component must be enabled by admin
  if (component.is_enabled === false) return false;
  
  try {
    // Check stock from specs
    const specs = typeof component.specs === 'string' ? JSON.parse(component.specs) : component.specs;
    
    // If component has stock count in specs, check it
    if (specs?.stockCount !== undefined) {
      return specs.stockCount > 0 && specs.isInStock !== false;
    }
    
    // Check datapacket availability if no stock info in specs
    if (component.datapacket_available !== undefined) {
      return component.datapacket_available === true;
    }
    
    // Check top-level availability fields
    if (component.is_available !== undefined) {
      return component.is_available === true;
    }
    
    if (component.available !== undefined) {
      return component.available === true;
    }
    
    // Default to available if no explicit availability info
    return true;
    
  } catch (error) {
    console.warn('Error checking component availability:', component.id, error);
    // If there's an error parsing, default to checking basic fields
    return component.is_enabled !== false && component.available !== false;
  }
}

// Debug function to help troubleshoot storage issues
export function debugStorageComponents(components) {
  if (!components?.storage) {
    console.log('❌ No storage components found');
    return;
  }
  
  console.log(`📦 Found ${components.storage.length} storage components:`);
  
  components.storage.forEach((item, index) => {
    console.log(`\n${index + 1}. Storage Component:`, {
      id: item.id,
      name: item.name,
      type: item.type,
      enabled: item.is_enabled,
      available: isComponentAvailable(item),
      specs: typeof item.specs === 'string' ? JSON.parse(item.specs) : item.specs
    });
  });
  
  const availableTypes = getAvailableStorageTypes(components);
  console.log('\n🔧 Available storage types:', availableTypes);
  
  availableTypes.forEach(type => {
    const storageOfType = getStorageByType(components, type);
    console.log(`\n📋 ${type.toUpperCase()} storage options:`, storageOfType.length);
    storageOfType.forEach(storage => {
      console.log(`  - ${storage.id}: ${getStorageDisplayName(storage)} (Available: ${isComponentAvailable(storage)})`);
    });
  });
}

// NEW: Get enhanced storage display name
export function getStorageDisplayName(storage) {
  if (!storage) return '';
  
  try {
    const specs = typeof storage.specs === 'string' ? JSON.parse(storage.specs) : storage.specs;
    
    // Build display name from specs
    if (specs?.size && specs?.type) {
      const typeDisplay = specs.displayType || specs.type.toUpperCase();
      return `${specs.size}GB ${typeDisplay}`;
    }
  } catch (error) {
    console.warn('Error parsing storage specs for display:', storage.id, error);
  }
  
  // Fallback to the name field or construct from ID
  if (storage.name) {
    return storage.name;
  } else if (storage.id) {
    // Try to construct from ID like "ssd-500GB"
    const parts = storage.id.split('-');
    if (parts.length >= 2) {
      const type = parts[0].toUpperCase();
      const size = parts[1];
      return `${size} ${type}`;
    }
  }
  
  return storage.id || 'Unknown Storage';
}

// NEW: Get CPU specifications string
export function getCPUSpecs(component) {
  if (!component || !component.specs) return '';
  
  try {
    const specs = typeof component.specs === 'string' ? JSON.parse(component.specs) : component.specs;
    const parts = [];
    
    if (specs.cores) parts.push(`${specs.cores} Cores`);
    if (specs.threads) parts.push(`${specs.threads} Threads`);
    if (specs.base_clock) parts.push(specs.base_clock);
    
    return parts.join(', ');
  } catch {
    return '';
  }
}

export function formatCardNumber(value) {
  // Remove all non-digit characters
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  
  // Add spaces every 4 digits
  const matches = v.match(/\d{4,16}/g);
  const match = matches && matches[0] || '';
  const parts = [];
  
  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4));
  }
  
  if (parts.length) {
    return parts.join(' ');
  } else {
    return v;
  }
}