'use client';

import React from 'react';
import DisableStrictMode from './DisableStrictMode';

/**
 * SwaggerUIWithErrorSuppression
 * 
 * This component renders Swagger UI without React's StrictMode warnings
 * by using a custom implementation that avoids the deprecated lifecycle methods.
 */
const SwaggerUIWithErrorSuppression = ({ spec }) => {
  return (
    <div className="swagger-ui-container">
      <DisableStrictMode spec={spec} />
    </div>
  );
};

export default SwaggerUIWithErrorSuppression;
