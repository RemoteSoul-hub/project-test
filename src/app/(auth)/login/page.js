'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import Link from 'next/link';
import Image from 'next/image';
import Logo from '@/assets/images/logo-thinkhuge.svg';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import MarketingHeader from '@/components/MarketingHeader';
import Footer from '@/components/Footer-fe';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { signup, setAuthToken, setUser } from '@/services/AuthService';

// Validation utilities (unchanged)
const validators = {
  username: (username) => {
    if (!username || typeof username !== 'string' || !username.trim()) {
      return { isValid: false, message: 'Username is required' };
    }
    return username.length >= 3
      ? { isValid: true, message: 'Username looks good!' }
      : { isValid: false, message: 'Username must be at least 3 characters' };
  },
  
  email: (email) => {
    if (!email || typeof email !== 'string' || !email.trim()) {
      return { isValid: false, message: 'Email is required' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim()) 
      ? { isValid: true, message: 'Email looks good!' }
      : { isValid: false, message: 'Please enter a valid email address' };
  },
  
  password: (password) => {
    if (!password || typeof password !== 'string' || !password.trim()) {
      return { isValid: false, message: 'Password is required' };
    }
    return password.length >= 6
      ? { isValid: true, message: 'Password accepted' }
      : { isValid: false, message: 'Password must be at least 6 characters' };
  },

  zipCode: (zipCode) => {
    if (!zipCode || typeof zipCode !== 'string' || !zipCode.trim()) {
      return { isValid: false, message: 'Zip code is required' };
    }
    return zipCode.length >= 3
      ? { isValid: true, message: 'Valid zip code' }
      : { isValid: false, message: 'Zip code seems too short' };
  },
  
  required: (value, fieldName) => {
    if (!value || typeof value !== 'string' || !value.trim()) {
      return { isValid: false, message: `${fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required` };
    }
    return { isValid: true, message: '' };
  }
};

// Updated ValidatedInput component with cleaner styling
const ValidatedInput = ({ 
  field, 
  type = 'text', 
  label, 
  placeholder, 
  value,
  onChange,
  onBlur,
  validation,
  disabled = false,
  optional = false
}) => {
  const hasError = validation.isValid === false;
  const hasSuccess = validation.isValid === true;

  const handleChange = useCallback((e) => {
    let inputValue = e.target.value;
    if (field === 'zipCode') {
      inputValue = inputValue.replace(/\D/g, '');
    }
    onChange(field, inputValue);
  }, [field, onChange]);

  const handleFieldBlur = useCallback(() => {
    onBlur(field);
  }, [field, onBlur]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-2"
    >
      <label className="block text-base font-medium text-slate mb-1">
        {label} {optional && <span className="text-gray-450 font-normal">(optional)</span>}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={handleFieldBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-4 py-3 border rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium ${
            hasError 
              ? 'border-red-300 focus:ring-red-500' 
              : hasSuccess
              ? 'border-green-300 focus:ring-green-500'
              : 'border-gray-300 focus:ring-blue-500 hover:border-gray-400'
          }`}
        />
        
        {validation.isValid !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            {hasError ? (
              <XCircle className="w-5 h-5 text-red-500" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
          </motion.div>
        )}
      </div>
      
      {validation.message && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
          className={`text-xs transition-colors ${
            hasError ? 'text-red-500' : hasSuccess ? 'text-green-500' : 'text-gray-500'
          }`}
        >
          {validation.message}
        </motion.p>
      )}
    </motion.div>
  );
};

export default function AuthPage() {
  const [currentView, setCurrentView] = useState('login');
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    companyName: '',
    streetAddress: '',
    city: '',
    zipCode: '',
    country: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});
  
  const { login, googleLogin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const isAdminRoute = callbackUrl.includes('/admin');
  const authError = searchParams.get('error');

  // All hooks and logic (unchanged from original)
  useEffect(() => {
    const path = window.location.pathname;
    const newView = path.includes('register') ? 'register' : 'login';
    if (newView !== currentView) {
      setCurrentView(newView);
    }
  }, [currentView]);

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
        case 'username':
          results[field] = validators.username(value);
          break;
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
          results[field] = { isValid: null, message: '' };
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

  const isFormValid = useMemo(() => {
    if (currentView === 'login') {
      return formData.username.trim() && formData.password.trim() && 
        validationResults.username.isValid !== false && 
        validationResults.password.isValid !== false;
    } else {
      const requiredFields = ['firstName', 'lastName', 'email', 'streetAddress', 'city', 'zipCode', 'country', 'password'];
      return requiredFields.every(field => {
        const validation = validationResults[field];
        return validation.isValid === true || 
               (validation.isValid === null && validators.required(formData[field], field).isValid);
      });
    }
  }, [currentView, validationResults, formData]);

  // All event handlers (unchanged)
  useEffect(() => {
    if (authError) {
      switch (authError) {
        case 'OAuthSignin':
          setError('Error starting the OAuth sign-in flow.');
          break;
        case 'OAuthCallback':
          setError('Error during the OAuth callback.');
          break;
        case 'OAuthCreateAccount':
          setError('Error creating the OAuth user in the database.');
          break;
        case 'EmailCreateAccount':
          setError('Error creating the email user in the database.');
          break;
        case 'Callback':
          setError('Error during the callback handling.');
          break;
        case 'OAuthAccountNotLinked':
          setError('Email already in use with different provider.');
          break;
        case 'EmailSignin':
          setError('Error sending the email for sign in.');
          break;
        case 'CredentialsSignin':
          setError('Invalid credentials.');
          break;
        case 'SessionRequired':
          setError('Authentication required to access this page.');
          break;
        default:
          setError(`Authentication error: ${authError}`);
          break;
      }
    }
  }, [authError]);

  useEffect(() => {
    if (session && isAdminRoute && session.isAdmin) {
      router.push(callbackUrl);
    }
    else if (session && !isAdminRoute) {
      router.push(callbackUrl);
    }
  }, [session, callbackUrl, isAdminRoute, router]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) {
      setError('');
    }
  }, [error]);

  const handleBlur = useCallback((field) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
  }, []);

const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (currentView === 'login') {
      setTouchedFields({ username: true, password: true });
    } else {
      const allFields = Object.keys(formData);
      setTouchedFields(allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {}));
    }
    
    if (!isFormValid) {
      setLoading(false);
      return;
    }
    
    try {
      if (currentView === 'login') {
        console.log('Attempting login with username:', formData.username);
        const result = await login(formData.username, formData.password);
        console.log('Login result:', result);
        
        if (!result.success) {
          setError(result.error);
        } else {
          setError('');
          setTimeout(() => {
            console.log('Manual redirect to dashboard');
            window.location.href = '/';
          }, 500);
        }
      } else {
        // Registration logic
        console.log('Registration data:', formData);
        
        // Validate password length (matching your signup page logic)
        if (formData.password.length < 8) {
          setError('Password must be at least 8 characters');
          setLoading(false);
          return;
        }
        
        try {
          // Use the same AuthService as your signup page
          const response = await signup(formData.firstName, formData.email, formData.password);
          
          // Set auth token and user (same as signup page)
          setAuthToken(response.data.token);
          setUser(response.data.user);
          
          // Registration successful - redirect to dashboard
          setError('');
          router.push(callbackUrl); // Use the callback URL for proper routing
          
        } catch (err) {
          console.error('Registration error:', err);
          setError(err.message || 'Failed to create account');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || `Failed to ${currentView === 'login' ? 'sign in' : 'register'}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleView = useCallback(() => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentView(prev => prev === 'login' ? 'register' : 'login');
      setError('');
      window.history.pushState({}, '', currentView === 'login' ? '/register' : '/login');
      setIsTransitioning(false);
    }, 150);
  }, [currentView, isTransitioning]);

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col bg-white min-h-screen">
        {/* Logo - Fixed at top */}
        <div className="py-8 lg:py-12">
          <div className="flex items-center">
            <Image
              src={Logo}
              alt="ThinkHuge"
              width={120}
              height={32}
              className="h-8 w-auto px-6 lg:px-8"
            />
          </div>
        </div>
        
        {/* Main Content - Centered vertically */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-8">
          <div className="w-full max-w-sm">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ 
                  duration: 0.4, 
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
              >
                {/* Header */}
                <div className="mb-8">
                  <h1 className="text-4xl font-haas font-medium text-gray-900 mb-2">
                    {currentView === 'login' ? 'Sign In' : 'Create Account'}
                  </h1>
                  <p className="text-gray-450 text-base">
                    {currentView === 'login' 
                      ? 'Please login to continue to your account.' 
                      : 'Please fill in the details to create your account.'
                    }
                  </p>
                </div>

                <div className="space-y-6">


                  {/* Form Fields */}
                  <div className="space-y-4">
                    {currentView === 'register' && (
                      <>
                        <ValidatedInput
                          field="firstName"
                          label="Full Name"
                          placeholder="Enter your full name"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          validation={validationResults.firstName}
                          disabled={loading}
                        />
                      </>
                    )}

                    {currentView === 'login' ? (
                      <ValidatedInput
                        field="username"
                        type="text"
                        label="Username"
                        placeholder="Enter your username"
                        value={formData.username}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        validation={validationResults.username}
                        disabled={loading}
                      />
                    ) : (
                      <ValidatedInput
                        field="email"
                        type="email"
                        label="Email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        validation={validationResults.email}
                        disabled={loading}
                      />
                    )}

                    <ValidatedInput
                      field="password"
                      type="password"
                      label="Password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      validation={validationResults.password}
                      disabled={loading}
                    />

                    {currentView === 'register' && (
                      <p className="text-sm text-slate">Must be at least 8 characters</p>
                    )}
                  </div>

                  {/* Error Message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="rounded-lg bg-red-50 p-4 border border-red-200"
                      >
                        <div className="flex items-center">
                          <XCircle className="w-5 h-5 text-red-500 mr-2" />
                          <div className="text-sm text-red-700">
                            {error}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={!isFormValid || loading}
                    className={`w-full py-4 px-4 rounded-sd font-medium transition-all duration-200 ${
                      isFormValid && !loading
                        ? "bg-blue-600 hover:bg-blue-700 text-white" 
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {loading ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-center"
                        >
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </motion.div>
                      ) : (
                        <motion.span
                          key="text"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          {currentView === 'login' ? 'Sign in' : 'Create account'}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>

                  {/* Toggle Link */}
                  <p className="text-gray-450 font-base">
                    {currentView === 'login' ? "Don't have an account? " : "Already have an account? "}
                    <button
                      onClick={toggleView}
                      disabled={isTransitioning}
                      className="text-blue-cta hover:text-blue-500 font-medium disabled:opacity-50"
                    >
                      {currentView === 'login' ? 'Sign up' : 'Sign in'}
                    </button>
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        
        {/* Footer */}
        <div className="py-8 lg:py-12">
          <p className="text-xs text-gray-400 px-6 lg:px-8">
            © 2025 ThinkHuge Ltd. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Side - Text Content */}
      <div className="hidden lg:block relative flex-1 px-4 xl:px-8">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('bg/login-gradient-bg.png')"
          }}
        >
          {/* overlay for text readability */}
          <div className="absolute inset-0 bg-black/30" />
          {/* Content */}
          <div className="relative h-full flex flex-col justify-center px-12 xl:px-16">
            {/* Main Content */}
            <div className="flex-1 flex flex-col justify-center">
              {/* New Badge */}
              <div className="mb-8">
                <span className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium text-purple-200 true-gradient-border">
                  <span className="rounded-full mr-2 th-gradient py-2 px-4 text-sm text-white relative z-10">
                    New
                  </span>
                  <span className="ml-2 text-white text-base font-semibold relative z-10">Launch AI Agents ✨</span>
                </span>
              </div>

              {/* Main Heading */}
              <div className="mb-8">
                <h1 className="text-5xl xl:text-7xl font-haas font-medium text-white leading-tight">
                  Empower<br />
                  Your Business with<br />
                  <span className="ai-gradient">
                    Premier Hosting<br />
                    Solutions
                  </span>
                </h1>
              </div>

              {/* Subheading */}
              <div className="mb-12">
                <p className="text-4xl text-primary-light font-haas font-medium">
                  Operating in <span className="ai-gradient">55 locations</span><br />
                  globally and growing.
                </p>
              </div>
            </div>

            {/* CTA Section */}
            <div className="mt-auto mb-12">
              <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between xl:gap-8">
                <h2 className="font-haas text-4xl lg:text-5xl xl:text-6xl font-medium text-white mb-6 xl:mb-0 xl:flex-1">
                  Talk to our<br /> experts&nbsp; 
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">today!
                  </span>
                </h2>
                
                <div className="xl:flex-shrink-0">
                  <button 
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-b from-[#171515] via-[#25199B] to-[#8008FF] text-white font-medium rounded-3xl"
                    style={{
                      transition: '.3s linear',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'linear-gradient(27deg, #8008ff 50.16%, #25199b 104.16%, #171515 172.72%, #050219 220.39%)';
                      e.target.style.boxShadow = '0 0 12px 0 #8e6fed';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'linear-gradient(to bottom, #171515, #25199B, #8008FF)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    Get Started Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}