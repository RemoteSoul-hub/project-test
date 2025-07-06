"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const dropdownVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: "easeOut",
      staggerChildren: 0.02
    }
  }
};

const dropdownItemVariants = {
  hidden: { opacity: 0, y: -5 },
  visible: { opacity: 1, y: 0 }
};

const regions = [
  { id: 'north-america', label: 'North America' },
  { id: 'europe', label: 'Europe' },
  { id: 'asia-pacific', label: 'Asia Pacific' },
  { id: 'south-america', label: 'South America' },
  { id: 'africa', label: 'Africa' },
  { id: 'middle-east', label: 'Middle East' }
];

export default function TailoredSolution() {
  // Form state
  const [formData, setFormData] = useState({
    requirements: '',
    region: '',
    firstName: '',
    lastName: '',
    email: ''
  });

  // UI state
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle region selection
  const handleRegionSelect = (regionId) => {
    const selectedRegion = regions.find(r => r.id === regionId);
    handleInputChange('region', selectedRegion?.label || '');
    setShowRegionDropdown(false);
  };

  // Form validation
  const isFormValid = () => {
    const { requirements, region, firstName, lastName, email } = formData;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    return (
      requirements.trim().length > 10 &&
      region.trim() &&
      firstName.trim() &&
      lastName.trim() &&
      emailRegex.test(email)
    );
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid()) return;
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Tailored solution request submitted:', formData);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state - Snappy and slick thank you screen
  if (isSubmitted) {
    return (
      <section className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 0.6,
            type: "spring",
            stiffness: 100,
            damping: 15
          }}
          className="text-center relative overflow-hidden"
        >
          {/* Background decoration */}
          <motion.div
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            transition={{ 
              delay: 0.3,
              duration: 1.2,
              type: "spring",
              stiffness: 80
            }}
            className="absolute inset-0 -z-10"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 rounded-full blur-3xl" />
          </motion.div>

          {/* Success icon with animated ring */}
          <motion.div className="relative mx-auto mb-8 w-24 h-24 mt-16">
            {/* Outer ring animation */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"
            />
            
            {/* Pulse ring */}
            <motion.div
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ 
                delay: 0.5,
                duration: 1.5,
                repeat: Infinity,
                repeatDelay: 2
              }}
              className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"
            />
            
            {/* Inner circle with checkmark */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                delay: 0.4,
                type: "spring", 
                stiffness: 300, 
                damping: 20 
              }}
              className="absolute inset-2 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg"
            >
              <motion.svg 
                initial={{ scale: 0, pathLength: 0 }}
                animate={{ scale: 1, pathLength: 1 }}
                transition={{ 
                  delay: 0.6,
                  duration: 0.6,
                  ease: "easeOut"
                }}
                className="w-8 h-8 text-green-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <motion.path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={3} 
                  d="M5 13l4 4L19 7"
                />
              </motion.svg>
            </motion.div>
          </motion.div>

          {/* Main heading with staggered animation */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-haas font-medium mb-6">
              <span className="text-gradient">Thank you!</span>
            </h2>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100px" }}
              transition={{ delay: 1, duration: 0.8 }}
              className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mb-8 rounded-full"
            />
          </motion.div>

          {/* Content with staggered reveals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="mb-12"
          >
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-6 font-medium">
              Your request has been successfully submitted!
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto">
              Our infrastructure specialists are already reviewing your requirements. 
              You'll receive a comprehensive, tailored proposal within{' '}
              <span className="text-active-light font-semibold bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                1 working day
              </span>.
            </p>
          </motion.div>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.button
              onClick={() => {
                setIsSubmitted(false);
                setFormData({
                  requirements: '',
                  region: '',
                  firstName: '',
                  lastName: '',
                  email: ''
                });
              }}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl border-2 border-blue-600"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Submit Another Request
            </motion.button>
            
            <motion.button
              onClick={() => window.location.href = '/'}
              className="px-8 py-3 bg-transparent hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-all border-2 border-gray-300 dark:border-gray-600"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Back to Home
            </motion.button>
          </motion.div>

          {/* Floating particles decoration */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                opacity: 0,
                x: Math.random() * 400 - 200,
                y: Math.random() * 400 - 200
              }}
              animate={{ 
                opacity: [0, 1, 0],
                y: [0, -100, -200],
                x: [0, Math.random() * 100 - 50]
              }}
              transition={{
                delay: 1.5 + i * 0.2,
                duration: 3,
                repeat: Infinity,
                repeatDelay: 5
              }}
              className="absolute w-2 h-2 bg-blue-400 rounded-full -z-10"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 3) * 20}%`
              }}
            />
          ))}
        </motion.div>
      </section>
    );
  }

  return (
    <section className="max-w-2xl mx-auto px-6 py-4">
      <motion.form
        onSubmit={handleSubmit}
        className="space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        {/* Requirements Section */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Your Requirements
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-base">
            Specify the hardware and the amount you're requesting, expected<br />
            bandwidth, any custom configurations, compliance standards, etc.
          </p>
          <textarea
            value={formData.requirements}
            onChange={(e) => handleInputChange('requirements', e.target.value)}
            placeholder="Enter your requirements"
            rows={6}
            className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          {formData.requirements.length > 0 && formData.requirements.length < 10 && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
              Please provide more details (minimum 10 characters)
            </p>
          )}
        </motion.div>

        {/* Region Selection */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.5 }}
          className="relative"
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Choose Preferred Region
          </h3>
          <button
            type="button"
            onClick={() => setShowRegionDropdown(!showRegionDropdown)}
            className={`w-full px-4 py-4 border rounded-lg flex justify-between items-center transition-all ${
              formData.region
                ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10"
                : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 bg-white dark:bg-transparent hover:border-gray-400 dark:hover:border-gray-500"
            }`}
          >
            <span className="font-medium text-base">
              {formData.region || "Select region"}
            </span>
            <motion.span
              animate={{ rotate: showRegionDropdown ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={20} />
            </motion.span>
          </button>

          <AnimatePresence>
            {showRegionDropdown && (
              <motion.div
                className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10"
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <div className="py-2">
                  {regions.map((region) => (
                    <motion.button
                      key={region.id}
                      type="button"
                      variants={dropdownItemVariants}
                      onClick={() => handleRegionSelect(region.id)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${
                        formData.region === region.label
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {region.label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Contact Details Section */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-6 border-b border-gray-300 dark:border-gray-600 pb-3">
            Contact Details
          </h3>
          
          <div className="space-y-6">
            {/* First Name */}
            <div>
              <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="Enter your first name"
                className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Enter your last name"
                className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </motion.div>

        {/* Submit Button */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.7 }}
          className="pt-6"
        >
          <motion.button
            type="submit"
            disabled={!isFormValid() || isSubmitting}
            className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all relative ${
              isFormValid() && !isSubmitting
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl" 
                : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            }`}
            whileHover={isFormValid() && !isSubmitting ? { scale: 1.02, y: -2 } : {}}
            whileTap={isFormValid() && !isSubmitting ? { scale: 0.98 } : {}}
          >
            <AnimatePresence mode="wait">
              {isSubmitting ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-3"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  Sending Request...
                </motion.div>
              ) : (
                <motion.span
                  key="text"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Send Request
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <motion.p 
            className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            We'll get back to you with a tailored proposal{' '}
            <span className="text-active-light font-medium">
              within 1 working day
            </span>
            .
          </motion.p>
        </motion.div>
      </motion.form>
    </section>
  );
}