'use client'
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
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  password: (password) => {
    return password.length >= 8;
  },
  name: (name) => {
    return name.trim().length >= 2;
  },
  username: (username) => {
    return username.trim().length >= 3;
  }
};

export default function AuthPage() {
  const [currentView, setCurrentView] = useState('login');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    password: '',
    username: ''
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});
  
  const { login, googleLogin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const fromCheckout = searchParams.get('fromCheckout') === 'true';
  const isAdminRoute = callbackUrl.includes('/admin');
  const authError = searchParams.get('error');

  // Validation state
  const fieldValidation = useMemo(() => {
    return {
      firstName: {
        isValid: validators.name(formData.firstName),
        message: 'First name must be at least 2 characters'
      },
      email: {
        isValid: validators.email(formData.email),
        message: 'Please enter a valid email address'
      },
      password: {
        isValid: validators.password(formData.password),
        message: 'Password must be at least 8 characters'
      },
      username: {
        isValid: validators.username(formData.username),
        message: 'Username must be at least 3 characters'
      }
    };
  }, [formData]);

  const isFormValid = useMemo(() => {
    if (currentView === 'login') {
      return formData.username.trim() && formData.password.trim();
    } else {
      return fieldValidation.firstName.isValid && 
             fieldValidation.email.isValid && 
             fieldValidation.password.isValid;
    }
  }, [currentView, formData, fieldValidation]);

  // Handle Google OAuth redirect
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      console.log('Google OAuth successful, redirecting...');
      router.push(callbackUrl);
    }
  }, [session, status, router, callbackUrl]);

  // Handle auth errors from URL params
  useEffect(() => {
    if (authError) {
      const errorMessages = {
        'OAuthSignin': 'Error occurred during sign in',
        'OAuthCallback': 'Error occurred during OAuth callback',
        'OAuthCreateAccount': 'Could not create OAuth account',
        'EmailCreateAccount': 'Could not create account with email',
        'Callback': 'Error occurred during callback',
        'OAuthAccountNotLinked': 'Account not linked. Please sign in with the same method you used originally.',
        'EmailSignin': 'Check your email for a sign in link',
        'CredentialsSignin': 'Invalid credentials',
        'default': 'An error occurred during authentication'
      };
      setError(errorMessages[authError] || errorMessages.default);
    }
  }, [authError]);

  const toggleView = useCallback(() => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setError('');
    setSuccessMessage('');
    setTouchedFields({});
    
    setTimeout(() => {
      setCurrentView(prev => prev === 'login' ? 'register' : 'login');
      setFormData({
        firstName: '',
        email: '',
        password: '',
        username: ''
      });
      setIsTransitioning(false);
    }, 150);
  }, [isTransitioning]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors when user starts typing
    if (error) setError('');
    if (successMessage) setSuccessMessage('');
  }, [error, successMessage]);

  const handleBlur = useCallback((fieldName) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
  }, []);

  const getFieldError = useCallback((fieldName) => {
    if (!touchedFields[fieldName]) return null;
    const validation = fieldValidation[fieldName];
    return validation && !validation.isValid ? validation.message : null;
  }, [touchedFields, fieldValidation]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await signIn('google', {
        callbackUrl: callbackUrl,
        redirect: false
      });
      
      if (result?.error) {
        setError('Failed to sign in with Google');
      }
    } catch (err) {
      console.error('Google sign in error:', err);
      setError('Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <MarketingHeader />
      
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Link href="/" className="inline-block mb-8">
              <Image
                src={Logo}
                alt="ThinkHuge"
                width={200}
                height={60}
                className="mx-auto"
              />
            </Link>
            
            <h1 className="text-4xl font-haas font-medium text-gray-900 mb-2">
              {currentView === 'login' ? 'Sign In' : 'Create Account'}
            </h1>
            <p className="text-gray-450 text-base">{
              fromCheckout && currentView === 'login' 
                ? 'Please sign in to complete your purchase.' 
                : fromCheckout && currentView === 'register'
                ? 'Create an account to complete your purchase.'
                : currentView === 'login'
                ? 'Please login to continue to your account.'
                : 'Please fill in the details to create your account.'
            }</p>
          </div>

          <div className="space-y-6">
            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">Or</span>
              </div>
            </div>

            {/* Error/Success Messages */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <span className="text-sm text-red-700">{error}</span>
                </motion.div>
              )}
              
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-green-700">{successMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <AnimatePresence mode="wait">
              <motion.form
                key={currentView}
                initial={{ opacity: 0, x: currentView === 'login' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: currentView === 'login' ? 20 : -20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {currentView === 'register' && (
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('firstName')}
                      className={`appearance-none relative block w-full px-3 py-3 border ${
                        getFieldError('firstName') ? 'border-red-300' : 'border-gray-300'
                      } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-colors`}
                      placeholder="Enter your first name"
                    />
                    {getFieldError('firstName') && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {getFieldError('firstName')}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label htmlFor={currentView === 'login' ? 'username' : 'email'} className="block text-sm font-medium text-gray-700 mb-1">
                    {currentView === 'login' ? 'Username or Email' : 'Email Address'}
                  </label>
                  <input
                    id={currentView === 'login' ? 'username' : 'email'}
                    name={currentView === 'login' ? 'username' : 'email'}
                    type={currentView === 'login' ? 'text' : 'email'}
                    required
                    value={currentView === 'login' ? formData.username : formData.email}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur(currentView === 'login' ? 'username' : 'email')}
                    className={`appearance-none relative block w-full px-3 py-3 border ${
                      currentView === 'register' && getFieldError('email') ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-colors`}
                    placeholder={currentView === 'login' ? 'Enter your username or email' : 'Enter your email address'}
                  />
                  {currentView === 'register' && getFieldError('email') && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {getFieldError('email')}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur('password')}
                    className={`appearance-none relative block w-full px-3 py-3 border ${
                      currentView === 'register' && getFieldError('password') ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-colors`}
                    placeholder="Enter your password"
                  />
                  {currentView === 'register' && getFieldError('password') && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {getFieldError('password')}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !isFormValid}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-cta hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {currentView === 'login' ? 'Signing In...' : 'Creating Account...'}
                    </div>
                  ) : (
                    currentView === 'login' ? 'Sign In' : 'Create Account'
                  )}
                </button>
              </motion.form>
            </AnimatePresence>

            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                {currentView === 'login' ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={toggleView}
                  disabled={isTransitioning}
                  className="text-blue-cta hover:text-blue-500 font-medium disabled:opacity-50 underline"
                >
                  {currentView === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
              
              {fromCheckout && (
                <p className="text-gray-450 font-base mt-4">
                  <button
                    onClick={() => router.push('/control-panel')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Return to server configuration
                  </button>
                </p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      
      <Footer />
    </div>
  );

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
            window.location.href = callbackUrl || '/';
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
          
          // Show success message before redirecting
          setError('');
          setSuccessMessage('Account created successfully! Redirecting...');
          
          setTimeout(() => {
            router.push(callbackUrl || '/'); // Use the callback URL for proper routing
          }, 1500);
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
}