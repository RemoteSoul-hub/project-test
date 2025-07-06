import { login as authLogin, setAuthToken, setUser } from './AuthService';

export async function handleLogin(username, password) {
  try {
    const response = await authLogin(username, password);
    
    if (response.status === 'success') {
      // Store auth data
      setAuthToken(response.data.token);
      setUser(response.data.user);
      
      // Store user data in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('userData', JSON.stringify(response.data.user));
      }
      return response.data;
    }
    
    throw response;
  } catch (error) {
    throw error;
  }
}
