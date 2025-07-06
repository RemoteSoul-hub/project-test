@@ .. @@
 import { useState, useEffect, useCallback, useMemo } from 'react';
 import { useRouter } from 'next/navigation';
 import { CheckCircle, XCircle } from 'lucide-react';
+import { signup, setAuthToken, setUser } from '@/services/AuthService';
 
 // Validation utilities
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
     return password.length >= 8
       ? { isValid: true, message: 'Password accepted' }
       : { isValid: false, message: 'Password must be at least 8 characters' };
   },
+  
+  confirmPassword: (confirmPassword, password) => {
+    if (!confirmPassword) {
+      return { isValid: false, message: 'Please confirm your password' };
+    }
+    return confirmPassword === password
+      ? { isValid: true, message: 'Passwords match' }
+      : { isValid: false, message: 'Passwords do not match' };
+  },

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
 
 // ValidatedInput component
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
     <div className="space-y-2">
       <label className="block text-sm font-medium text-gray-700 mb-1">
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
           className={`w-full px-4 py-3 border rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
             hasError 
               ? 'border-red-300 focus:ring-red-500' 
               : hasSuccess
               ? 'border-green-300 focus:ring-green-500'
               : 'border-gray-300 focus:ring-blue-500 hover:border-gray-400'
           }`}
         />
         
         {validation.isValid !== null && (
           <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
             {hasError ? (
               <XCircle className="w-5 h-5 text-red-500" />
             ) : (
               <CheckCircle className="w-5 h-5 text-green-500" />
             )}
           </div>
         )}
       </div>
       
       {validation.message && (
         <p className={`text-xs transition-colors ${
           hasError ? 'text-red-500' : hasSuccess ? 'text-green-500' : 'text-gray-500'
         }`}>
           {validation.message}
         </p>
       )}
     </div>
   );
 };
 
 export default function RegistrationForm({ onComplete, configuration }) {
   const router = useRouter();
   
   const [formData, setFormData] = useState({
     username: '',
     email: '',
     password: '',
+    confirmPassword: '',
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
+  const [registrationSuccess, setRegistrationSuccess] = useState(false);
   
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
+        case 'confirmPassword':
+          results[field] = validators.confirmPassword(value, formData.password);
+          break;
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
-    const requiredFields = ['firstName', 'lastName', 'email', 'streetAddress', 'city', 'zipCode', 'country', 'password'];
+    const requiredFields = ['firstName', 'lastName', 'email', 'streetAddress', 'city', 'zipCode', 'country', 'password', 'confirmPassword'];
     return requiredFields.every(field => {
       const validation = validationResults[field];
       return validation.isValid === true || 
              (validation.isValid === null && validators.required(formData[field], field).isValid);
     });
   }, [validationResults, formData]);
 
   const handleInputChange = useCallback((field, value) => {
     setFormData(prev => ({ ...prev, [field]: value }));
     if (error) {
       setError('');
     }
+    
+    // Special handling for password field to validate confirmPassword
+    if (field === 'password' && touchedFields.confirmPassword) {
+      setTouchedFields(prev => ({ ...prev, confirmPassword: true }));
+    }
   }, [error, touchedFields.confirmPassword]);
 
   const handleBlur = useCallback((field) => {
     setTouchedFields(prev => ({ ...prev, [field]: true }));
   }, []);
 
   const handleSubmit = async (e) => {
     e.preventDefault();
     
     // Touch all fields to trigger validation
     const allFields = Object.keys(formData);
     setTouchedFields(allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {}));
     
     if (!isFormValid) {
       return;
     }
     
     setLoading(true);
     setError('');
     
     try {
-      // Simulate API call
-      await new Promise(resolve => setTimeout(resolve, 1500));
-      
-      // Normally you would register the user here
-      // const response = await registerUser(formData);
-      
-      // For now, we'll just simulate success
-      onComplete();
+      // Register the user
+      const fullName = `${formData.firstName} ${formData.lastName}`;
+      const response = await signup(fullName, formData.email, formData.password);
+      
+      if (response.status === 'success') {
+        // Set auth token and user data
+        if (response.data?.token) {
+          setAuthToken(response.data.token);
+        }
+        if (response.data?.user) {
+          setUser(response.data.user);
+        }
+        
+        // Show success message
+        setRegistrationSuccess(true);
+        
+        // Complete registration after showing success message
+        setTimeout(() => {
+          onComplete();
+        }, 2000);
+      } else {
+        throw new Error(response.message || 'Registration failed');
+      }
     } catch (err) {
       console.error('Registration error:', err);
       setError(err.message || 'Failed to register. Please try again.');
     } finally {
       setLoading(false);
     }
   };
 
   return (
     <div className="max-w-3xl mx-auto">
       <h2 className="text-2xl font-bold mb-6">Create Your Account</h2>
       
+      {registrationSuccess && (
+        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
+          <CheckCircle className="text-green-500 mr-2" size={20} />
+          <div>
+            <p className="text-green-700 font-medium">Registration successful!</p>
+            <p className="text-green-600 text-sm">Your account has been created. Redirecting to payment...</p>
+          </div>
+        </div>
+      )}
+      
       {error && (
         <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
           <XCircle className="text-red-500 mr-2" size={20} />
@@ .. @@
             validation={validationResults.password}
             disabled={loading}
           />
+          
+          <ValidatedInput
+            field="confirmPassword"
+            type="password"
+            label="Confirm Password"
+            placeholder="Confirm your password"
+            value={formData.confirmPassword}
+            onChange={handleInputChange}
+            onBlur={handleBlur}
+            validation={validationResults.confirmPassword}
+            disabled={loading}
+          />
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
@@ .. @@
           <button
             type="submit"
             disabled={!isFormValid || loading}
-            className={`w-full py-4 px-4 rounded-lg font-medium transition-all duration-200 ${
+            className={`w-full py-4 px-4 rounded-lg font-medium transition-all duration-200 flex justify-center items-center ${
               isFormValid && !loading
                 ? "bg-blue-600 hover:bg-blue-700 text-white" 
                 : "bg-gray-300 text-gray-500 cursor-not-allowed"
             }`}
           >
-            {loading ? 'Creating Account...' : 'Create Account & Continue'}
+            {loading ? (
+              <>
+                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
+                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
+                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
+                </svg>
+                Creating Account...
+              </>
+            ) : (
+              'Create Account & Continue'
+            )}
           </button>
         </div>
         
@@ .. @@
           <p className="text-sm text-gray-500 mb-2">Already have an account?</p>
           <button
             type="button"
-            onClick={() => router.push('/login')}
+            onClick={() => router.push('/login?callbackUrl=/control-panel')}
             className="text-blue-600 hover:text-blue-800 font-medium"
           >
             Sign in instead
           </button>
         </div>
       </form>
     </div>
   );
 }