'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signup, setAuthToken, setUser } from '@/services/AuthService';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await signup(fullName, email, password);
      setAuthToken(response.data.token);
      setUser(response.data.user);
      router.push('/'); // Redirect to dashboard
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen bg-white">
      {/* Left side - Signup Form */}
      <div className="w-1/2 p-8 flex flex-col">
        <div className="mb-16">
          <Image
            src="/logo-thinkhuge.svg"
            alt="ThinkHuge Logo"
            width={150}
            height={40}
            className="dark:invert"
            style={{ width: 'auto', height: 'auto' }}
          />
        </div>

        <div className="max-w-md w-full mx-auto">
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-gray-600 mb-8">Please fill in your details to create your account.</p>

          <button className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg p-3 mb-6 hover:bg-gray-50 transition-colors">
            <Image 
              src="/google.svg" 
              alt="Google" 
              width={20} 
              height={20} 
              style={{ width: 'auto', height: 'auto' }}
            />
            Sign in with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoComplete="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <p className="text-sm text-gray-500 mt-1">Must be at least 8 characters</p>
              </div>

              {error && (
                <div className="text-red-500 text-sm mb-4">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 text-white rounded-lg py-3 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Marketing Content */}
      <div className="w-1/2 bg-gradient-to-br from-blue-900 to-purple-900 p-12 flex flex-col justify-center text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 bg-opacity-20 rounded-full mb-8">
            <span className="text-xs font-semibold bg-purple-500 text-white px-2 py-1 rounded-full">New</span>
            <span className="text-sm">Launch AI Agents</span>
          </div>

          <h2 className="text-5xl font-bold mb-6">
            Empower<br />
            Your Business with<br />
            <span className="text-purple-400">Premier</span>{' '}
            <span className="text-blue-400">Hosting</span><br />
            Solutions
          </h2>

          <p className="text-2xl mb-8">
            Operating in{' '}
            <span className="text-purple-400">55 locations</span><br />
            globally and growing.
          </p>

          <div className="mt-12">
            <h3 className="text-4xl font-bold mb-4">
              Talk to our<br />
              experts <span className="text-purple-400">today!</span>
            </h3>
            <button className="mt-4 px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors">
              Get Started Now
            </button>
          </div>
        </div>

        {/* Background decorative pattern */}
        <div className="absolute bottom-0 right-0 w-full h-64 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)',
            backgroundSize: '100px 100px',
            transform: 'rotate(-45deg)'
          }}></div>
        </div>
      </div>
    </main>
  );
}
