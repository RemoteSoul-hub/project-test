// This script helps verify the Google OAuth configuration
// Run with: node src/scripts/verify-oauth.js

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });



// Check if required environment variables are set
const requiredVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
} else {
  
}

// Verify Google OAuth configuration




// Check NextAuth configuration




// Provide information about required redirect URIs

if (process.env.NEXTAUTH_URL) {
  const baseUrl = process.env.NEXTAUTH_URL.trim();
  
  
  
  
  
  
  
  
  
} else {
  
}











