"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0
  })
};

const dropdownVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: { duration: 0.2, ease: "easeOut" }
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut", staggerChildren: 0.02 }
  }
};

const dropdownItemVariants = {
  hidden: { opacity: 0, y: -5 },
  visible: { opacity: 1, y: 0 }
};

// Quiz data
const vpsQuantityOptions = [
  { id: '1-50', label: '1 - 50' },
  { id: '51-200', label: '51 - 200' },
  { id: '201-500', label: '201 - 500' },
  { id: '501+', label: '501 +' }
];

const locations = [
  { id: 'amsterdam', label: 'Amsterdam, NL', country: 'Netherlands' },
  { id: 'athens', label: 'Athens, G', country: 'Greece' },
  { id: 'bratislava', label: 'Bratislava, SK', country: 'Slovakia' },
  { id: 'brussels', label: 'Brussels, BE', country: 'Belgium' },
  { id: 'bucharest', label: 'Bucharest, RO', country: 'Romania' },
  { id: 'budapest', label: 'Budapest, HU', country: 'Hungary' },
  { id: 'copenhagen', label: 'Copenhagen, DK', country: 'Denmark' },
  { id: 'dublin', label: 'Dublin, IE', country: 'Ireland' },
  { id: 'frankfurt', label: 'Frankfurt, DE', country: 'Germany' },
  { id: 'london', label: 'London, UK', country: 'United Kingdom' },
  { id: 'madrid', label: 'Madrid, ES', country: 'Spain' },
  { id: 'milan', label: 'Milan, IT', country: 'Italy' },
  { id: 'paris', label: 'Paris, FR', country: 'France' },
  { id: 'vienna', label: 'Vienna, AT', country: 'Austria' },
  { id: 'warsaw', label: 'Warsaw, PL', country: 'Poland' },
  { id: 'zurich', label: 'Zurich, CH', country: 'Switzerland' }
];

const osOptions = [
  { id: "win2022", name: "Windows 2022", arch: "64bit", icon: "windowsOS.svg" },
  { id: "win2019", name: "Windows 2019", arch: "64bit", icon: "windowsOS.svg" },
  { id: "win2016", name: "Windows 2016", arch: "64bit", icon: "windowsOS.svg" },
  { id: "almalinux9", name: "Almalinux", arch: "9.x 64bit", icon: "almalinuxOS.svg" },
  { id: "almalinux8", name: "Almalinux", arch: "8.x 64bit", icon: "almalinuxOS.svg" },
  { id: "centos7", name: "CentOS", arch: "7.x 64bit", icon: "centOS.svg" },
  { id: "debian12", name: "Debian", arch: "12.x 64bit", icon: "debianOS.svg" },
  { id: "debian11", name: "Debian", arch: "11.x 64bit", icon: "debianOS.svg" },
  { id: "ubuntu22", name: "Ubuntu", arch: "22.x 64bit", icon: "ubuntuOS.svg" },
  { id: "ubuntu20", name: "Ubuntu", arch: "20.x 64bit", icon: "ubuntuOS.svg" }
];

const vpsPlans = [
  {
    id: 'small',
    name: 'Small',
    cpu: '1 x AMD Ryzen 5 7600',
    storage: '100 GB SATA SSD',
    memory: '4 GB'
  },
  {
    id: 'medium', 
    name: 'Medium',
    cpu: '1 x AMD Ryzen 5 7600',
    storage: '150 GB SATA SSD', 
    memory: '6 GB'
  },
  {
    id: 'large',
    name: 'Large', 
    cpu: '1 x AMD Ryzen 5 7600',
    storage: '200 GB SATA SSD',
    memory: '8 GB'
  }
];

export default function VpsInfrastructurePlatform() {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [answers, setAnswers] = useState({ 
    immediateQuantity: '', 
    futureQuantity: '', 
    selectedLocations: [],
    selectedOs: '',
    selectedPlan: '',
    fullName: '',
    email: '',
    message: ''
  }); 
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const totalSteps = 6;

  const getOSBrandColor = (osId) => {
    const brandColors = {
      win2022: "#0078D4",
      win2019: "#0078D4",
      win2016: "#0078D4",
      ubuntu22: "#E95420",
      ubuntu20: "#E95420",
      debian12: "#A81D33",
      debian11: "#A81D33",
      centos7: "#932279",
      almalinux9: "#0F4266",
      almalinux8: "#0F4266"
    };
    return brandColors[osId] || "#3B82F6";
  };

  const nextStep = () => { if (currentStep < totalSteps) { setDirection(1); setCurrentStep(s => s+1); }};
  const prevStep = () => { if (currentStep > 1) { setDirection(-1); setCurrentStep(s => s-1); }};

  const handleAnswer = (field, value) => setAnswers(prev => ({ ...prev, [field]: value }));
  const handleLocationSelect = id => {
    const loc = locations.find(l => l.id===id);
    if (loc && !answers.selectedLocations.some(l=>l.id===id))
      setAnswers(prev=>({ ...prev, selectedLocations: [...prev.selectedLocations, loc] }));
  };
  const removeLocation = id => setAnswers(prev=>({
    ...prev, selectedLocations: prev.selectedLocations.filter(l=>l.id!==id)
  }));

  const isStepValid = step => {
    if (step===1) return !!answers.immediateQuantity;
    if (step===2) return !!answers.futureQuantity;
    if (step===3) return answers.selectedLocations.length>0;
    if (step===4) return !!answers.selectedOs;
    if (step===5) return !!answers.selectedPlan;
    if (step===6) return !!answers.fullName && !!answers.email && !!answers.message;
    return false;
  };

  const handleSubmit = async() => {
    setIsSubmitting(true);
    try { 
      await new Promise(r=>setTimeout(r,2000)); 
      setIsSubmitted(true);
    } catch{} finally {
      setIsSubmitting(false);
    }  
  };

  // Success state - Thank you screen
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
            <h2 className="text-4xl md:text-5xl font-medium mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Thank you!</span>
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
            <p className="text-xl text-gray-700 mb-6 font-medium">
              Your request has been successfully submitted!
            </p>
            <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
              Our infrastructure specialists are already reviewing your requirements. 
              You'll receive a comprehensive, tailored proposal within{' '}
              <span className="text-blue-600 font-semibold bg-blue-50 dark:bg-transparent px-2 py-1 rounded">
                24 Hours
              </span>in your inbox.
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
                setCurrentStep(1);
                setAnswers({
                  immediateQuantity: '', 
                  futureQuantity: '', 
                  selectedLocations: [],
                  selectedOs: '',
                  selectedPlan: '',
                  fullName: '',
                  email: '',
                  message: ''
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
              className="px-8 py-3 bg-transparent hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-all border-2 border-gray-300"
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

  const renderStep = ()=>{
    switch(currentStep){
      case 1: return (
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl mb-8">1. How many VPS do you need immediately?</h2>
          <div className="space-y-4">{vpsQuantityOptions.map(o=>
            <motion.label key={o.id} whileHover={{scale:1.02}} whileTap={{scale:0.98}}
              className={`block p-4 border rounded-lg cursor-pointer ${answers.immediateQuantity===o.id?'border-blue-500 dark:bg-transparent':'border-gray-300 hover:border-gray-400'}`}>
              <input type="radio" className="sr-only" value={o.id} checked={answers.immediateQuantity===o.id}
                onChange={e=>handleAnswer('immediateQuantity',e.target.value)} />
              <div className="flex items-center"><div className={`w-4 h-4 mr-3 rounded-full border-2 ${answers.immediateQuantity===o.id?'border-blue-500 bg-blue-500':'border-gray-400'}`}>{answers.immediateQuantity===o.id&&<div className="w-full h-full bg-white rounded-full scale-50"/>}</div><span>{o.label}</span></div>
            </motion.label>)}
          </div>
        </div>
      );
      case 2: return (
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl mb-8">2. How many VPS do you expect you’ll need over the next 6 months?</h2>
          <div className="space-y-4">{vpsQuantityOptions.map(o=>
            <motion.label key={o.id} whileHover={{scale:1.02}} whileTap={{scale:0.98}}
              className={`block p-4 border rounded-lg cursor-pointer ${answers.futureQuantity===o.id?'border-blue-500 dark:bg-transparent':'border-gray-300 hover:border-gray-400'}`}>
              <input type="radio" className="sr-only" value={o.id} checked={answers.futureQuantity===o.id}
                onChange={e=>handleAnswer('futureQuantity',e.target.value)} />
              <div className="flex items-center"><div className={`w-4 h-4 mr-3 rounded-full border-2 ${answers.futureQuantity===o.id?'border-blue-500 bg-blue-500':'border-gray-400'}`}>{answers.futureQuantity===o.id&&<div className="w-full h-full bg-white rounded-full scale-50"/>}</div><span>{o.label}</span></div>
            </motion.label>)}
          </div>
        </div>
      );
      case 3: return (
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-3xl font-semibold mb-12 text-gray-900">3. What locations do want your VPS in?</h2>
          
          {/* Selected locations pills */}
          {answers.selectedLocations.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-3 justify-center">
              {answers.selectedLocations.map(location => (
                <motion.div 
                  key={location.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center bg-blue-50 border border-blue-200 px-4 py-2 rounded-full"
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-700 mr-3">{location.label}</span>
                  <button 
                    onClick={() => removeLocation(location.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          {/* Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowLocationDropdown(s => !s)}
              className="w-full p-4 border border-gray-300 rounded-lg flex justify-between items-center bg-white dark:bg-transparent hover:border-gray-400 transition-colors text-left"
            >
              <span className="text-gray-600">Select Locations</span>
              <ChevronDown className={`transition-transform duration-200 text-auto ${showLocationDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {showLocationDropdown && (
                <motion.div 
                  initial="hidden" 
                  animate="visible" 
                  exit="hidden" 
                  variants={dropdownVariants}
                  className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto z-10"
                >
                  {locations.map(location => {
                    const isSelected = answers.selectedLocations.some(l => l.id === location.id);
                    return (
                      <motion.button 
                        key={location.id}
                        variants={dropdownItemVariants}
                        disabled={isSelected}
                        onClick={() => {
                          handleLocationSelect(location.id);
                          setShowLocationDropdown(false);
                        }}
                        className={`w-full text-left p-3 flex items-center transition-colors ${
                          isSelected 
                            ? 'bg-blue-50 text-blue-600 cursor-not-allowed' 
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full mr-3 ${isSelected ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                        {location.label}
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      );
      case 4: return (
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-3xl font-semibold mb-12 text-gray-900">4. Choose your Operating System</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {osOptions.map((item, index) => (
              <motion.button
                key={item.id}
                onClick={() => handleAnswer('selectedOs', item.id)}
                className={`flex flex-col items-center p-6 rounded-lg border-2 transition-all ${
                  answers.selectedOs === item.id
                    ? "border-blue-500 bg-blue-50 dark:bg-transparent"
                    : "border-gray-200 bg-white dark:bg-transparent hover:border-gray-300 hover:shadow-sm"
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 + 0.2 }}
                whileHover={{
                  scale: 1.05,
                  y: -2,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-16 h-16 rounded-lg flex items-center justify-center mb-3">
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: answers.selectedOs === item.id 
                        ? getOSBrandColor(item.id) 
                        : "#9CA3AF",
                      mask: `url(/svgs/${item.icon}) center/contain no-repeat`,
                      WebkitMask: `url(/svgs/${item.icon}) center/contain no-repeat`,
                      transition: 'background-color 0.2s ease'
                    }}
                  />
                </div>
                <div className={`font-semibold text-base text-center mb-1 ${
                  answers.selectedOs === item.id
                    ? "text-auto"
                    : "text-auto "
                }`}>
                  {item.name}
                </div>
                <div className={`text-xs text-center ${
                  answers.selectedOs === item.id
                    ? "text-gray-500"
                    : "text-gray-500"
                }`}>
                  {item.arch}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      );
case 5: return (
  <div className="text-center max-w-4xl mx-auto">
    <h2 className="text-3xl font-semibold mb-4 text-gray-900">5. What VPS Plans do your users want?</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {vpsPlans.map((plan) => (
        <motion.button
          key={plan.id}
          onClick={() => handleAnswer('selectedPlan', plan.id)}
          className={`relative p-6 rounded-2xl transition-all text-left ${
            answers.selectedPlan === plan.id
              ? "bg-gradient-to-r from-orange-100 to-blue-100"
              : "bg-white"
          }`}
          style={{
            background: answers.selectedPlan === plan.id 
              ? 'linear-gradient(135deg, #fff7ed 0%, #eff6ff 100%)'
              : 'white'
          }}
          whileHover={{ y: -4, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: plan.id === 'medium' ? 0.1 : plan.id === 'large' ? 0.2 : 0 }}
        >
          {/* Gradient border overlay */}
          <div className={`absolute inset-0 rounded-2xl p-[2px] ${
            answers.selectedPlan === plan.id
              ? ""
              : "bg-gray-200 hover:bg-gray-300"
          }`}
          style={{
            background: answers.selectedPlan === plan.id 
              ? 'linear-gradient(135deg, #f97316 0%, #f97316 20%, #3b82f6 65%, #3b82f6 100%)'
              : undefined
          }}>
            <div className="w-full h-full rounded-2xl bg-white dark:bg-primary-dark"></div>
          </div>
          
          {/* Content */}
          <div className="relative z-10">
            <div className={`text-xl font-semibold mb-4 ${
              answers.selectedPlan === plan.id ? "text-gradient" : "text-gray-900"
            }`}>
              <h4 className='font-semibold text-2xl'>{plan.name}</h4>
            </div>
            <div className="space-y-2 text-sm text-text-light dark:text-text-dark">
              <div className='flex flex-row justify-between font-semibold'><span className="text-sd font-normal">CPU:</span> {plan.cpu}</div>
              <div className='flex flex-row justify-between font-semibold'><span className="text-sd font-normal">Storage:</span> {plan.storage}</div>
              <div className='flex flex-row justify-between font-semibold'><span className="text-sd font-normal">Memory:</span> {plan.memory}</div>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
    <div className="text-center">
      <p className="text-text-light dark:text-text-dark text-2xl font-semibold mb-2">Need a custom VPS?<span className="text-gradient font-semibold"> Talk with our experts</span></p>
    </div>
  </div>
);
      case 6: return (
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-3xl font-semibold mb-12 text-gray-900">6. Tell us about your Business Objectives </h2>
          <div className="space-y-6">
            <motion.input
              type="text"
              placeholder="Full Name"
              value={answers.fullName}
              onChange={(e) => handleAnswer('fullName', e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
              whileFocus={{ scale: 1.02 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            />
            <motion.input
              type="email"
              placeholder="Email Address"
              value={answers.email}
              onChange={(e) => handleAnswer('email', e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
              whileFocus={{ scale: 1.02 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            />
            <motion.textarea
              placeholder="Enter Message..."
              value={answers.message}
              onChange={(e) => handleAnswer('message', e.target.value)}
              rows={4}
              className="w-full p-4 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors resize-none"
              whileFocus={{ scale: 1.02 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            />
          </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <section className="max-w-4xl mx-auto px-6 py-4 text-auto">
      <div className="mb-6 flex justify-between items-center">
        <span>Step {currentStep} of {totalSteps}</span>
        <span>{Math.round((currentStep/totalSteps)*100)}% Complete</span>
      </div>
      <div className="w-full bg-gray-200 h-2 rounded-full mb-12">
        <motion.div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
          initial={{width:0}} animate={{width:`${(currentStep/totalSteps)*100}%`}} transition={{duration:0.5}}/>
      </div>
      <div className="relative min-h-[500px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={currentStep} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
            transition={{x:{type:'spring',stiffness:300,damping:30},opacity:{duration:0.2}}} className="absolute inset-0">
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
<div className="flex justify-center items-center gap-4 mt-12 md:relative fixed bottom-0 left-0 right-0 p-4 md:p-0 border-t md:border-t-0 bg-primary-light dark:bg-primary-dark z-10">
  {/* Previous Button */}
  <motion.button 
    onClick={prevStep} 
    disabled={currentStep === 1} 
    whileHover={currentStep > 1 ? {scale: 1.05} : {}} 
    whileTap={currentStep > 1 ? {scale: 0.95} : {}}
    className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors ${
      currentStep === 1 
        ? 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
        : 'border-text-light dark:border-text-dark text-text-light dark:text-text-dark hover:border-blue-cta hover:text-blue-cta dark:hover:border-blue-cta dark:hover:text-blue-cta'
    }`}
  >
    <ChevronLeft size={20}/>
  </motion.button>

  {/* Continue/Submit Button */}
  {currentStep === totalSteps ? (
    // Submit button on final step
    <motion.button 
      onClick={handleSubmit} 
      disabled={!isStepValid(currentStep) || isSubmitting} 
      whileHover={!isSubmitting && isStepValid(currentStep) ? {scale: 1.05} : {}} 
      whileTap={!isSubmitting && isStepValid(currentStep) ? {scale: 0.95} : {}}
      className={`flex items-center px-6 py-3 rounded-full font-medium border-2 transition-colors ${
        isStepValid(currentStep) && !isSubmitting 
          ? 'bg-blue-cta text-text-dark border-blue-cta hover:bg-blue-cta/90 hover:shadow-blue-glow' 
          : 'bg-transparent text-gray-450 border-gray-450 cursor-not-allowed'
      }`}
    >  
      {isSubmitting ? 'Submitting...' : 'Get VPS Quote'}
    </motion.button>
  ) : (
    // Continue button for other steps
    <motion.button 
      onClick={nextStep} 
      disabled={!isStepValid(currentStep)} 
      whileHover={isStepValid(currentStep) ? {scale: 1.05} : {}} 
      whileTap={isStepValid(currentStep) ? {scale: 0.95} : {}}
      className={`flex items-center px-6 py-3 rounded-full font-medium border-2 transition-colors ${
        isStepValid(currentStep) 
          ? 'bg-transparent text-text-light dark:text-text-dark border-text-light dark:border-text-dark cta hover:text-text-dark hover:border-blue-cta hover:shadow-blue-glow' 
          : 'bg-transparent text-gray-450 border-gray-450 cursor-not-allowed'
      }`}
    >
      Continue <ChevronRight size={16} className="ml-1"/>
    </motion.button>
  )}
</div>

      {/* Validation messages */}
      {currentStep===3&&answers.selectedLocations.length===0&&(
        <motion.p initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="text-center text-amber-600 mt-4">
          Please select at least one location
        </motion.p>
      )}

      {currentStep===4 && !answers.selectedOs && (
        <motion.p initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="text-center text-amber-600 mt-4">
          Please select an operating system
        </motion.p>
      )}

      {currentStep===5 && !answers.selectedPlan && (
        <motion.p initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="text-center text-amber-600 mt-4">
          Please select a VPS plan
        </motion.p>
      )}

      {currentStep===6 && (!answers.fullName || !answers.email || !answers.message) && (
        <motion.p initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="text-center text-amber-600 mt-4">
          Please fill in all required fields
        </motion.p>
      )}
    </section>
  );
}