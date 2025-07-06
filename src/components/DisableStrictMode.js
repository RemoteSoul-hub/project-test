'use client';

import React, { useRef, useEffect } from 'react';

/**
 * DisableStrictMode
 * 
 * This component renders Swagger UI in a way that avoids React's StrictMode warnings
 * while keeping the content in the same DOM position.
 * 
 * It directly initializes Swagger UI using the DOM API instead of using the React component.
 */
const DisableStrictMode = ({ spec }) => {
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Load Swagger UI script and styles if they're not already loaded
    let swaggerScript = document.getElementById('swagger-ui-bundle');
    let swaggerStyles = document.getElementById('swagger-ui-styles');
    
    if (!swaggerStyles) {
      swaggerStyles = document.createElement('link');
      swaggerStyles.id = 'swagger-ui-styles';
      swaggerStyles.rel = 'stylesheet';
      swaggerStyles.href = 'https://unpkg.com/swagger-ui-dist/swagger-ui.css';
      document.head.appendChild(swaggerStyles);
    }
    
    const initSwaggerUI = () => {
      if (window.SwaggerUIBundle && containerRef.current) {
        // Clear any previous content
        containerRef.current.innerHTML = '';
        
        // Create the Swagger UI container
        const swaggerContainer = document.createElement('div');
        swaggerContainer.id = 'swagger-ui-' + Math.random().toString(36).substring(2, 9);
        containerRef.current.appendChild(swaggerContainer);
        
        // Initialize Swagger UI
        window.ui = window.SwaggerUIBundle({
          spec: spec,
          dom_id: '#' + swaggerContainer.id,
          docExpansion: 'list',
          defaultModelsExpandDepth: 1,
          defaultModelExpandDepth: 1,
          displayRequestDuration: true
        });
      }
    };
    
    if (!swaggerScript) {
      swaggerScript = document.createElement('script');
      swaggerScript.id = 'swagger-ui-bundle';
      swaggerScript.src = 'https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js';
      swaggerScript.onload = initSwaggerUI;
      document.body.appendChild(swaggerScript);
    } else {
      // Script already loaded, initialize Swagger UI directly
      initSwaggerUI();
    }
    
    return () => {
      // No need to remove the script and styles as they might be used by other instances
    };
  }, [spec]);
  
  return <div ref={containerRef} className="swagger-ui-wrapper" />;
};

export default DisableStrictMode;
