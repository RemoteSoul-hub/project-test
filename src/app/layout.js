import '../styles/globals.css';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import RootLayoutWrapper from '@/components/RootLayoutWrapper';
import { auth } from './auth';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Register and launch hosting solutions for your business', // Base title
  description: 'Partner with Think Huge to launch hosting and VPS solutions under your brand. Register today to access our global infra, and full API control.',
  icons: {
    icon: '/favicon.ico', // /public/favicon.ico
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png', // /public/apple-touch-icon.png
    other: {
      rel: 'apple-touch-icon',
      url: '/apple-touch-icon.png',
    },
  },
};

// Separate viewport export as per Next.js 13.4+ requirements
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

/**
 * Root Layout Component
 * 
 * This is the main layout wrapper for the entire application.
 * It includes global styles, fonts, and metadata.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 */
export default async function RootLayout({ children }) {
  // Get the session server-side
  const session = await auth();
  
  return (
    <html lang="en">
      <head>
        {/* Viewport meta tag is automatically added by Next.js based on the viewport export */}
        {/* <Script
          src="https://www.bugherd.com/sidebarv2.js?apikey=bnwemy3ywqpularhn0fega"
          strategy="afterInteractive"
        /> */}
      </head>
      <body className={`${inter.className} bg-primary-light dark:bg-primary-dark`}>
        <RootLayoutWrapper session={session}>{children}</RootLayoutWrapper>
      </body>
    </html>
  );
}
