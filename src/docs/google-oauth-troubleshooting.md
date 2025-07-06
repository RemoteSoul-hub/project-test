# Google OAuth Troubleshooting Guide

This guide helps troubleshoot issues with Google OAuth authentication in the ThinkHuge Broker Panel.

## Common Issues and Solutions

### 1. Redirect to `/api/auth/error`

If you're being redirected to `/api/auth/error` when trying to authenticate with Google, this typically indicates an issue with the OAuth configuration.

#### Possible Causes:

1. **Incorrect Redirect URI Configuration**
   - The redirect URI in Google Cloud Console must exactly match what NextAuth expects
   - Required redirect URI: `http://localhost:3000/api/auth/callback/google` (for local development)

2. **Invalid Client Credentials**
   - The Client ID or Client Secret might be incorrect or expired
   - Check that the credentials in `.env.local` match those in Google Cloud Console

3. **Missing or Misconfigured Authorized JavaScript Origins**
   - Make sure `http://localhost:3000` (for local development) is added to Authorized JavaScript origins

4. **Google API Restrictions**
   - Ensure the Google OAuth API is enabled for your project
   - Check if there are any API restrictions that might be blocking the authentication

### 2. Verifying Your Configuration

Run the verification script to check your OAuth configuration:

```bash
npm install dotenv  # If not already installed
node src/scripts/verify-oauth.js
```

This script will:
- Check if all required environment variables are set
- Provide information about the required redirect URIs
- List common issues and solutions

### 3. Fixing Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Credentials"
3. Find your OAuth 2.0 Client ID
4. Edit the configuration and ensure:
   - **Authorized JavaScript origins** includes:
     - `http://localhost:3000` (for local development)
   - **Authorized redirect URIs** includes:
     - `http://localhost:3000/api/auth/callback/google` (for local development)
5. Save the changes

### 4. Environment Variables

Ensure your `.env.local` file has the correct configuration:

```
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

### 5. Debugging

If you're still experiencing issues:

1. Check the browser console for errors during authentication
2. Look at the server logs for more detailed error information
3. Enable debug mode in NextAuth configuration (already enabled in development)
4. Use the custom error page at `/auth-error` to get more information about the error

### 6. Common Error Codes

- **OAuthSignin**: Error starting the OAuth sign-in flow
- **OAuthCallback**: Error during the OAuth callback
- **OAuthCreateAccount**: Error creating the OAuth user account
- **OAuthAccountNotLinked**: Email already in use with different provider
- **Callback**: Error during the callback handling

## Need More Help?

If you continue to experience issues after trying these solutions, please contact the development team with:

1. The specific error message you're seeing
2. Screenshots of your Google Cloud Console configuration
3. The output of the verification script
