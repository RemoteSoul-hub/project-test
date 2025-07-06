import { auth } from './app/auth';
import { NextResponse } from 'next/server';

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const { auth } = request; // The session is now attached to the request object
  
  // Check for auth_token cookie directly for "nermal" users
  const cookies = request.cookies;
  const hasAuthTokenCookie = cookies.has('auth_token');
  
  // Consider user logged in if they have a NextAuth session OR an auth_token cookie
  const isLoggedIn = !!auth || hasAuthTokenCookie;
  const isPublicPath = ['/login', '/signup', '/control-panel'].includes(pathname);
  const isAdminPath = pathname.startsWith('/admin');
  
  // For debugging
  console.log(`Path: ${pathname}, isLoggedIn: ${isLoggedIn}, hasAuthTokenCookie: ${hasAuthTokenCookie}`);

  // Case 1: An authenticated user tries to access a public page (e.g., /login)
  if (isPublicPath && isLoggedIn) {
    // If user has NextAuth session and is admin, redirect to admin
    // Otherwise redirect to dashboard
    const redirectUrl = (auth && auth.isAdmin) ? '/admin' : '/';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // Case 2: An unauthenticated user tries to access a protected page
  if (!isPublicPath && !isLoggedIn) {
    const loginUrl = new URL('/login', request.url);
    if (isAdminPath) {
      loginUrl.searchParams.set('callbackUrl', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Case 3: A user tries to access an admin page but is not an admin
  // Only check this for users with NextAuth session, as "nermal" users won't have isAdmin flag
  if (isAdminPath && auth && !auth.isAdmin && !hasAuthTokenCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    loginUrl.searchParams.set('error', 'unauthorized');
    return NextResponse.redirect(loginUrl);
  }

  // If none of the above, the user is authorized for the page.
  return NextResponse.next();
});

// The matcher ensures the middleware runs on all paths except for NextAuth API routes and static assets.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon|icons|images|svgs|fonts|bg|.*\\.(?:svg|png|jpg|jpeg|webp|ico|woff|woff2|ttf|eot)|api/).*)',
  ],
};


