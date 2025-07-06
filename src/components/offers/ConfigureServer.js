"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";

import ServerConfigurationStep from './ConfigureServer/ServerConfigurationStep';
import RegistrationForm from './ConfigureServer/RegistrationForm';
import PaymentStep from './ConfigureServer/PaymentStep';

import { currencies, osOptions } from '@/data/serverConfig';
import { getComponentPrice } from '@/utils/componentHelpers';
import { validateFormData, validatePaymentForm, createInputHandler } from '@/utils/formHelpers';
import { getSelectedComponentDetails, createComponentSelectHandler } from '@/utils/componentUtils';
import { useComponentsAdvanced } from '@/hooks/useComponents';
import { useAuth } from '@/components/providers/AuthProvider';
import { isImpersonating, getImpersonatedUser, getUser } from '@/services/AuthService';
import {
  findMatchingConfiguration,
  mapOSToImageId,
  validateConfiguration,
  provisionServerWithRetry,
  monitorProvisioningStatus,
  handleDataPacketError
} from '@/utils/datapacketHelpers';

export default function ConfigureServer({ step, setStep, isLoggedIn = false, isCompact }) {
  const [currency, setCurrency] = useState(currencies[0]);
  const [os, setOs] = useState(osOptions[0].id);

  const {
    components,
    loading,
    error,
    isUsingFallback,
    refresh,
  } = useComponentsAdvanced({
    region: undefined,
  });

  // Form data for step 2
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    streetAddress: '',
    city: '',
    zipCode: '',
    country: '',
    password: ''
  });

  // Payment data for step 3
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expirationDate: '',
    cvc: ''
  });

  const [bankData, setBankData] = useState({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    swiftCode: ''
  });

  const [paypalData, setPaypalData] = useState({
    email: '',
    password: ''
  });
  const [showPaypalPassword, setShowPaypalPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected component IDs
  const [selectedComponents, setSelectedComponents] = useState({
    cpu: null,
    memory: null,
    storage: null,
    location: null
  });

  // Pricing calculation using the helper
  const pricing = useMemo(() => {
    let total = 0;
    
    Object.entries(selectedComponents).forEach(([type, componentId]) => {
      if (componentId && components[type]) {
        const component = components[type].find(c => c.id === componentId);
        if (component) {
          total += getComponentPrice(component);
        }
      }
    });
    
    return { total };
  }, [selectedComponents, components]);

  // Derived values
  const handleComponentSelect = createComponentSelectHandler(setSelectedComponents, components);
  const selectedDetails = getSelectedComponentDetails(selectedComponents, components);
  const hasFullConfiguration = Object.keys(selectedDetails).length === 4;

  // All your existing functions (getUserDataForPayment, handleContinueToNext, etc.)
  const getUserDataForPayment = () => {
    if (!isLoggedIn) return formData;

    try {
      let currentUser = null;
      
      if (isImpersonating()) {
        currentUser = getImpersonatedUser();
      } else {
        currentUser = getUser();
      }

      if (currentUser) {
        return {
          firstName: currentUser.firstName || currentUser.name?.split(' ')[0] || '',
          lastName: currentUser.lastName || currentUser.name?.split(' ').slice(1).join(' ') || '',
          email: currentUser.email || '',
          companyName: currentUser.company || '',
          streetAddress: currentUser.address || '',
          city: currentUser.city || '',
          zipCode: currentUser.zipCode || '',
          country: currentUser.country || '',
          password: ''
        };
      }
    } catch (error) {
      console.error('Error getting user data:', error);
    }

    return formData;
  };

  const handleContinueToNext = () => {
    if (isLoggedIn) {
      const userData = getUserDataForPayment();
      setFormData(userData);
      setStep(3);
    } else {
      setStep(2);
    }
  };

  // Keep all your existing modal functions (showSuccessModal, showPartialSuccessModal, showErrorModal)
  const showSuccessModal = (server) => {
    const modal = document.createElement('div');
    modal.innerHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-lg mx-4">
        <div class="text-center">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2 text-gray-900">Server Ready! 🎉</h3>
          <p class="text-gray-600 mb-4">Your server has been successfully provisioned and is ready to use.</p>
          
          <div class="bg-gray-50 rounded-lg p-4 mb-4 text-left">
            <h4 class="font-semibold mb-2">Server Details:</h4>
            <div class="space-y-1 text-sm">
              <div><span class="font-medium">Name:</span> ${server.name}</div>
              <div><span class="font-medium">Location:</span> ${server.location?.name || 'N/A'}</div>
              ${server.network?.ipAddresses?.[0] ? `<div><span class="font-medium">IP Address:</span> ${server.network.ipAddresses[0].ip}</div>` : ''}
              ${server.network?.ipmi?.ip ? `<div><span class="font-medium">IPMI:</span> ${server.network.ipmi.ip}</div>` : ''}
            </div>
          </div>
          
          <div class="flex gap-3">
            <button onclick="this.closest('.fixed').remove()" 
                    class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
              Close
            </button>
            <button onclick="window.location.href='/dashboard'" 
                    class="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
    document.body.appendChild(modal);
  };

  const showPartialSuccessModal = (server) => {
    const modal = document.createElement('div');
    modal.innerHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-lg mx-4">
        <div class="text-center">
          <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2 text-gray-900">Server Provisioning Started</h3>
          <p class="text-gray-600 mb-4">Your server provisioning has been initiated. It may take a few minutes to complete.</p>
          
          <div class="bg-gray-50 rounded-lg p-4 mb-4 text-left">
            <h4 class="font-semibold mb-2">Server Details:</h4>
            <div class="space-y-1 text-sm">
              <div><span class="font-medium">Name:</span> ${server.name}</div>
              <div><span class="font-medium">Status:</span> ${server.statusV2}</div>
            </div>
          </div>
          
          <p class="text-sm text-gray-500 mb-4">
            You'll receive an email notification once your server is ready. You can also check the status in your dashboard.
          </p>
          
          <div class="flex gap-3">
            <button onclick="this.closest('.fixed').remove()" 
                    class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
              Close
            </button>
            <button onclick="window.location.href='/dashboard'" 
                    class="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
    document.body.appendChild(modal);
  };

  const showErrorModal = (error) => {
    const modal = document.createElement('div');
    modal.innerHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-lg mx-4">
        <div class="text-center">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2 text-gray-900">Order Failed</h3>
          <p class="text-gray-600 mb-4">${error.message}</p>
          
          ${error.code === 'AUTH_ERROR' ? `
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p class="text-sm text-yellow-800">Please check your API configuration or contact support.</p>
            </div>
          ` : ''}
          
          ${error.code === 'RATE_LIMIT_ERROR' ? `
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p class="text-sm text-blue-800">Please wait a moment before trying again.</p>
            </div>
          ` : ''}
          
          <div class="flex gap-3">
            <button onclick="this.closest('.fixed').remove()" 
                    class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
              Close
            </button>
            <button onclick="this.closest('.fixed').remove(); window.location.reload()" 
                    class="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
    document.body.appendChild(modal);
  };

  // Keep all your form handling functions
  const handleFormSubmit = (submittedFormData) => {
    setFormData(submittedFormData);
    setStep(3);
  };

  const handleInputChange = createInputHandler(setFormData);
  const handleBankInputChange = createInputHandler(setBankData);
  const handlePaypalInputChange = createInputHandler(setPaypalData);
  const isFormValid = () => validateFormData(formData);
  const isPaymentFormValid = () => validatePaymentForm(cardData, agreedToTerms);

  const handlePaymentInputChange = (field, value) => {
    setCardData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    handlePaymentInputChange('cardNumber', formatted);
  };

  const handleExpirationChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    handlePaymentInputChange('expirationDate', value);
  };

  const handlePaypalConnect = () => {
    // PayPal connection logic
  };

  // Keep your existing handleConfirmOrder function (it's quite long, so I'll abbreviate)
  const handleConfirmOrder = async () => {
    if (!isPaymentFormValid()) return;

    setIsSubmitting(true);

    try {
      const validation = validateConfiguration(selectedComponents);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      console.log('Finding matching DataPacket configuration...');
      const configurationId = await findMatchingConfiguration(selectedComponents, components);

      if (!configurationId) {
        throw new Error('No matching server configuration found. Please try different specifications.');
      }

      const osImageId = mapOSToImageId(os, components.operatingSystems);
      if (!osImageId) {
        throw new Error('Selected operating system is not available.');
      }

      const provisioningData = {
        configurationId,
        billingPeriod: selectedCurrency === 'USD' ? 'MONTHLY' : 'MONTHLY',
        osImageId,
        sshKeyNames: [],
        customerInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          company: formData.companyName
        },
        paymentInfo: {
          method: selectedPaymentMethod,
          currency: selectedCurrency,
          cardData: selectedPaymentMethod === 'card' ? cardData : undefined,
          bankData: selectedPaymentMethod === 'bank' ? bankData : undefined,
          paypalData: selectedPaymentMethod === 'paypal' ? paypalData : undefined
        }
      };

      console.log('Provisioning server with configuration:', configurationId);

      const server = await provisionServerWithRetry(provisioningData, 3);

      console.log('Server provisioning initiated:', server);

      if (server.name && server.statusV2 !== 'ACTIVE') {
        console.log('Monitoring server provisioning status...');

        const statusElement = document.createElement('div');
        statusElement.innerHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg p-6 max-w-md mx-4">
            <div class="text-center">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 class="text-lg font-semibold mb-2">Setting up your server...</h3>
              <p class="text-gray-600 mb-4" id="status-text">Initializing server provisioning</p>
              <div class="text-sm text-gray-500">Server: ${server.name}</div>
            </div>
          </div>
        </div>
      `;
        document.body.appendChild(statusElement);

        try {
          const finalServer = await monitorProvisioningStatus(
            server.name,
            (status, updatedServer) => {
              const statusText = document.getElementById('status-text');
              if (statusText) {
                const statusMessages = {
                  'WAITING': 'Waiting for payment confirmation...',
                  'PROVISIONING': 'Installing operating system and configuring hardware...',
                  'ACTIVE': 'Server is ready!',
                  'MAINTENANCE': 'Performing final configuration...'
                };
                statusText.textContent = statusMessages[status] || `Status: ${status}`;
              }
            }
          );

          document.body.removeChild(statusElement);
          console.log('Server provisioned successfully:', finalServer);
          showSuccessModal(finalServer);

        } catch (monitoringError) {
          if (statusElement.parentNode) {
            document.body.removeChild(statusElement);
          }

          console.warn('Monitoring failed, but server may still be provisioning:', monitoringError);
          showPartialSuccessModal(server);
        }
      } else {
        showSuccessModal(server);
      }

    } catch (error) {
      console.error('Order confirmation error:', error);
      const dataPacketError = handleDataPacketError(error, 'order confirmation');
      showErrorModal(dataPacketError);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading and error states
  if (loading) {
    return (
      <motion.div
        className="py-12 flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-gray-600">Loading configurations...</div>
      </motion.div>
    );
  }

  if (error && !components.cpu?.length) {
    return (
      <motion.div
        className="py-12 flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-red-600 mb-4">Error loading components: {error}</div>
        <button
          onClick={() => refresh(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </motion.div>
    );
  }

  // Render steps
  if (step === 1) {
    return (
      <ServerConfigurationStep
        // Component data
        components={components}
        loading={loading}
        error={error}
        isUsingFallback={isUsingFallback}
        onRefresh={() => refresh(true)}
        
        // Selections
        selectedComponents={selectedComponents}
        onComponentSelect={handleComponentSelect}
        selectedDetails={selectedDetails}
        hasFullConfiguration={hasFullConfiguration}
        
        // Pricing
        currency={currency}
        setCurrency={setCurrency}
        pricing={pricing}
        
        // OS Selection
        os={os}
        setOs={setOs}
        
        // UI State
        isLoggedIn={isLoggedIn}
        isCompact={true}
        
        // Callbacks
        onContinue={handleContinueToNext}
      />
    );
  }

  if (step === 2) {
    return (
      <RegistrationForm
        setStep={setStep}
        onFormSubmit={handleFormSubmit}
        initialData={formData}
      />
    );
  }

  if (step === 3) {
    return (
      <PaymentStep
        formData={getUserDataForPayment()}
        currency={currency}
        setCurrency={setCurrency}
        selectedPaymentMethod={selectedPaymentMethod}
        setSelectedPaymentMethod={setSelectedPaymentMethod}
        cardData={cardData}
        handleCardNumberChange={handleCardNumberChange}
        handleExpirationChange={handleExpirationChange}
        handlePaymentInputChange={handlePaymentInputChange}
        bankData={bankData}
        handleBankInputChange={handleBankInputChange}
        paypalData={paypalData}
        handlePaypalInputChange={handlePaypalInputChange}
        showPaypalPassword={showPaypalPassword}
        setShowPaypalPassword={setShowPaypalPassword}
        handlePaypalConnect={handlePaypalConnect}
        agreedToTerms={agreedToTerms}
        setAgreedToTerms={setAgreedToTerms}
        isPaymentFormValid={isPaymentFormValid}
        isSubmitting={isSubmitting}
        handleConfirmOrder={handleConfirmOrder}
        isCompact={isCompact}
      />
    );
  }

  return null;
}