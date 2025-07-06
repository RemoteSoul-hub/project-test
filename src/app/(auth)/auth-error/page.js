'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Logo from '@/assets/images/logo-thinkhuge.svg';

export default function AuthErrorPage() {
  const [errorMessage, setErrorMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  
  useEffect(() => {
    const error = searchParams.get('error');
    
    if (error) {
      switch (error) {
        case 'OAuthSignin':
          setErrorMessage('Error starting the OAuth sign-in flow');
          setErrorDetails('There was a problem initiating the Google sign-in process. This could be due to configuration issues or network problems.');
          break;
        case 'OAuthCallback':
          setErrorMessage('Error during the OAuth callback');
          setErrorDetails('There was a problem processing the response from Google. This could be due to a mismatch in the expected response or an issue with the callback URL configuration.');
          break;
        case 'OAuthCreateAccount':
          setErrorMessage('Error creating the OAuth user account');
          setErrorDetails('There was a problem creating a user account with the information provided by Google. This could be due to missing or invalid user data.');
          break;
        case 'EmailCreateAccount':
          setErrorMessage('Error creating the email user account');
          setErrorDetails('There was a problem creating a user account with the provided email. This could be due to an existing account or database issues.');
          break;
        case 'Callback':
          setErrorMessage('Error during the callback handling');
          setErrorDetails('There was a problem processing the authentication callback. This could be due to configuration issues or an unexpected response format.');
          break;
        case 'OAuthAccountNotLinked':
          setErrorMessage('Email already in use with different provider');
          setErrorDetails('The email address is already associated with another authentication method. Please use the original sign-in method or contact support for assistance.');
          break;
        case 'EmailSignin':
          setErrorMessage('Error sending the email for sign in');
          setErrorDetails('There was a problem sending the authentication email. Please check that the email address is correct and try again.');
          break;
        case 'CredentialsSignin':
          setErrorMessage('Invalid credentials');
          setErrorDetails('The username or password provided is incorrect. Please check your credentials and try again.');
          break;
        case 'SessionRequired':
          setErrorMessage('Authentication required');
          setErrorDetails('You need to be signed in to access this page. Please sign in and try again.');
          break;
        default:
          setErrorMessage(`Authentication error: ${error}`);
          setErrorDetails('An unexpected error occurred during the authentication process. Please try again or contact support if the issue persists.');
          break;
      }
    } else {
      setErrorMessage('Authentication error');
      setErrorDetails('An unknown error occurred during the authentication process. Please try again or contact support if the issue persists.');
    }
  }, [searchParams]);

  const handleTryAgain = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <div className="flex justify-center mb-8">
          <Image
            src={Logo}
            alt="ThinkHuge Logo"
            width={180}
            height={40}
            priority
          />
        </div>
        
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Authentication Failed</h1>
          <p className="text-gray-700 font-medium">{errorMessage}</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-sm text-gray-700">{errorDetails}</p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={handleTryAgain}
            className="w-full bg-blue-600 text-white rounded-lg py-3 hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
          
          <div className="text-center">
            <Link href="/" className="text-blue-600 hover:underline text-sm">
              Return to Home
            </Link>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            If you continue to experience issues, please contact our support team at{' '}
            <a href="mailto:support@thinkhuge.net" className="text-blue-600 hover:underline">
              support@thinkhuge.net
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
