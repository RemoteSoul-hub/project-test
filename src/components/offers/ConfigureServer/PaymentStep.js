"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonHover, buttonTap } from '@/animations/variants';
import { currencies } from '@/data/serverConfig';
import Image from 'next/image';

export default function PaymentStep({
  formData,
  currency,
  setCurrency,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  cardData,
  handleCardNumberChange,
  handleExpirationChange,
  handlePaymentInputChange,
  bankData,
  handleBankInputChange,
  paypalData,
  handlePaypalInputChange,
  showPaypalPassword,
  setShowPaypalPassword,
  handlePaypalConnect,
  agreedToTerms,
  setAgreedToTerms,
  isPaymentFormValid,
  isSubmitting,
  handleConfirmOrder,
  isCompact = false,
  isLoggedIn
}) {
  const shouldUseCompact = isCompact || isLoggedIn;
  const billingData = {
    name: formData.firstName && formData.lastName 
      ? `${formData.firstName} ${formData.lastName}` 
      : 'Error fetching full name',
    address: formData.streetAddress || 'Error fetching street address',
    country: formData.country || 'Error fetching location'
  };

return (
    <section className={`mx-auto ${
      shouldUseCompact ? 'max-w-lg px-4 py-8' : 'max-w-xl px-6 py-12'
    }`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className=""
      >
        {/* Header */}
        <div className={shouldUseCompact ? 'mb-6' : 'mb-8'}>
          <h1 className={`font-haas font-medium text-gradient ${
            shouldUseCompact ? 'text-3xl mb-1' : 'text-4xl mb-2'
          }`}>Payment</h1>
        </div>

        {/* Billing Details */}
        <motion.div
          className={shouldUseCompact ? 'mb-6' : 'mb-8'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className={`font-semibold text-gray-700 dark:text-gray-300 ${
            shouldUseCompact ? 'text-base mb-3' : 'text-lg mb-4'
          }`}>Billing Details</h2>
          <div className={`text-gray-600 dark:text-gray-400 ${
            shouldUseCompact ? 'space-y-0.5' : 'space-y-1'
          }`}>
            <p className={`font-medium text-gray-900 dark:text-gray-100 ${
              shouldUseCompact ? 'text-sm' : ''
            }`}>{billingData.name}</p>
            <p className={shouldUseCompact ? 'text-sm' : ''}>{billingData.address}</p>
            <p className={shouldUseCompact ? 'text-sm' : ''}>{billingData.country}</p>
          </div>
        </motion.div>

        <hr className={`border-gray-300 dark:border-gray-600 ${
          shouldUseCompact ? 'mb-6' : 'mb-8'
        }`} />

        {/* Payment Details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className={`font-semibold text-gray-700 dark:text-gray-300 ${
            shouldUseCompact ? 'text-base mb-4' : 'text-lg mb-6'
          }`}>Payment Details</h2>

          {/* Currency Selection */}
          <div className={`flex flex-row justify-between items-baseline ${
            shouldUseCompact ? 'mb-4' : 'mb-6'
          }`}>
            <label className={`block font-normal text-gray-700 dark:text-gray-300 ${
              shouldUseCompact ? 'text-sm mb-2' : 'text-base mb-3'
            }`}>
              Payment Currency
            </label>
            <div className={`inline-flex border border-gray-300 dark:border-gray-100 rounded overflow-hidden ${
              shouldUseCompact ? 'mb-3' : 'mb-4'
            }`}>
              {currencies.map((cur, i) => (
                <motion.button
                  key={cur.id}
                  onClick={() => setCurrency(cur)}
                  className={`font-semibold transition-colors ${
                    shouldUseCompact ? 'px-4 py-2 text-xs' : 'px-6 py-3 text-sm'
                  } ${currency.id === cur.id
                    ? "text-blue-600 bg-white dark:bg-transparent shadow-[inset_0_0_0_2px_#3b82f6]"
                    : "text-black dark:text-text-dark bg-gray-50 dark:bg-transparent"
                    } ${i !== 0 ? "border-l border-gray-300 dark:border-gray-100" : ""}`}
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                >
                  {cur.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className={`space-y-3 ${shouldUseCompact ? 'mb-4' : 'mb-6'}`}>
            {/* Card Payment */}
            <motion.div
              className={`border rounded-lg transition-all ${
                shouldUseCompact ? 'p-4' : 'p-6'
              } ${selectedPaymentMethod === 'card'
                  ? 'border-gray-450 bg-gray-100 dark:bg-blue-900/10'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800/50'
                }`}
              whileHover={{ scale: 1.01 }}
            >
              <div className={`flex items-center justify-between ${
                shouldUseCompact ? 'mb-3' : 'mb-4'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="card"
                    name="paymentMethod"
                    checked={selectedPaymentMethod === 'card'}
                    onChange={() => setSelectedPaymentMethod('card')}
                    className={shouldUseCompact ? 'w-3.5 h-3.5 text-blue-600' : 'w-4 h-4 text-blue-600'}
                  />
                  <label htmlFor="card" className={`flex items-center gap-2 font-semibold text-blue-600 dark:text-gray-300 ${
                    shouldUseCompact ? 'text-sm' : ''
                  }`}>
                    <svg
                      className={`${shouldUseCompact ? 'w-4 h-4' : 'w-5 h-5'} ${
                        selectedPaymentMethod === 'card' ? 'text-blue-600' : 'text-gray-400'
                      }`}
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M20 4H4C2.89 4 2 4.89 2 6V18C2 19.11 2.89 20 4 20H20C21.11 20 22 19.11 22 18V6C22 4.89 21.11 4 20 4ZM20 18H4V12H20V18ZM4 8V6H20V8H4Z" />
                    </svg>
                    Card
                  </label>
                </div>

                <div className={`flex items-center gap-1 border-2 border-[#635BFF] dark:border-white rounded-sd ${
                  shouldUseCompact ? 'py-1 px-2' : 'py-2 px-4'
                }`}>
                  <span className={`font-medium text-[#635BFF] dark:text-white ${
                    shouldUseCompact ? 'text-xs' : 'text-sm'
                  }`}>Powered by</span>
                  <span className={`font-bold text-[#635BFF] dark:text-white ${
                    shouldUseCompact ? 'text-xs' : 'text-sm'
                  }`}>stripe</span>
                </div>
              </div>

              <AnimatePresence>
                {selectedPaymentMethod === 'card' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className={shouldUseCompact ? 'space-y-3' : 'space-y-4'}
                  >
                    {/* Card Number */}
                    <div>
                      <label className={`block font-medium text-gray-700 dark:text-gray-300 ${
                        shouldUseCompact ? 'mb-1.5 text-sm' : 'mb-2'
                      }`}>
                        Card number
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardData.cardNumber}
                          onChange={handleCardNumberChange}
                          placeholder="4231 4231 4231 4231"
                          maxLength="19"
                          className={`w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium pr-16 ${
                            shouldUseCompact ? 'px-2.5 py-2.5 text-sm' : 'px-3 py-3'
                          }`}
                        />
                        <div className={`absolute top-1/2 -translate-y-1/2 flex gap-1 ${
                          shouldUseCompact ? 'right-2.5' : 'right-3'
                        }`}>
                          <Image 
                            src={'/assets/images/card-types.png'} 
                            alt='Card types allowed' 
                            height={shouldUseCompact ? 14 : 16} 
                            width={shouldUseCompact ? 85 : 100} 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expiration and CVC */}
                    <div className={shouldUseCompact ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-2 gap-4'}>
                      <div>
                        <label className={`block font-medium text-gray-700 dark:text-gray-300 ${
                          shouldUseCompact ? 'mb-1.5 text-sm' : 'mb-2'
                        }`}>
                          Expiration date
                        </label>
                        <input
                          type="text"
                          value={cardData.expirationDate}
                          onChange={handleExpirationChange}
                          placeholder="MM/YY"
                          maxLength="5"
                          className={`w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium ${
                            shouldUseCompact ? 'px-2.5 py-2.5 text-sm' : 'px-3 py-3'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block font-medium text-gray-700 dark:text-gray-300 ${
                          shouldUseCompact ? 'mb-1.5 text-sm' : 'mb-2'
                        }`}>
                          CVC
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={cardData.cvc}
                            onChange={(e) => handlePaymentInputChange('cvc', e.target.value.replace(/\D/g, '').slice(0, 4))}
                            placeholder="CVC"
                            maxLength="4"
                            className={`w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium ${
                              shouldUseCompact ? 'px-2.5 py-2.5 pr-8 text-sm' : 'px-3 py-3 pr-10'
                            }`}
                          />
                          <Image 
                            src='/svgs/cvc.svg' 
                            alt='CVC Icon svg' 
                            width={shouldUseCompact ? 18 : 23} 
                            height={shouldUseCompact ? 13 : 17} 
                            className={`absolute top-1/2 -translate-y-1/2 ${
                              shouldUseCompact ? 'right-2.5' : 'right-3'
                            }`} 
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Bank Transfer */}
            <motion.div
              className={`border rounded-lg transition-all cursor-pointer ${
                shouldUseCompact ? 'p-3' : 'p-4'
              } ${selectedPaymentMethod === 'bank'
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800/50 hover:border-blue-300'
                }`}
              onClick={() => setSelectedPaymentMethod('bank')}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="bank"
                  name="paymentMethod"
                  checked={selectedPaymentMethod === 'bank'}
                  onChange={() => setSelectedPaymentMethod('bank')}
                  className={shouldUseCompact ? 'w-3.5 h-3.5 text-blue-600' : 'w-4 h-4 text-blue-600'}
                />
                <label htmlFor="bank" className={`flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300 ${
                  shouldUseCompact ? 'text-sm' : ''
                }`}>
                  <svg className={shouldUseCompact ? 'w-4 h-4' : 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Bank Transfer
                </label>
              </div>

              {/* Bank Transfer Form */}
              <AnimatePresence>
                {selectedPaymentMethod === 'bank' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`mt-3 ${shouldUseCompact ? 'space-y-3' : 'mt-4 space-y-4'}`}
                  >
                    {/* Account Holder Name */}
                    <div>
                      <label className={`block font-medium text-gray-700 dark:text-gray-300 ${
                        shouldUseCompact ? 'mb-1.5 text-sm' : 'mb-2'
                      }`}>
                        Account Holder Name
                      </label>
                      <input
                        type="text"
                        value={bankData.accountHolderName}
                        onChange={(e) => handleBankInputChange('accountHolderName', e.target.value)}
                        placeholder="John Doe"
                        className={`w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium ${
                          shouldUseCompact ? 'px-2.5 py-2.5 text-sm' : 'px-3 py-3'
                        }`}
                      />
                    </div>

                    {/* Bank Name and Account Number */}
                    <div className={shouldUseCompact ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}>
                      <div>
                        <label className={`block font-medium text-gray-700 dark:text-gray-300 ${
                          shouldUseCompact ? 'mb-1.5 text-sm' : 'mb-2'
                        }`}>
                          Bank Name
                        </label>
                        <input
                          type="text"
                          value={bankData.bankName}
                          onChange={(e) => handleBankInputChange('bankName', e.target.value)}
                          placeholder="Chase Bank"
                          className={`w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium ${
                            shouldUseCompact ? 'px-2.5 py-2.5 text-sm' : 'px-3 py-3'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block font-medium text-gray-700 dark:text-gray-300 ${
                          shouldUseCompact ? 'mb-1.5 text-sm' : 'mb-2'
                        }`}>
                          Account Number
                        </label>
                        <input
                          type="text"
                          value={bankData.accountNumber}
                          onChange={(e) => handleBankInputChange('accountNumber', e.target.value.replace(/\D/g, ''))}
                          placeholder="1234567890"
                          className={`w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium ${
                            shouldUseCompact ? 'px-2.5 py-2.5 text-sm' : 'px-3 py-3'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Routing Number and Swift Code */}
                    <div className={shouldUseCompact ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}>
                      <div>
                        <label className={`block font-medium text-gray-700 dark:text-gray-300 ${
                          shouldUseCompact ? 'mb-1.5 text-sm' : 'mb-2'
                        }`}>
                          Routing Number
                        </label>
                        <input
                          type="text"
                          value={bankData.routingNumber}
                          onChange={(e) => handleBankInputChange('routingNumber', e.target.value.replace(/\D/g, '').slice(0, 9))}
                          placeholder="021000021"
                          maxLength="9"
                          className={`w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium ${
                            shouldUseCompact ? 'px-2.5 py-2.5 text-sm' : 'px-3 py-3'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block font-medium text-gray-700 dark:text-gray-300 ${
                          shouldUseCompact ? 'mb-1.5 text-sm' : 'mb-2'
                        }`}>
                          Swift Code (Optional)
                        </label>
                        <input
                          type="text"
                          value={bankData.swiftCode}
                          onChange={(e) => handleBankInputChange('swiftCode', e.target.value.toUpperCase().slice(0, 11))}
                          placeholder="CHASUS33"
                          maxLength="11"
                          className={`w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium ${
                            shouldUseCompact ? 'px-2.5 py-2.5 text-sm' : 'px-3 py-3'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Bank Transfer Notice */}
                    <div className={`bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg ${
                      shouldUseCompact ? 'p-2.5' : 'p-3'
                    }`}>
                      <div className="flex items-start gap-2">
                        <svg className={`text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0 ${
                          shouldUseCompact ? 'w-4 h-4' : 'w-5 h-5'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div>
                          <p className={`font-medium text-amber-800 dark:text-amber-200 ${
                            shouldUseCompact ? 'text-xs' : 'text-sm'
                          }`}>
                            Bank Transfer Processing
                          </p>
                          <p className={`text-amber-700 dark:text-amber-300 mt-1 ${
                            shouldUseCompact ? 'text-xs' : 'text-xs'
                          }`}>
                            Bank transfers typically take 1-3 business days to process. You'll receive order confirmation once payment is verified.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* PayPal */}
            <motion.div
              className={`border rounded-lg transition-all cursor-pointer ${
                shouldUseCompact ? 'p-3' : 'p-4'
              } ${selectedPaymentMethod === 'paypal'
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800/50 hover:border-blue-300'
                }`}
              onClick={() => setSelectedPaymentMethod('paypal')}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="paypal"
                    name="paymentMethod"
                    checked={selectedPaymentMethod === 'paypal'}
                    onChange={() => setSelectedPaymentMethod('paypal')}
                    className={shouldUseCompact ? 'w-3.5 h-3.5 text-blue-600' : 'w-4 h-4 text-blue-600'}
                  />
                  <label htmlFor="paypal" className={`flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300 ${
                    shouldUseCompact ? 'text-sm' : ''
                  }`}>
                    <svg className={`text-blue-600 ${shouldUseCompact ? 'w-4 h-4' : 'w-5 h-5'}`} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a7.7 7.7 0 0 1-.077.437c-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287z" />
                    </svg>
                    PayPal
                  </label>
                </div>
                <svg className={`text-gray-400 ${shouldUseCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>

              {/* PayPal Form */}
              <AnimatePresence>
                {selectedPaymentMethod === 'paypal' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`mt-3 ${shouldUseCompact ? 'space-y-3' : 'mt-4 space-y-4'}`}
                  >
                    {/* PayPal Email */}
                    <div>
                      <label className={`block font-medium text-gray-700 dark:text-gray-300 ${
                        shouldUseCompact ? 'mb-1.5 text-sm' : 'mb-2'
                      }`}>
                        PayPal Email Address
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={paypalData.email}
                          onChange={(e) => handlePaypalInputChange('email', e.target.value)}
                          placeholder="your.email@example.com"
                          className={`w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium ${
                            shouldUseCompact ? 'px-2.5 py-2.5 pl-8 text-sm' : 'px-3 py-3 pl-10'
                          }`}
                        />
                        <svg className={`text-gray-400 absolute top-1/2 -translate-y-1/2 ${
                          shouldUseCompact ? 'w-3.5 h-3.5 left-2.5' : 'w-4 h-4 left-3'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                    </div>

                    {/* PayPal Password */}
                    <div>
                      <label className={`block font-medium text-gray-700 dark:text-gray-300 ${
                        shouldUseCompact ? 'mb-1.5 text-sm' : 'mb-2'
                      }`}>
                        PayPal Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPaypalPassword ? "text" : "password"}
                          value={paypalData.password}
                          onChange={(e) => handlePaypalInputChange('password', e.target.value)}
                          placeholder="Enter your PayPal password"
className={`w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium ${
                           shouldUseCompact ? 'px-2.5 py-2.5 pl-8 pr-10 text-sm' : 'px-3 py-3 pl-10 pr-12'
                         }`}
                       />
                       <svg className={`text-gray-400 absolute top-1/2 -translate-y-1/2 ${
                         shouldUseCompact ? 'w-3.5 h-3.5 left-2.5' : 'w-4 h-4 left-3'
                       }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                       </svg>
                       <button
                         type="button"
                         onClick={() => setShowPaypalPassword(!showPaypalPassword)}
                         className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ${
                           shouldUseCompact ? 'right-2.5' : 'right-3'
                         }`}
                       >
                         {showPaypalPassword ? (
                           <svg className={shouldUseCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                           </svg>
                         ) : (
                           <svg className={shouldUseCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                           </svg>
                         )}
                       </button>
                     </div>
                   </div>

                   {/* PayPal Connect Button */}
                   <motion.button
                     type="button"
                     onClick={handlePaypalConnect}
                     className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                       shouldUseCompact ? 'py-2.5 px-3 text-sm' : 'py-3 px-4'
                     }`}
                     whileHover={{ scale: 1.01 }}
                     whileTap={{ scale: 0.99 }}
                   >
                     <svg className={shouldUseCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                     </svg>
                     Connect PayPal Account
                   </motion.button>

                   {/* PayPal Notice */}
                   <div className={`bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg ${
                     shouldUseCompact ? 'p-2.5' : 'p-3'
                   }`}>
                     <div className="flex items-start gap-2">
                       <svg className={`text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0 ${
                         shouldUseCompact ? 'w-4 h-4' : 'w-5 h-5'
                       }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                       </svg>
                       <div>
                         <p className={`font-medium text-blue-800 dark:text-blue-200 ${
                           shouldUseCompact ? 'text-xs' : 'text-sm'
                         }`}>
                           Secure PayPal Payment
                         </p>
                         <p className={`text-blue-700 dark:text-blue-300 mt-1 ${
                           shouldUseCompact ? 'text-xs' : 'text-xs'
                         }`}>
                           You'll be redirected to PayPal to complete your payment securely. Your payment information is never stored on our servers.
                         </p>
                       </div>
                     </div>
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
           </motion.div>
         </div>

         {/* Terms Checkbox */}
         <motion.div
           className={`flex items-start gap-3 ${shouldUseCompact ? 'mb-4' : 'mb-6'}`}
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.4 }}
         >
           <input
             type="checkbox"
             id="terms"
             checked={agreedToTerms}
             onChange={(e) => setAgreedToTerms(e.target.checked)}
             className={`text-blue-600 mt-1 flex-shrink-0 ${
               shouldUseCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'
             }`}
           />
           <label htmlFor="terms" className={`text-gray-600 dark:text-gray-400 ${
             shouldUseCompact ? 'text-xs' : 'text-sm'
           }`}>
             I agree to the{' '}
             <a href="#" className="text-blue-600 hover:text-blue-700 underline">
               Terms of Service
             </a>
           </label>
         </motion.div>

         {/* Confirm Order Button */}
         <motion.button
           type="button"
           onClick={handleConfirmOrder}
           disabled={!isPaymentFormValid() || isSubmitting}
           className={`w-full rounded-lg font-semibold transition-all relative ${
             shouldUseCompact ? 'py-3 px-4 text-sm' : 'py-4 px-6 text-base'
           } ${isPaymentFormValid() && !isSubmitting
               ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
               : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
             }`}
           whileHover={isPaymentFormValid() && !isSubmitting ? { scale: 1.01 } : {}}
           whileTap={isPaymentFormValid() && !isSubmitting ? { scale: 0.99 } : {}}
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.5 }}
         >
           <AnimatePresence mode="wait">
             {isSubmitting ? (
               <motion.div
                 key="loading"
                 initial={{ opacity: 0, rotate: 0 }}
                 animate={{ opacity: 1, rotate: 360 }}
                 exit={{ opacity: 0 }}
                 transition={{
                   rotate: { duration: 1, repeat: Infinity, ease: "linear" },
                   opacity: { duration: 0.2 }
                 }}
                 className={`border-2 border-white border-t-transparent rounded-full mx-auto ${
                   shouldUseCompact ? 'w-4 h-4' : 'w-5 h-5'
                 }`}
               />
             ) : (
               <motion.span
                 key="text"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 transition={{ duration: 0.2 }}
               >
                 Confirm Order
               </motion.span>
             )}
           </AnimatePresence>
         </motion.button>
       </motion.div>
     </motion.div>
   </section>
);
}