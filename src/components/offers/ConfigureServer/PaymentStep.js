@@ .. @@
 import { useState, useEffect } from 'react';
 import { useRouter } from 'next/navigation';
 import { CheckCircle, AlertCircle } from 'lucide-react';
+import ApiService from '@/services/apiService';
 
 export default function PaymentStep({ 
   configuration, 
   onBack, 
   onComplete,
   isLoggedIn
 }) {
   const router = useRouter();
   const [paymentMethod, setPaymentMethod] = useState('stripe');
+  const [totalPrice, setTotalPrice] = useState(null);
+  const [loading, setLoading] = useState(true);
+  const [error, setError] = useState(null);
+  
+  // Fetch the final price based on configuration
+  useEffect(() => {
+    const fetchPrice = async () => {
+      if (!configuration) return;
+      
+      try {
+        setLoading(true);
+        setError(null);
+        
+        const response = await ApiService.post('/calculate-price', {
+          cpu_id: configuration.cpu?.id,
+          memory_id: configuration.memory?.id,
+          storage_id: configuration.storage?.id,
+          location_id: configuration.location?.id
+        });
+        
+        if (response && response.data) {
+          setTotalPrice(response.data.total);
+        } else {
+          throw new Error('Invalid price response');
+        }
+      } catch (err) {
+        console.error('Error fetching price:', err);
+        setError('Unable to calculate price. Please try again.');
+        // Fallback price calculation from components
+        if (configuration) {
+          const cpuPrice = configuration.cpu?.price || 0;
+          const memoryPrice = configuration.memory?.price || 0;
+          const storagePrice = configuration.storage?.price || 0;
+          setTotalPrice(cpuPrice + memoryPrice + storagePrice);
+        }
+      } finally {
+        setLoading(false);
+      }
+    };
+    
+    fetchPrice();
+  }, [configuration]);
 
   const handlePaymentMethodChange = (method) => {
     setPaymentMethod(method);
   };
 
   const handleSubmit = () => {
-    // Process payment and submit order
+    // Process payment with Stripe and submit order
     onComplete();
     
     // Redirect to success page or dashboard
     router.push('/');
   };
 
-  // Calculate total price from configuration
-  const totalPrice = configuration ? (
-    (configuration.cpu?.price || 0) + 
-    (configuration.memory?.price || 0) + 
-    (configuration.storage?.price || 0)
-  ) : 0;
-
   return (
     <div className="max-w-3xl mx-auto">
       <h2 className="text-2xl font-bold mb-6">Payment Details</h2>
       
+      {error && (
+        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
+          <AlertCircle className="text-red-500 mr-2" size={20} />
+          <p className="text-red-700">{error}</p>
+        </div>
+      )}
+      
       {/* Order Summary */}
       <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
         <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
@@ .. @@
             <div className="flex justify-between py-2">
               <span>Total Monthly Price:</span>
               <span className="font-bold text-lg">
-                ${totalPrice.toFixed(2)}
+                {loading ? (
+                  <span className="inline-block w-16 h-6 bg-gray-200 animate-pulse rounded"></span>
+                ) : (
+                  `$${totalPrice ? totalPrice.toFixed(2) : '0.00'}`
+                )}
               </span>
             </div>
           </div>
@@ .. @@
       {/* Payment Methods */}
       <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
         <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
-        
-        <div className="space-y-4">
-          {/* Stripe */}
-          <div 
-            className={`p-4 border rounded-lg cursor-pointer ${
-              paymentMethod === 'stripe' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
-            }`}
-            onClick={() => handlePaymentMethodChange('stripe')}
-          >
-            <div className="flex items-center">
-              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
-                paymentMethod === 'stripe' ? 'border-blue-500' : 'border-gray-300'
-              }`}>
-                {paymentMethod === 'stripe' && (
-                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
-                )}
-              </div>
-              <span className="ml-2 font-medium">Credit Card (Stripe)</span>
-              <div className="ml-auto flex space-x-2">
-                <img src="/visa.svg" alt="Visa" className="h-6" />
-                <img src="/mastercard.svg" alt="Mastercard" className="h-6" />
-                <img src="/amex.svg" alt="American Express" className="h-6" />
-              </div>
-            </div>
-          </div>
-          
-          {/* PayPal */}
-          <div 
-            className={`p-4 border rounded-lg cursor-pointer ${
-              paymentMethod === 'paypal' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
-            }`}
-            onClick={() => handlePaymentMethodChange('paypal')}
-          >
-            <div className="flex items-center">
-              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
-                paymentMethod === 'paypal' ? 'border-blue-500' : 'border-gray-300'
-              }`}>
-                {paymentMethod === 'paypal' && (
-                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
-                )}
-              </div>
-              <span className="ml-2 font-medium">PayPal</span>
-              <img src="/paypal.svg" alt="PayPal" className="h-6 ml-auto" />
-            </div>
-          </div>
-          
-          {/* Bank Transfer */}
-          <div 
-            className={`p-4 border rounded-lg cursor-pointer ${
-              paymentMethod === 'bank' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
-            }`}
-            onClick={() => handlePaymentMethodChange('bank')}
-          >
-            <div className="flex items-center">
-              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
-                paymentMethod === 'bank' ? 'border-blue-500' : 'border-gray-300'
-              }`}>
-                {paymentMethod === 'bank' && (
-                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
-                )}
-              </div>
-              <span className="ml-2 font-medium">Bank Transfer</span>
-            </div>
-          </div>
+        {/* Stripe Payment Method */}
+        <div className="p-4 border rounded-lg border-blue-500 bg-blue-50">
+          <div className="flex items-center">
+            <div className="w-5 h-5 rounded-full border border-blue-500 flex items-center justify-center">
+              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
+            </div>
+            <span className="ml-2 font-medium">Credit Card (Stripe)</span>
+            <div className="ml-auto flex space-x-2">
+              <img src="/visa.svg" alt="Visa" className="h-6" />
+              <img src="/mastercard.svg" alt="Mastercard" className="h-6" />
+              <img src="/amex.svg" alt="American Express" className="h-6" />
+            </div>
+          </div>
         </div>
+        
+        {/* Stripe Card Element will be added here */}
+        <div className="mt-4 p-4 border rounded-lg">
+          <div className="h-12 bg-gray-100 rounded-md flex items-center px-4">
+            <span className="text-gray-500">Card details will appear here during checkout</span>
+          </div>
+        </div>
       </div>
       
       {/* Action Buttons */}
@@ .. @@
         <button
           onClick={handleSubmit}
           className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
+          disabled={loading || !totalPrice}
         >
-          Complete Order
+          {loading ? 'Processing...' : 'Complete Order'}
         </button>
       </div>
     </div>
   );
 }