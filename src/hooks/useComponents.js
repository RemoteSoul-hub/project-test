// hooks/useComponents.js - Updated to use admin-configured components

import { useState, useEffect } from 'react';

export function useComponents(filters = {}) {
  const [components, setComponents] = useState({
    cpu: [],
    memory: [],
    storage: [],
    location: [],
    operatingSystems: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  useEffect(() => {
    fetchComponents();
  }, [JSON.stringify(filters)]); // Re-fetch when filters change

  const fetchComponents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters from filters
      const queryParams = new URLSearchParams();
      
      // Always fetch only enabled components for end users
      queryParams.append('enabled', 'true');
      
      if (filters.region) {
        queryParams.append('region', filters.region);
      }
      
      if (filters.minCores) {
        queryParams.append('minCores', filters.minCores);
      }
      
      if (filters.maxPrice) {
        queryParams.append('maxPrice', filters.maxPrice);
      }

      // Use the new admin API endpoint but only fetch enabled components
      const url = `/api/admin/components${queryParams.toString() ? `?${queryParams.toString()}` : '?enabled=true'}`;
      const response = await fetch(url);

      if (!response.ok) {
        // Fallback to original API if admin endpoint fails
        console.warn('Admin components API failed, falling back to original API');
        return await fetchFallbackComponents(filters);
      }

      const data = await response.json();
      
      // Transform the admin API response to match the expected component structure
      const transformedComponents = transformAdminComponents(data.data);
      
      // Check if we're using any fallback data
      const usingFallback = response.headers.get('X-Fallback') === 'true';
      setIsUsingFallback(usingFallback);
      
      if (usingFallback) {
        console.warn('Using fallback data - DataPacket API may be unavailable');
      }

      setComponents(transformedComponents);
    } catch (err) {
      console.error('Error fetching components:', err);
      setError(err.message);
      
      // Try fallback to original API
      try {
        await fetchFallbackComponents(filters);
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
        setComponents({
          cpu: [],
          memory: [],
          storage: [],
          location: [],
          operatingSystems: []
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Fallback to original API if admin API is not available
  const fetchFallbackComponents = async (filters) => {
    const queryParams = new URLSearchParams();
    
    if (filters.region) {
      queryParams.append('region', filters.region);
    }
    
    if (filters.minCores) {
      queryParams.append('minCores', filters.minCores);
    }
    
    if (filters.maxPrice) {
      queryParams.append('maxPrice', filters.maxPrice);
    }

    const url = `/api/components${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    setIsUsingFallback(true);
    setComponents(data);
  };

  // Transform admin API response to match expected component structure
  const transformAdminComponents = (adminComponents) => {
    const transformed = {
      cpu: [],
      memory: [],
      storage: [],
      location: [],
      operatingSystems: []
    };

    adminComponents.forEach(component => {
      // Use custom values if set by admin, otherwise use original values
      const transformedComponent = {
        id: component.id,
        name: component.custom_name || component.name,
        type: component.type,
        base_price: component.custom_price !== null ? component.custom_price : component.base_price,
        specs: component.specs,
        available: true, // Only enabled components are returned
        
        // Include original values for reference
        original_name: component.name,
        original_price: component.base_price,
        admin_notes: component.admin_notes,
        sort_order: component.sort_order
      };

      // Add to appropriate category
      if (transformed[component.type]) {
        transformed[component.type].push(transformedComponent);
      }
    });

    // Sort each type by sort_order, then by name
    Object.keys(transformed).forEach(type => {
      transformed[type].sort((a, b) => {
        if (a.sort_order !== b.sort_order) {
          return a.sort_order - b.sort_order;
        }
        return a.name.localeCompare(b.name);
      });
    });

    return transformed;
  };

  // Function to provision a server using the selected configuration
  const provisionServer = async (configurationData) => {
    try {
      const response = await fetch('/api/components', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configurationData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to provision server');
      }

      return result.server;
    } catch (err) {
      console.error('Error provisioning server:', err);
      throw err;
    }
  };

  // Function to refresh components data
  const refresh = () => {
    fetchComponents();
  };

  return {
    components,
    loading,
    error,
    isUsingFallback,
    provisionServer,
    refresh
  };
}

// Enhanced version with caching and advanced filtering
export function useComponentsAdvanced(initialFilters = {}) {
  const [filters, setFilters] = useState(initialFilters);
  const [cache, setCache] = useState(new Map());
  const [lastFetch, setLastFetch] = useState(null);
  
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  const {
    components,
    loading,
    error,
    isUsingFallback,
    provisionServer,
    refresh: baseRefresh
  } = useComponents(filters);

  // Check if cache is still valid
  const isCacheValid = () => {
    return lastFetch && (Date.now() - lastFetch) < CACHE_DURATION;
  };

  // Update filters and trigger re-fetch
  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Clear specific filter
  const clearFilter = (filterKey) => {
    setFilters(prev => {
      const updated = { ...prev };
      delete updated[filterKey];
      return updated;
    });
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters(initialFilters);
  };

  // Enhanced refresh with cache management
  const refresh = (force = false) => {
    if (force || !isCacheValid()) {
      baseRefresh();
      setLastFetch(Date.now());
    }
  };

  // Get filtered components by type with additional client-side filtering
  const getFilteredComponents = (type, additionalFilters = {}) => {
    let items = components[type] || [];

    // Apply additional client-side filters
    if (additionalFilters.available !== undefined) {
      items = items.filter(item => item.available === additionalFilters.available);
    }

    if (additionalFilters.maxPrice) {
      items = items.filter(item => item.base_price <= additionalFilters.maxPrice);
    }

    if (additionalFilters.minPrice) {
      items = items.filter(item => item.base_price >= additionalFilters.minPrice);
    }

    if (additionalFilters.search) {
      const search = additionalFilters.search.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(search) ||
        (item.specs && JSON.stringify(item.specs).toLowerCase().includes(search))
      );
    }

    return items;
  };

  // Get component by ID
  const getComponentById = (type, id) => {
    const items = components[type] || [];
    return items.find(item => item.id === id);
  };

  // Get available regions
  const getAvailableRegions = () => {
    const locations = components.location || [];
    const regions = new Set();
    
    locations.forEach(location => {
      try {
        const specs = typeof location.specs === 'string' 
          ? JSON.parse(location.specs) 
          : location.specs;
        if (specs && specs.region) {
          regions.add(specs.region);
        }
      } catch (e) {
        // Handle locations without proper specs
      }
    });
    
    return Array.from(regions);
  };

  // Get price range for components
  const getPriceRange = (type) => {
    const items = components[type] || [];
    if (items.length === 0) return { min: 0, max: 0 };
    
    const prices = items.map(item => item.base_price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  };

  return {
    components,
    loading,
    error,
    isUsingFallback,
    filters,
    provisionServer,
    refresh,
    updateFilters,
    clearFilter,
    resetFilters,
    getFilteredComponents,
    getComponentById,
    getAvailableRegions,
    getPriceRange,
    isCacheValid: isCacheValid()
  };
}