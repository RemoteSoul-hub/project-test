import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function PaymentStep({ 
  configuration, 
  onBack, 
  onComplete,
  isLoggedIn
}) {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState('stripe');

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
  };

  const handleSubmit = () => {
    // Process payment and submit order
    onComplete();
    
    // Redirect to success page or dashboard
    router.push('/');
  };

  // Calculate total price from configuration
  const totalPrice = configuration ? (
    (configuration.cpu?.price || 0) + 
    (configuration.memory?.price || 0) + 
    (configuration.storage?.price || 0)
  ) : 0;

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Payment Details</h2>
      
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
                ${totalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Payment Methods */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
        <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
        
        <div className="space-y-4">
          {/* Stripe */}
          <div 
            className={`p-4 border rounded-lg cursor-pointer ${
              paymentMethod === 'stripe' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
            onClick={() => handlePaymentMethodChange('stripe')}
          >
            <div className="flex items-center">
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                paymentMethod === 'stripe' ? 'border-blue-500' : 'border-gray-300'
              }`}>
                {paymentMethod === 'stripe' && (
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                )}
              </div>
              <span className="ml-2 font-medium">Credit Card (Stripe)</span>
              <div className="ml-auto flex space-x-2">
                <img src="/visa.svg" alt="Visa" className="h-6" />
                <img src="/mastercard.svg" alt="Mastercard" className="h-6" />
                <img src="/amex.svg" alt="American Express" className="h-6" />
              </div>
            </div>
          </div>
          
          {/* PayPal */}
          <div 
            className={`p-4 border rounded-lg cursor-pointer ${
              paymentMethod === 'paypal' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
            onClick={() => handlePaymentMethodChange('paypal')}
          >
            <div className="flex items-center">
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                paymentMethod === 'paypal' ? 'border-blue-500' : 'border-gray-300'
              }`}>
                {paymentMethod === 'paypal' && (
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                )}
              </div>
              <span className="ml-2 font-medium">PayPal</span>
              <img src="/paypal.svg" alt="PayPal" className="h-6 ml-auto" />
            </div>
          </div>
          
          {/* Bank Transfer */}
          <div 
            className={`p-4 border rounded-lg cursor-pointer ${
              paymentMethod === 'bank' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
            onClick={() => handlePaymentMethodChange('bank')}
          >
            <div className="flex items-center">
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                paymentMethod === 'bank' ? 'border-blue-500' : 'border-gray-300'
              }`}>
                {paymentMethod === 'bank' && (
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                )}
              </div>
              <span className="ml-2 font-medium">Bank Transfer</span>
            </div>
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
        >
          Complete Order
        </button>
      </div>
    </div>
  );
}