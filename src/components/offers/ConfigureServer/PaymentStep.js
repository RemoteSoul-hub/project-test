import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, AlertCircle } from 'lucide-react';
import ApiService from '@/services/apiService';

export default function PaymentStep({ 
  configuration, 
  onBack, 
  onComplete,
  isLoggedIn
}) {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [totalPrice, setTotalPrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch the final price based on configuration
  useEffect(() => {
    const fetchPrice = async () => {
      if (!configuration) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await ApiService.post('/calculate-price', {
          cpu_id: configuration.cpu?.id,
          memory_id: configuration.memory?.id,
          storage_id: configuration.storage?.id,
          location_id: configuration.location?.id
        });
        
        if (response && response.data) {
          setTotalPrice(response.data.total);
        } else {
          throw new Error('Invalid price response');
        }
      } catch (err) {
        console.error('Error fetching price:', err);
        setError('Unable to calculate price. Please try again.');
        // Fallback price calculation from components
        if (configuration) {
          const cpuPrice = configuration.cpu?.price || 0;
          const memoryPrice = configuration.memory?.price || 0;
          const storagePrice = configuration.storage?.price || 0;
          setTotalPrice(cpuPrice + memoryPrice + storagePrice);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchPrice();
  }, [configuration]);

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
  };

  const handleSubmit = () => {
    // Process payment with Stripe and submit order
    onComplete();
    
    // Redirect to success page or dashboard
    router.push('/');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Payment Details</h2>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="text-red-500 mr-2" size={20} />
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {/* Order Summary */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
        <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
        
        <div className="space-y-4">
          {/* Configuration Details */}
          <div className="border-b pb-4">
            <h4 className="font-medium mb-2">Server Configuration</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">CPU:</span>
                <span className="ml-2">{configuration?.cpu?.name || 'Not selected'}</span>
              </div>
              <div>
                <span className="text-gray-600">Memory:</span>
                <span className="ml-2">{configuration?.memory?.name || 'Not selected'}</span>
              </div>
              <div>
                <span className="text-gray-600">Storage:</span>
                <span className="ml-2">{configuration?.storage?.name || 'Not selected'}</span>
              </div>
              <div>
                <span className="text-gray-600">Location:</span>
                <span className="ml-2">{configuration?.location?.name || 'Not selected'}</span>
              </div>
              <div>
                <span className="text-gray-600">OS:</span>
                <span className="ml-2">{configuration?.os?.name || 'Not selected'}</span>
              </div>
            </div>
          </div>
          
          {/* Price Summary */}
          <div className="border-b pb-4">
            <div className="flex justify-between py-2">
              <span>CPU:</span>
              <span>${configuration?.cpu?.price?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Memory:</span>
              <span>${configuration?.memory?.price?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Storage:</span>
              <span>${configuration?.storage?.price?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Total Monthly Price:</span>
              <span className="font-bold text-lg">
                {loading ? (
                  <span className="inline-block w-16 h-6 bg-gray-200 animate-pulse rounded"></span>
                ) : (
                  `$${totalPrice ? totalPrice.toFixed(2) : '0.00'}`
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Payment Methods */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
        <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
        {/* Stripe Payment Method */}
        <div className="p-4 border rounded-lg border-blue-500 bg-blue-50">
          <div className="flex items-center">
            <div className="w-5 h-5 rounded-full border border-blue-500 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            </div>
            <span className="ml-2 font-medium">Credit Card (Stripe)</span>
            <div className="ml-auto flex space-x-2">
              <img src="/visa.svg" alt="Visa" className="h-6" />
              <img src="/mastercard.svg" alt="Mastercard" className="h-6" />
              <img src="/amex.svg" alt="American Express" className="h-6" />
            </div>
          </div>
        </div>
        
        {/* Stripe Card Element will be added here */}
        <div className="mt-4 p-4 border rounded-lg">
          <div className="h-12 bg-gray-100 rounded-md flex items-center px-4">
            <span className="text-gray-500">Card details will appear here during checkout</span>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        
        <button
          onClick={handleSubmit}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          disabled={loading || !totalPrice}
        >
          {loading ? 'Processing...' : 'Complete Order'}
        </button>
      </div>
    </div>
  );
}