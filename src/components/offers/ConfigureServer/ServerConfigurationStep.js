"use client";

import React, { useState, useMemo } from "react";
import { ChevronDown, Pencil, Lock, RefreshCw, AlertCircle } from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  fadeInUp,
  dropdownVariants,
  dropdownItemVariants,
  configTransition,
  buttonHover,
  buttonTap,
  buttonHoverLift,
  smallElementHover,
  smallElementTap,
  cardHover
} from '@/animations/variants';
import MobilePriceSheet from "@/components/MobilePriceSheet";
import { currencies, getOSBrandColor, getOSIcon } from '@/data/serverConfig';
import {
  getFilteredOptions,
  getStorageByType,
  getAvailableStorageTypes,
  getComponentDisplayName,
  isComponentAvailable,
  getStorageDisplayName,
  getCPUSpecs,
  getSimplifiedStorageTypes,
  getStorageBySimplifiedType,
  getActualStorageType
} from '@/utils/componentHelpers';

// Helper function to extract architecture from OS specs or name
const extractArchitecture = (osName, specs = {}) => {
  // First check if specs contain arch from API processing
  if (specs.arch) {
    return specs.arch;
  }
  
  // Fallback to pattern matching
  const name = (osName || '').toLowerCase();
  
  // Look for version numbers and architecture hints
  if (name.includes('64') || name.includes('x64') || name.includes('amd64')) {
    return '64bit';
  }
  if (name.includes('32') || name.includes('x86') || name.includes('i386')) {
    return '32bit';
  }
  if (name.includes('arm64') || name.includes('aarch64')) {
    return 'ARM64';
  }
  if (name.includes('arm')) {
    return 'ARM';
  }
  
  // Extract version numbers (e.g., "Ubuntu 22.04" -> "22.x 64bit")
  const versionMatch = name.match(/(\d+)\.?(\d*)/);
  if (versionMatch) {
    const major = versionMatch[1];
    return `${major}.x 64bit`;
  }
  
  return 'Unknown';
};

// Utility Components (moved from parent)
function ConfigBlock({ title, children, className = "", isCompact = false }) {
  return (
    <motion.div
      className={className}
      layout
      transition={configTransition}
    >
      <h3 className={`border-b pb-3 border-gray-300 font-semibold mb-3 text-active-light dark:text-active-dark ${
        isCompact ? 'text-xs pb-2 mb-2' : 'text-sm'
      }`}>
        {title}
      </h3>
      {children}
    </motion.div>
  );
}

function ConfigSummary({ title, value, subtitle, onEdit, className = "", isCompact = false }) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
        delay: 0.1
      }}
      layout
      layoutId={`config-${title.toLowerCase()}`}
    >
      <h3 className={`border-b border-gray-300 font-semibold text-active-light dark:text-active-dark-light ${
        isCompact ? 'text-xs pb-2 mb-2' : 'text-sm pb-3 mb-3'
      }`}>
        {title}
      </h3>

      <motion.div
        className={`bg-white dark:bg-transparent border-2 border-blue-500 rounded-sm flex flex-col justify-center ${
          isCompact ? 'h-[50px] p-3 mb-2' : 'h-[64px] p-4 mb-3'
        }`}
        whileHover={buttonHover}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <div className={`font-semibold text-blue-600 dark:text-text-dark leading-tight ${
          isCompact ? 'text-xs' : 'text-sm'
        }`}>
          {value}
        </div>

        {value && subtitle && (
          <div className={`text-blue-500 dark:text-text-dark mt-1 min-h-[16px] flex items-center ${
            isCompact ? 'text-xs' : 'text-xs'
          }`}>
            {subtitle}
          </div>
        )}
      </motion.div>

      <motion.button
        onClick={onEdit}
        className={`text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1 transition-colors ${
          isCompact ? 'text-xs' : 'text-xs'
        }`}
        whileHover={smallElementHover}
        whileTap={smallElementTap}
      >
        <Pencil size={isCompact ? 10 : 12} /> Edit
      </motion.button>
    </motion.div>
  );
}

function SelectButton({ label, sub, center, active, available = true, onClick, hasActiveSelection, isCompact = false }) {
  const isInactive = hasActiveSelection && !active && available;

  return (
    <motion.button
      onClick={onClick}
      disabled={!available}
      className={`w-full text-left rounded-md border transition-all flex ${
        isCompact ? 'h-12 p-3 text-xs' : 'h-14 p-4 text-sm'
      } ${active && available
        ? "border-blue-500 text-active-light dark:text-active-dark shadow-blue-glow"
        : available
          ? `border-gray-450 hover:border-gray-600 bg-transparent ${isInactive ? "opacity-50" : ""
          }`
          : "border-gray-200 bg-gray-100 dark:bg-transparent text-gray-400 cursor-not-allowed opacity-60"
        }`}
      whileHover={available ? buttonHoverLift : {}}
      whileTap={available ? buttonTap : {}}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className="flex justify-between items-center dark:text-active-dark w-full">
        <div className="flex-1 flex flex-col justify-center">
          <div className='font-semibold'>
            {typeof label === 'string' ? label : label}
          </div>
          {sub && <div className={isCompact ? "text-xs" : "text-xs"}>{sub}</div>}
          {!available && <div className={`text-gray-400 mt-1 ${isCompact ? 'text-xs' : 'text-xs'}`}>On Request</div>}
        </div>
      </div>
    </motion.button>
  );
}

// API Status Indicator
function APIStatusIndicator({ isUsingFallback, error, onRefresh, loading, isCompact = false }) {
  if (!isUsingFallback && !error) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-sm ${
        isCompact ? 'mb-3 p-2' : 'mb-4 p-3'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle size={isCompact ? 14 : 16} className="text-yellow-600 dark:text-yellow-400" />
          <span className={`text-yellow-800 dark:text-yellow-200 ${isCompact ? 'text-xs' : 'text-sm'}`}>
            {error ? 'API connection failed - using cached data' : 'Using offline data'}
          </span>
        </div>
        <motion.button
          onClick={onRefresh}
          disabled={loading}
          className={`flex items-center gap-1 text-yellow-700 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-100 ${
            isCompact ? 'text-xs' : 'text-sm'
          }`}
          whileHover={!loading ? { scale: 1.05 } : {}}
          whileTap={!loading ? { scale: 0.95 } : {}}
        >
          <RefreshCw size={isCompact ? 12 : 14} className={loading ? 'animate-spin' : ''} />
          Retry
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function ServerConfigurationStep({
  // Component data
  components,
  loading,
  error,
  isUsingFallback,
  onRefresh,

  // Selections
  selectedComponents,
  onComponentSelect,
  selectedDetails,
  hasFullConfiguration,

  // Pricing
  currency,
  setCurrency,
  pricing,

  // OS Selection
  os,
  setOs,

  // UI State
  isLoggedIn,
  
  // Layout control
  isCompact = false, // New prop to control compact layout

  // Callbacks
  onContinue
}) {
  // Use isLoggedIn as fallback for isCompact if not explicitly provided
  const shouldUseCompact = isCompact || isLoggedIn;
  
  // Local state
  const [selectedStorageType, setSelectedStorageType] = useState('ssd');
  const [showDropdown, setShowDropdown] = useState(false);

  // Get storage types from available storage components
  const storageTypes = useMemo(() => {
    return getSimplifiedStorageTypes(components);
  }, [components]);

  return (
    <section className={`w-full ${shouldUseCompact ? 'px-3 sm:px-4 lg:px-6' : 'px-4 sm:px-6 lg:px-8'}`}>
      <LayoutGroup>
        {/* API Status Indicator */}
        <APIStatusIndicator
          isUsingFallback={isUsingFallback}
          error={error}
          onRefresh={onRefresh}
          loading={loading}
          isCompact={shouldUseCompact}
        />

        <div className={`flex flex-col max-w-full ${shouldUseCompact ? 'gap-4' : 'gap-6'}`}>
          {/* Main Configuration Section */}
          <div className={`flex flex-col xl:flex-row w-full ${shouldUseCompact ? 'gap-4' : 'gap-6'}`}>
            {/* Configuration Options */}
            <motion.div
              className="flex-1 min-w-0"
              layout
              transition={configTransition}
            >
              <AnimatePresence mode="wait">
                {hasFullConfiguration ? (
                  <motion.div
                    key="summary"
                    className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 ${shouldUseCompact ? 'gap-3' : 'gap-4'}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, staggerChildren: 0.1 }}
                  >
                    <ConfigSummary
                      title="CPU"
                      value={selectedDetails.cpu ? getComponentDisplayName(selectedDetails.cpu) : null}
                      subtitle={selectedDetails.cpu ? getCPUSpecs(selectedDetails.cpu) : null}
                      className="w-full"
                      onEdit={() => onComponentSelect('cpu', null)}
                      isCompact={shouldUseCompact}
                    />

                    <ConfigSummary
                      title="Storage"
                      value={selectedDetails.storage ? getStorageDisplayName(selectedDetails.storage) : null}
                      className="w-full"
                      onEdit={() => onComponentSelect('storage', null)}
                      isCompact={shouldUseCompact}
                    />

                    <ConfigSummary
                      title="Memory"
                      value={selectedDetails.memory ? getComponentDisplayName(selectedDetails.memory) : null}
                      className="w-full"
                      onEdit={() => onComponentSelect('memory', null)}
                      isCompact={shouldUseCompact}
                    />

                    <ConfigSummary
                      title="Location"
                      value={selectedDetails.location ? getComponentDisplayName(selectedDetails.location) : null}
                      className="w-full"
                      onEdit={() => onComponentSelect('location', null)}
                      isCompact={shouldUseCompact}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="config"
                    className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 ${shouldUseCompact ? 'gap-3' : 'gap-4'}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, staggerChildren: 0.05 }}
                  >
                    {/* CPU Selection */}
                    <ConfigBlock title="CPU" className="w-full" isCompact={shouldUseCompact}>
                      <motion.div variants={fadeInUp} className={shouldUseCompact ? "space-y-1.5" : "space-y-2"}>
                        {getFilteredOptions(components, 'cpu', { available: true }).map((item) => {
                          const hasActiveSelection = selectedComponents.cpu !== null;
                          return (
                            <SelectButton
                              key={item.id}
                              active={selectedComponents.cpu === item.id}
                              available={isComponentAvailable(item)}
                              onClick={() => onComponentSelect('cpu', item.id)}
                              label={getComponentDisplayName(item)}
                              sub={getCPUSpecs(item)}
                              hasActiveSelection={hasActiveSelection}
                              isCompact={shouldUseCompact}
                            />
                          );
                        })}
                      </motion.div>
                    </ConfigBlock>

                    {/* Storage Selection */}
                    <ConfigBlock
                      className="w-full"
                      isCompact={shouldUseCompact}
                      title={
                        <div className="flex items-center justify-center sm:justify-start flex-wrap gap-2">
                          {storageTypes.length > 1 && storageTypes.map((type, index) => (
                            <React.Fragment key={type}>
                              <motion.span
                                className={`cursor-pointer transition-colors ${
                                  shouldUseCompact ? 'text-xs' : 'text-sm'
                                } ${selectedStorageType === type
                                  ? "text-blue-600 dark:text-white font-semibold"
                                  : "text-gray-400 hover:text-gray-600"
                                  }`}
                                onClick={() => {
                                  setSelectedStorageType(type);
                                  if (selectedComponents.storage) {
                                    onComponentSelect('storage', null);
                                  }
                                }}
                                whileHover={smallElementHover}
                                whileTap={smallElementTap}
                              >
                                {type.toUpperCase()}
                              </motion.span>
                              {index < storageTypes.length - 1 && (
                                <span className="text-gray-300">/</span>
                              )}
                            </React.Fragment>
                          ))}
                          {storageTypes.length === 1 && (
                            <span className={`text-blue-600 dark:text-white font-semibold ${
                              shouldUseCompact ? 'text-xs' : 'text-sm sm:text-base'
                            }`}>
                              Storage
                            </span>
                          )}
                        </div>
                      }
                    >
                      <motion.div variants={fadeInUp} className={shouldUseCompact ? "space-y-1.5" : "space-y-2"}>
                        <AnimatePresence>
                          {getStorageBySimplifiedType(components, selectedStorageType)
                            .filter(item => isComponentAvailable(item))
                            .sort((a, b) => {
                              try {
                                const specsA = typeof a.specs === 'string' ? JSON.parse(a.specs) : a.specs;
                                const specsB = typeof b.specs === 'string' ? JSON.parse(b.specs) : b.specs;

                                // Sort by actual type: NVME first, then SATA_SSD, then SSD
                                const typeOrder = { 'nvme': 1, 'sata_ssd': 2, 'ssd': 3, 'hdd': 4 };
                                const typeA = specsA.type?.toLowerCase() || 'unknown';
                                const typeB = specsB.type?.toLowerCase() || 'unknown';

                                const orderA = typeOrder[typeA] || 999;
                                const orderB = typeOrder[typeB] || 999;

                                if (orderA !== orderB) {
                                  return orderA - orderB;
                                }

                                return a.name.localeCompare(b.name);
                              } catch {
                                return a.name.localeCompare(b.name);
                              }
                            })
                            .map((item) => {
                              const hasActiveSelection = selectedComponents.storage !== null;
                              const actualType = getActualStorageType(item);

                              return (
                                <motion.div
                                  key={item.id}
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <SelectButton
                                    active={selectedComponents.storage === item.id}
                                    available={isComponentAvailable(item)}
                                    onClick={() => onComponentSelect('storage', item.id)}
                                    label={
                                      <div className="flex items-center gap-2">
                                        <span>{getStorageDisplayName(item).replace(/\b(HDD|SSD|NVME|SATA_SSD|SATA|NVME_SSD)\b/gi, '').trim()}</span>
                                        <span className={`bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium ${
                                          shouldUseCompact ? 'text-xs' : 'text-xs'
                                        }`}>
                                          {actualType === 'SATA_SSD' ? 'SATA' : actualType}
                                        </span>
                                      </div>
                                    }
                                    hasActiveSelection={hasActiveSelection}
                                    isCompact={shouldUseCompact}
                                  />
                                </motion.div>
                              );
                            })}
                        </AnimatePresence>
                      </motion.div>
                    </ConfigBlock>

                    {/* Memory Selection */}
                    <ConfigBlock title="Memory" className="w-full" isCompact={shouldUseCompact}>
                      <motion.div variants={fadeInUp} className={shouldUseCompact ? "space-y-1.5" : "space-y-2"}>
                        <AnimatePresence>
                          {getFilteredOptions(components, 'memory', { available: true }).map((item) => {
                            const hasActiveSelection = selectedComponents.memory !== null;
                            return (
                              <motion.div
                                key={item.id}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <SelectButton
                                  active={selectedComponents.memory === item.id}
                                  available={isComponentAvailable(item)}
                                  onClick={() => onComponentSelect('memory', item.id)}
                                  label={getComponentDisplayName(item)}
                                  center
                                  hasActiveSelection={hasActiveSelection}
                                  isCompact={shouldUseCompact}
                                />
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </motion.div>
                    </ConfigBlock>

                    {/* Location Selection */}
                    <ConfigBlock title="Locations" className="w-full relative" isCompact={shouldUseCompact}>
                      <motion.div variants={fadeInUp}>
                        <button
                          onClick={() => setShowDropdown(!showDropdown)}
                          className={`w-full border rounded-sm flex justify-between items-center ${
                            shouldUseCompact ? 'h-12 p-3 text-xs' : 'h-14 p-4 px-3 sm:px-4 py-2 text-sm sm:text-base'
                          } ${selectedComponents.location
                            ? "border-blue-500 text-active-light dark:text-active-dark"
                            : "border-gray-300 text-gray-700 dark:text-text-dark"
                            }`}
                        >
                          <div className="inline-flex gap-2 font-semibold truncate">
                            {selectedDetails.location?.name || `Available (${getFilteredOptions(components, 'location', { available: true }).length})`}
                          </div>
                          <motion.span
                            className="ml-2 flex-shrink-0"
                            animate={{ rotate: showDropdown ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown size={shouldUseCompact ? 16 : 18} />
                          </motion.span>
                        </button>

                        <AnimatePresence>
                          {showDropdown && (
                            <motion.div
                              className={`absolute mt-2 left-0 right-0 sm:left-auto bg-white dark:bg-slate-dark border border-gray-200 rounded-sm shadow-lg max-h-96 overflow-y-auto z-20 ${
                                shouldUseCompact 
                                  ? 'sm:min-w-[300px] md:min-w-[400px] lg:min-w-[500px]' 
                                  : 'sm:min-w-[400px] md:min-w-[500px] lg:min-w-[600px]'
                              } max-w-[90vw]`}
                              variants={dropdownVariants}
                              initial="hidden"
                              animate="visible"
                              exit="hidden"
                              style={{ originY: 0 }}
                            >
                              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 p-4 ${
                                shouldUseCompact ? 'gap-2' : 'gap-3'
                              }`}>
                                {getFilteredOptions(components, 'location', { available: true }).map((loc, index) => {
                                  const isSelected = selectedComponents.location === loc.id;
                                  const isUnavailable = !isComponentAvailable(loc);

                                  const baseClasses = `text-left border border-gray-200 dark:border-gray-450 rounded ${
                                    shouldUseCompact ? 'px-2 py-2 text-xs' : 'px-3 py-3 text-sm sm:text-base'
                                  }`;
                                  const selectedClasses = isSelected
                                    ? "bg-blue-50 text-blue-600 dark:text-blue-600 dark:bg-transparent dark:border-blue-600 shadow-blue-glow"
                                    : "";
                                  const unavailableClasses = isUnavailable
                                    ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-transparent text-gray-450"
                                    : "";
                                  const unselectedAvailableClasses =
                                    !isSelected && isComponentAvailable(loc)
                                      ? "text-gray-900 dark:text-white"
                                      : "";

                                  const hoverClasses =
                                    isComponentAvailable(loc) && !isSelected
                                      ? "hover:bg-gray-50 dark:hover:bg-inherit dark:hover:text-black"
                                      : "";

                                  return (
                                    <motion.button
                                      key={loc.id}
                                      variants={dropdownItemVariants}
                                      onClick={() => {
                                        if (isComponentAvailable(loc)) {
                                          onComponentSelect("location", loc.id);
                                          setShowDropdown(false);
                                        }
                                      }}
                                      disabled={isUnavailable}
                                      className={`${baseClasses} ${selectedClasses} ${unavailableClasses} ${unselectedAvailableClasses} ${hoverClasses}`}
                                      whileHover={isComponentAvailable(loc) && !isSelected ? { backgroundColor: "#f9fafb" } : {}}
                                      whileTap={isComponentAvailable(loc) ? { scale: 0.98 } : {}}
                                    >
                                      <div className="flex flex-col justify-center items-start text-center">
                                        <span className="font-semibold">{loc.name}</span>
                                        {isUnavailable && (
                                          <span className={`text-gray-400 mt-1 ${
                                            shouldUseCompact ? 'text-xs' : 'text-xs'
                                          }`}>On Request</span>
                                        )}
                                      </div>
                                    </motion.button>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </ConfigBlock>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Purchase Price - Responsive Sidebar */}
            <motion.div
              className={`hidden xl:block w-full xl:flex-shrink-0 ${shouldUseCompact ? 'xl:w-72' : 'xl:w-80'}`}
              layout
              transition={configTransition}
            >
              <div className={`rounded-sm sticky top-4 ${shouldUseCompact ? 'px-3 sm:px-4' : 'px-4 sm:px-6'}`}>
                <h3 className={`border-b border-gray-300 font-semibold mb-2 ${
                  shouldUseCompact ? 'text-xs pb-2' : 'text-sm pb-2'
                }`}>
                  Server Price
                </h3>

                <div className={`flex flex-col items-center ${shouldUseCompact ? 'space-y-3' : 'space-y-4'}`}>
                  {/* Currency Selector */}
{/* Currency Selector */}
<div className="relative flex w-full border border-gray-600 rounded-sm overflow-hidden divide-x divide-gray-600">
  {/* Border overlay instead of background */}
  <div 
    className="absolute top-0 left-0 h-full border-2 border-blue-500 transition-transform duration-200 ease-out rounded-sm pointer-events-none"
    style={{
      width: `${100 / currencies.length}%`,
      transform: `translateX(${currencies.findIndex(c => c.id === currency.id) * 100}%)`
    }}
  />
  
  {/* Buttons */}
  {currencies.map((cur) => (
    <motion.button
      key={cur.id}
      onClick={() => setCurrency(cur)}
      className={`relative z-10 flex-1 font-semibold text-center transition-colors ${
        shouldUseCompact ? 'h-12 px-2 py-2 text-xs' : 'h-14 px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm'
      } ${
        currency.id === cur.id
          ? "text-blue-400"
          : "text-text-light dark:text-text-dark"
      }`}
      whileTap={buttonTap}
    >
      {cur.label}
    </motion.button>
  ))}
</div>

                  {/* Price Display */}
                  <motion.div
                    className={`font-bold text-gray-900 dark:text-text-dark text-center ${
                      shouldUseCompact ? 'text-xl mb-3' : 'text-2xl sm:text-3xl mb-4'
                    }`}
                    key={pricing.total}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    {currency.symbol}
                    {(pricing.total * currency.rate).toFixed(2)}
                    <span className={`font-normal text-gray-500 dark:text-text-dark ${
                      shouldUseCompact ? 'text-sm' : 'text-base sm:text-lg'
                    }`}>/mo</span>
                  </motion.div>

                  {/* Continue Button */}
                  <motion.button
                    disabled={!hasFullConfiguration}
                    onClick={onContinue}
                    className={`w-full rounded-sm font-semibold transition-all ${
                      shouldUseCompact ? 'py-2.5 px-4 text-sm' : 'py-3 sm:py-4 px-6 text-sm sm:text-base'
                    } ${hasFullConfiguration
                      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    whileHover={hasFullConfiguration ? { scale: 1.02 } : {}}
                    whileTap={hasFullConfiguration ? { scale: 0.98 } : {}}
                    animate={{
                      backgroundColor: hasFullConfiguration ? "#2563eb" : "#d1d5db",
                      color: hasFullConfiguration ? "#ffffff" : "#6b7280"
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {hasFullConfiguration ? "Continue" : "Select Configuration"}
                  </motion.button>

                  {/* Security Notice */}
                  <p className={`text-gray-500 dark:text-gray-450 text-center mt-2 flex items-center justify-center space-x-1 ${
                    shouldUseCompact ? 'text-xs' : 'text-xs'
                  }`}>
                    <span><Lock size={shouldUseCompact ? 10 : 12} /></span>
                    <span>Payments are secure and encrypted</span>
                  </p>
                </div>
              </div>
            </motion.div>

            <MobilePriceSheet
              pricing={pricing}
              currency={currency}
              currencies={currencies}
              setCurrency={setCurrency}
              hasFullConfiguration={hasFullConfiguration}
              onContinue={onContinue}
            />
          </div>

          {/* OS Section */}
          <motion.div
            className={`transition-all duration-300 ${
              shouldUseCompact ? 'max-w-[680px]' : isLoggedIn ? 'max-w-[760px]' : 'max-w-[872px]'
            } ${!hasFullConfiguration ? "opacity-50 pointer-events-none" : ""}`}
            animate={{
              opacity: hasFullConfiguration ? 1 : 0.5,
              y: hasFullConfiguration ? 0 : 10
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="w-full">
<motion.h2
  className={`font-haas font-medium text-center sm:text-left ${
    shouldUseCompact 
      ? 'text-xl sm:text-2xl lg:text-3xl mb-4' 
      : 'text-2xl sm:text-3xl lg:text-4xl mb-6'
  } ${hasFullConfiguration ? "text-gradient" : "text-gray-450"}`}
  animate={{
    color: hasFullConfiguration ? "#3b82f6" : "#9ca3af"
  }}
  transition={{ duration: 0.3 }}
>
  {shouldUseCompact ? (
    <>
      <span className="text-gray-400">2. </span>
      <span className="text-gradient">Choose Operating System</span>
    </>
  ) : (
    'Choose Operating System'
  )}
</motion.h2>

              {/* OS Grid */}
              <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 ${
                shouldUseCompact ? 'gap-2 sm:gap-3' : 'gap-3 sm:gap-4'
              }`}>
                {components.operatingSystems?.map((item, index) => {
                  // Use the icon and arch from specs (processed by API) or fallback to pattern matching
                  const icon = getOSIcon(item.name, item.specs);
                  const arch = extractArchitecture(item.name, item.specs);
                  const brandColor = getOSBrandColor(item.id, item.name, item.specs);
                  
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => hasFullConfiguration && setOs(item.id)}
                      disabled={!hasFullConfiguration}
                      className={`flex flex-col items-center rounded-sm border-2 transition-all duration-200 ${
                        shouldUseCompact 
                          ? 'p-2 sm:p-3 lg:p-4 min-h-[100px] sm:min-h-[120px]' 
                          : 'p-3 sm:p-4 lg:p-5 min-h-[120px] sm:min-h-[160px]'
                      } ${
                        os === item.id && hasFullConfiguration
                          ? "border-blue-500 bg-blue-50 dark:bg-transparent"
                          : hasFullConfiguration
                            ? "border-gray-200 bg-white dark:bg-transparent hover:border-gray-300"
                            : "border-gray-200 bg-transparent cursor-not-allowed"
                      }`}
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        transition: {
                          duration: 0.3,
                          delay: index * 0.03,
                          ease: "easeOut"
                        }
                      }}
                      whileHover={hasFullConfiguration ? {
                        y: -2,
                        scale: 1.01,
                      } : {}}
                      transition={{
                        duration: 0.06,
                        ease: "easeOut"
                      }}
                      whileTap={hasFullConfiguration ? {
                        scale: 0.98,
                        y: 0,
                        transition: {
                          duration: 0.04,
                          ease: "easeOut"
                        }
                      } : {}}
                      style={{
                        boxShadow: hasFullConfiguration ? "0 2px 8px rgba(0,0,0,0.04)" : "none",
                      }}
                    >
                      {/* OS Icon */}
                      <div className={`rounded-sm flex items-center justify-center bg-transparent ${
                        shouldUseCompact 
                          ? 'w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mb-1 sm:mb-2' 
                          : 'w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 mb-2 sm:mb-3'
                      }`}>
                        <motion.div
                          style={{
                            width: '100%',
                            height: '100%',
                            maskImage: `url(/svgs/${icon})`,
                            maskRepeat: 'no-repeat',
                            maskPosition: 'center',
                            maskSize: 'contain',
                          }}
                          animate={{
                            backgroundColor: !hasFullConfiguration
                              ? "#D9D9D9"
                              : os === item.id
                                ? brandColor
                                : "#9CA3AF"
                          }}
                          transition={{
                            duration: 0.2,
                            ease: "easeOut"
                          }}
                          whileHover={hasFullConfiguration ? {
                            scale: 1.05,
                          } : {}}
                        />
                      </div>

{/* OS Name */}
<motion.div
  className={`font-semibold text-center mb-1 leading-tight truncate w-full ${
    shouldUseCompact ? 'text-xs sm:text-xs' : 'text-xs sm:text-sm'
  } ${
    hasFullConfiguration
      ? os === item.id
        ? "text-gray-900 dark:text-white"
        : "text-gray-900 dark:text-gray-400"
      : "text-gray-400 dark:text-gray-500"
  }`}
  transition={{ duration: 0.15 }}
>
  {item.name}
</motion.div>

                      {/* OS Architecture */}
                      <motion.div
                        className={`text-center leading-tight ${
                          shouldUseCompact ? 'text-xs' : 'text-xs'
                        } ${
                          hasFullConfiguration
                            ? os === item.id
                              ? "text-gray-900 dark:text-white"
                              : "text-gray-900 dark:text-white"
                            : "text-gray-400 dark:text-white"
                        }`}
                        transition={{ duration: 0.15 }}
                      >
                        {arch}
                      </motion.div>

                      {/* Category badge for unrecognized OS (optional) */}
                      {item.specs?.category === 'linux' && (
                        <div className={`bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full mt-1 ${
                          shouldUseCompact ? 'text-xs' : 'text-xs'
                        }`}>
                          Other Linux
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </LayoutGroup>
    </section>
  );
}