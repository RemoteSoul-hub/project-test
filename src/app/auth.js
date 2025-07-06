import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

/**
 * Helper function to set cookies that work across domains
 * @param {string} name Cookie name
 * @param {string} value Cookie value
 * @param {number} days Expiration in days
 */
function setCrossDomainCookie(name, value, days = 30) {
  const expirationDate = new Date();
  expirationDate.setTime(expirationDate.getTime() + (days * 24 * 60 * 60 * 1000));
  
  // Set as a secure cookie with SameSite=None to work across domains
  // Note: SameSite=None requires Secure to be set
  const cookie = `${name}=${encodeURIComponent(value)}; expires=${expirationDate.toUTCString()}; path=/; SameSite=None; Secure`;
  
  return cookie;
}

export const authOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
    error: '/auth-error',
  },
  debug: false,
  events: {
    async signOut() {
      // Clear any problematic cookies on sign out
      console.log('User signed out');
    },
  },
cookies: {
  sessionToken: {
    name: `next-auth.session-token`,
    options: {
      httpOnly: true,
      sameSite: 'lax', // Keep as 'lax' for same-origin
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    },
  },
},
  callbacks: {
async jwt({ token, account, user, req }) {
  // Don't return null for token decryption errors - let NextAuth handle it
  
  // Initial sign in (Google)
  if (account && user) {
    console.log('Initial Google sign-in detected');
    token.accessToken = account.access_token;
    token.idToken = account.id_token;
    token.isAdmin = false;

    // Exchange Google token for Laravel token
    if (account.provider === 'google' && account.id_token) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ id_token: account.id_token }),
        });

        if (response.ok) {
          const responseData = await response.json();
          if (responseData.token) {
            token.laravelApiToken = responseData.token;
            token.isAdmin = responseData.user?.roles?.includes('admin') || false;
            console.log('Laravel token obtained successfully');
          }
        } else {
          console.error('Laravel API error:', response.status);
          // Don't fail the authentication, just log the error
        }
      } catch (error) {
        console.error('Network error during token exchange:', error);
        // Don't fail the authentication, just log the error
      }
    }
  }

  // Handle existing token (subsequent requests)
  if (token && !account) {
    // This is a subsequent request, token should be valid
    return token;
  }

  return token;
},
    async session({ session, token }) {
      // Add properties from the JWT token to the session object
      if (token) {
        session.accessToken = token.accessToken;
        session.idToken = token.idToken;
        session.isAdmin = token.isAdmin;
        session.laravelApiToken = token.laravelApiToken;
        session.shouldSetCookie = token.shouldSetCookie;
        // Add user ID if needed: session.user.id = token.sub;
      }
      return session;
    },
  },
  trustHost: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
