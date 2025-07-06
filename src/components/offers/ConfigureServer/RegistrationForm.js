import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

// Constants
const VALIDATION_MESSAGES = {
  REQUIRED: (field) => `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`,
  EMAIL_INVALID: 'Please enter a valid email address',
  EMAIL_VALID: 'Email looks good!',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters',
  PASSWORD_VALID: 'Password strength: Good',
  ZIP_TOO_SHORT: 'Postal code seems too short',
  ZIP_VALID: 'Valid postal code'
};

const FORM_SUBMIT_DELAY = 2000;
const MIN_PASSWORD_LENGTH = 8;
const MIN_ZIP_LENGTH = 3;

// Validation utilities
const validators = {
  email: (email) => {
    if (!email || typeof email !== 'string' || !email.trim()) {
      return { isValid: false, message: VALIDATION_MESSAGES.REQUIRED('email') };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim()) 
      ? { isValid: true, message: VALIDATION_MESSAGES.EMAIL_VALID }
      : { isValid: false, message: VALIDATION_MESSAGES.EMAIL_INVALID };
  },
  
  password: (password) => {
    if (!password || typeof password !== 'string' || !password.trim()) {
      return { isValid: false, message: VALIDATION_MESSAGES.REQUIRED('password') };
    }
    return password.length >= MIN_PASSWORD_LENGTH
      ? { isValid: true, message: VALIDATION_MESSAGES.PASSWORD_VALID }
      : { isValid: false, message: VALIDATION_MESSAGES.PASSWORD_TOO_SHORT };
  },
  
  zipCode: (zipCode) => {
    if (!zipCode || typeof zipCode !== 'string' || !zipCode.trim()) {
      return { isValid: false, message: VALIDATION_MESSAGES.REQUIRED('zip code') };
    }
    // Allow letters, numbers, spaces, and hyphens for international postal codes
    const cleanZipCode = zipCode.trim();
    return cleanZipCode.length >= MIN_ZIP_LENGTH
      ? { isValid: true, message: VALIDATION_MESSAGES.ZIP_VALID }
      : { isValid: false, message: VALIDATION_MESSAGES.ZIP_TOO_SHORT };
  },
  
  required: (value, fieldName) => {
    if (!value || typeof value !== 'string' || !value.trim()) {
      return { isValid: false, message: VALIDATION_MESSAGES.REQUIRED(fieldName) };
    }
    return { isValid: true, message: '' };
  }
};

// Optimized ValidatedInput component
const ValidatedInput = React.memo(({ 
  field, 
  type = 'text', 
  label, 
  placeholder, 
  optional = false,
  className = '',
  value,
  onChange,
  onBlur,
  validation
}) => {
  const hasError = validation.isValid === false;
  const hasSuccess = validation.isValid === true;

  const handleChange = useCallback((e) => {
    let inputValue = e.target.value;
    // Apply field-specific formatting
    if (field === 'zipCode') {
      // Allow letters, numbers, spaces, and hyphens for international postal codes
      inputValue = inputValue.replace(/[^a-zA-Z0-9\s-]/g, '').toUpperCase();
    }
    onChange(field, inputValue);
  }, [field, onChange]);

  const handleFieldBlur = useCallback(() => {
    onBlur(field);
  }, [field, onBlur]);

  return (
    <div className={className}>
      <label className="block font-semibold text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-2">
        {label} {optional && <span className="text-gray-400 font-normal">optional</span>}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={handleFieldBlur}
          placeholder={placeholder}
          className={`w-full px-3 py-2 sm:py-3 pr-10 border rounded-lg bg-white dark:bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent font-medium text-sm sm:text-base transition-colors ${
            hasError 
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
              : hasSuccess
              ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
              : 'border-gray-300 dark:border-text-dark focus:ring-blue-500 focus:border-blue-500'
          }`}
        />
        
        {validation.isValid !== null && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {hasError ? (
              <XCircle className="w-5 h-5 text-red-500" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
          </div>
        )}
      </div>
      
      {validation.message && (
        <p className={`text-xs sm:text-sm mt-2 transition-colors ${
          hasError ? 'text-red-500' : hasSuccess ? 'text-green-500' : 'text-gray-500'
        }`}>
          {validation.message}
        </p>
      )}
    </div>
  );
});

ValidatedInput.displayName = 'ValidatedInput';

// Custom hook for form management
const useRegistrationForm = (initialData = {}) => {
  const [formData, setFormData] = useState({
    firstName: initialData.firstName || '',
    lastName: initialData.lastName || '',
    email: initialData.email || '',
    companyName: initialData.companyName || '',
    streetAddress: initialData.streetAddress || '',
    city: initialData.city || '',
    zipCode: initialData.zipCode || '',
    country: initialData.country || '',
    password: initialData.password || ''
  });
  
  const [touchedFields, setTouchedFields] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleBlur = useCallback((field) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
  }, []);

  // Memoized validation results
  const validationResults = useMemo(() => {
    const results = {};
    
    Object.keys(formData).forEach(field => {
      const value = formData[field];
      const isTouched = touchedFields[field];
      
      if (!isTouched) {
        results[field] = { isValid: null, message: '' };
        return;
      }

      switch (field) {
        case 'email':
          results[field] = validators.email(value);
          break;
        case 'password':
          results[field] = validators.password(value);
          break;
        case 'zipCode':
          results[field] = validators.zipCode(value);
          break;
        case 'companyName':
          results[field] = { isValid: null, message: '' }; // Optional field
          break;
        default:
          if (['firstName', 'lastName', 'streetAddress', 'city', 'country'].includes(field)) {
            results[field] = validators.required(value, field);
          } else {
            results[field] = { isValid: null, message: '' };
          }
      }
    });
    
    return results;
  }, [formData, touchedFields]);

  // Memoized form validity
  const isFormValid = useMemo(() => {
    const requiredFields = ['firstName', 'lastName', 'email', 'streetAddress', 'city', 'zipCode', 'country', 'password'];
    return requiredFields.every(field => {
      const validation = validationResults[field];
      return validation.isValid === true || 
             (validation.isValid === null && validators.required(formData[field], field).isValid);
    });
  }, [validationResults, formData]);

  // Memoized form completion percentage
  const formCompletion = useMemo(() => {
    const requiredFields = ['firstName', 'lastName', 'email', 'streetAddress', 'city', 'zipCode', 'country', 'password'];
    const validFields = requiredFields.filter(field => {
      const validation = validationResults[field];
      return validation.isValid === true || 
             (validation.isValid === null && validators.required(formData[field], field).isValid);
    });
    return Math.round((validFields.length / requiredFields.length) * 100);
  }, [validationResults, formData]);

  const markAllFieldsTouched = useCallback(() => {
    const allFields = Object.keys(formData);
    setTouchedFields(allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {}));
  }, [formData]);

  return {
    formData,
    validationResults,
    isFormValid,
    formCompletion,
    isSubmitting,
    setIsSubmitting,
    handleInputChange,
    handleBlur,
    markAllFieldsTouched
  };
};

export default function RegistrationForm({ setStep, onFormSubmit, initialData = {} }) {
  const {
    formData,
    validationResults,
    isFormValid,
    formCompletion,
    isSubmitting,
    setIsSubmitting,
    handleInputChange,
    handleBlur,
    markAllFieldsTouched
  } = useRegistrationForm(initialData);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    markAllFieldsTouched();
    
    if (!isFormValid) return;
    
    setIsSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, FORM_SUBMIT_DELAY));
      console.log('Form submitted successfully');
      onFormSubmit(formData);
      setStep(3);
    } catch (error) {
      console.error('Submission error:', error);
      // Add proper error handling here
    } finally {
      setIsSubmitting(false);
    }
  }, [isFormValid, markAllFieldsTouched, setIsSubmitting, onFormSubmit, formData, setStep]);

  const handleGoogleSignIn = useCallback(() => {
    console.log('Google sign in clicked');
    // Implement Google sign-in logic
  }, []);

  const handleSignInClick = useCallback(() => {
    setStep(1);
  }, [setStep]);

  return (
    <section className="max-w-xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-haas font-medium text-gradient mb-2">Register</h1>
          <p className="text-slate dark:text-text-dark text-sm sm:text-base">
            Already have an account?{' '}
            <button
              onClick={handleSignInClick}
              className="text-sm sm:text-base text-blue-500 hover:text-blue-600 font-semibold underline"
            >
              Sign in
            </button>
          </p>
          
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Profile completion</span>
              <span>{formCompletion}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${formCompletion}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Google Sign In */}
          <motion.button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 py-3 sm:py-4 px-4 border border-gray-300 dark:border-text-dark rounded-lg bg-transparent text-text-light dark:text-text-dark hover:bg-gray-50 dark:hover:bg-slate-700 font-semibold text-sm sm:text-base transition-colors"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            Sign in with Google
            <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          </motion.button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-text-dark"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-primary-light dark:bg-primary-dark text-gray-500 dark:text-gray-400">or</span>
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <ValidatedInput
              field="firstName"
              label="First name"
              placeholder="Enter your first name"
              value={formData.firstName}
              onChange={handleInputChange}
              onBlur={handleBlur}
              validation={validationResults.firstName}
            />
            <ValidatedInput
              field="lastName"
              label="Last name"
              placeholder="Enter your last name"
              value={formData.lastName}
              onChange={handleInputChange}
              onBlur={handleBlur}
              validation={validationResults.lastName}
            />
          </div>

          {/* Email */}
          <ValidatedInput
            field="email"
            type="email"
            label="Email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleInputChange}
            onBlur={handleBlur}
            validation={validationResults.email}
          />

          {/* Company Name */}
          <ValidatedInput
            field="companyName"
            label="Company name"
            placeholder="Enter company name"
            optional={true}
            value={formData.companyName}
            onChange={handleInputChange}
            onBlur={handleBlur}
            validation={validationResults.companyName}
          />

          {/* Street Address */}
          <ValidatedInput
            field="streetAddress"
            label="Street address"
            placeholder="Enter street address"
            value={formData.streetAddress}
            onChange={handleInputChange}
            onBlur={handleBlur}
            validation={validationResults.streetAddress}
          />

          {/* City and Zip Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <ValidatedInput
              field="city"
              label="City"
              placeholder="Enter city"
              value={formData.city}
              onChange={handleInputChange}
              onBlur={handleBlur}
              validation={validationResults.city}
            />
            <ValidatedInput
              field="zipCode"
              label="Zip code / Postal Code"
              placeholder="Enter zip or postal code"
              value={formData.zipCode}
              onChange={handleInputChange}
              onBlur={handleBlur}
              validation={validationResults.zipCode}
            />
          </div>

          {/* Country */}
          <ValidatedInput
            field="country"
            label="Country"
            placeholder="Enter country"
            value={formData.country}
            onChange={handleInputChange}
            onBlur={handleBlur}
            validation={validationResults.country}
          />

          {/* Password */}
          <ValidatedInput
            field="password"
            type="password"
            label="Password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleInputChange}
            onBlur={handleBlur}
            validation={validationResults.password}
          />

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={`w-full py-3 sm:py-4 px-6 rounded-lg font-semibold text-sm sm:text-base transition-all mt-8 relative overflow-hidden ${
              isFormValid && !isSubmitting
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl" 
                : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            }`}
            whileHover={isFormValid && !isSubmitting ? { scale: 1.01 } : {}}
            whileTap={isFormValid && !isSubmitting ? { scale: 0.99 } : {}}
          >
            <AnimatePresence mode="wait">
              {isSubmitting ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, rotate: 0 }}
                  animate={{ opacity: 1, rotate: 360 }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    rotate: { duration: 1, repeat: Infinity, ease: "linear" },
                    opacity: { duration: 0.2 }
                  }}
                  className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full mx-auto"
                />
              ) : (
                <motion.span
                  key="text"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center gap-2"
                >
                  {isFormValid ? 'Proceed to Payment' : 'Complete required fields'}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          
          {/* Form validation summary */}
          {!isFormValid && Object.keys(validationResults).some(field => validationResults[field].isValid !== null) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-sm text-gray-600 dark:text-gray-400"
            >
              Please fill in all required fields correctly to continue
            </motion.div>
          )}
        </form>
      </motion.div>
    </section>
  );
}