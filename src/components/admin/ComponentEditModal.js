'use client'
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertCircle, Package, DollarSign, Settings, FileText } from 'lucide-react';
import {
  fadeInUp,
  dropdownVariants,
  buttonHover,
  buttonTap,
  buttonHoverLift,
  smallElementHover,
  cardHover,
  springTransition
} from '@/animations/variants';

export default function ComponentEditModal({
  isOpen,
  onClose,
  component,
  onSave
}) {
  const [formData, setFormData] = useState({
    custom_name: '',
    custom_price: '',
    admin_notes: '',
    sort_order: 0,
    is_enabled: false,
    os_icon: '',
    os_color: '',
    os_category: ''
  });
  const [loading, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('general');
  const [showSuccess, setShowSuccess] = useState(false);

  // Initialize form data when component changes
useEffect(() => {
  if (component) {
    setFormData({
      custom_name: component.custom_name || '',
      custom_price: component.custom_price !== null ? component.custom_price.toString() : '',
      admin_notes: component.admin_notes || '',
      sort_order: component.sort_order || 0,
      is_enabled: component.is_enabled || false,
      // Initialize OS customization from specs
      os_icon: component.specs?.icon || '',
      os_color: component.specs?.brandColor || '',
      os_category: component.specs?.category || ''
    });
    setErrors({});
    setActiveTab('general');
    setShowSuccess(false);
  }
}, [component]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate custom price if provided
    if (formData.custom_price && (isNaN(parseFloat(formData.custom_price)) || parseFloat(formData.custom_price) < 0)) {
      newErrors.custom_price = 'Price must be a valid positive number';
    }

    // Validate sort order
    if (isNaN(parseInt(formData.sort_order))) {
      newErrors.sort_order = 'Sort order must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSave = async () => {
  if (!validateForm()) {
    return;
  }

  setSaving(true);
  
  try {
    // Prepare updates object
    const updates = {
      is_enabled: formData.is_enabled,
      admin_notes: formData.admin_notes || null,
      sort_order: parseInt(formData.sort_order)
    };

    // Only include custom_name if it's different from original
    if (formData.custom_name && formData.custom_name !== component.name) {
      updates.custom_name = formData.custom_name;
    } else if (!formData.custom_name) {
      updates.custom_name = null;
    }

    // Only include custom_price if it's provided and different from base price
    if (formData.custom_price) {
      const customPrice = parseFloat(formData.custom_price);
      if (customPrice !== component.base_price) {
        updates.custom_price = customPrice;
      }
    } else {
      updates.custom_price = null;
    }

    // Include OS customization for operatingSystems type
    if (component.type === 'operatingSystems') {
      const currentSpecs = component.specs || {};
      const updatedSpecs = {
        ...currentSpecs,
        icon: formData.os_icon || currentSpecs.icon,
        brandColor: formData.os_color || currentSpecs.brandColor,
        category: formData.os_category || currentSpecs.category
      };
      updates.specs = JSON.stringify(updatedSpecs);
    }

    await onSave(component.id, updates);
    
    // Show success animation
    setShowSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1000);
    
  } catch (error) {
    console.error('Error saving component:', error);
    setErrors({ general: error.message || 'Failed to save component' });
  } finally {
    setSaving(false);
  }
};

  const availableIcons = [
  { value: 'windowsOS.svg', label: 'Windows', preview: '🪟' },
  { value: 'ubuntuOS.svg', label: 'Ubuntu', preview: '🟠' },
  { value: 'debianOS.svg', label: 'Debian', preview: '🔴' },
  { value: 'centOS.svg', label: 'CentOS', preview: '🟣' },
  { value: 'almalinuxOS.svg', label: 'AlmaLinux', preview: '🔵' },
  { value: 'otherOS.svg', label: 'Other Linux', preview: '🐧' }
];

const availableColors = [
  { value: '#0078D4', label: 'Windows Blue', bg: 'bg-blue-500' },
  { value: '#E95420', label: 'Ubuntu Orange', bg: 'bg-orange-500' },
  { value: '#A81D33', label: 'Debian Red', bg: 'bg-red-600' },
  { value: '#932279', label: 'CentOS Purple', bg: 'bg-purple-600' },
  { value: '#0F4266', label: 'AlmaLinux Navy', bg: 'bg-blue-800' },
  { value: '#8B5CF6', label: 'Linux Purple', bg: 'bg-purple-500' },
  { value: '#6B7280', label: 'Unknown Gray', bg: 'bg-gray-500' }
];

const osCategories = [
  { value: 'windows', label: 'Windows' },
  { value: 'ubuntu', label: 'Ubuntu' },
  { value: 'debian', label: 'Debian' },
  { value: 'centos', label: 'CentOS' },
  { value: 'almalinux', label: 'AlmaLinux' },
  { value: 'linux', label: 'Other Linux' },
  { value: 'other', label: 'Other' }
];

  const formatType = (type) => {
    const typeMap = {
      'cpu': 'CPU',
      'memory': 'Memory',
      'storage': 'Storage',
      'location': 'Location',
      'operatingSystem': 'Operating System'
    };
    return typeMap[type] || type;
  };

  const getTypeIcon = (type) => {
    const iconClass = "w-4 h-4";
    switch (type) {
      case 'cpu': return <Package className={iconClass} />;
      case 'memory': return <Package className={iconClass} />;
      case 'storage': return <Package className={iconClass} />;
      default: return <Package className={iconClass} />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'cpu': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'memory': return 'bg-green-100 text-green-800 border-green-200';
      case 'storage': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'location': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatSpecs = (specs) => {
    if (!specs) return [];

    if (typeof specs === 'string') {
      try {
        specs = JSON.parse(specs);
      } catch {
        return [{ label: 'Raw Data', value: specs }];
      }
    }

    if (typeof specs === 'object') {
      const specItems = [];
      if (specs.cores) specItems.push({ label: 'Cores', value: specs.cores });
      if (specs.threads) specItems.push({ label: 'Threads', value: specs.threads });
      if (specs.size) specItems.push({ label: 'Size', value: `${specs.size}GB` });
      if (specs.count) specItems.push({ label: 'Count', value: specs.count });
      if (specs.type) specItems.push({ label: 'Type', value: specs.type.toUpperCase() });
      if (specs.region) specItems.push({ label: 'Region', value: specs.region });
      if (specs.short) specItems.push({ label: 'Code', value: specs.short });

      return specItems;
    }

    return [];
  };

const tabs = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'pricing', label: 'Pricing', icon: DollarSign },
  { id: 'appearance', label: 'Appearance', icon: Package }, 
  { id: 'notes', label: 'Notes', icon: FileText }
];

  if (!isOpen || !component) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 sm:p-6 lg:p-8">
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Success Overlay */}
                <AnimatePresence>
                  {showSuccess && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={springTransition}
                      className="absolute inset-0 bg-white bg-opacity-95 rounded-2xl flex items-center justify-center z-10"
                    >
                      <motion.div
                        variants={fadeInUp}
                        initial="initial"
                        animate="animate"
                        className="text-center"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.1, ...springTransition }}
                          className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"
                        >
                          <Check className="w-8 h-8 text-green-600" />
                        </motion.div>
                        <p className="text-lg font-medium text-gray-900">Changes saved successfully!</p>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Header */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center justify-between p-6 border-b border-gray-100"
                >
                  <div className="flex items-center space-x-3">
                    <motion.div
                      whileHover={smallElementHover}
                      className={`p-2 rounded-lg border ${getTypeColor(component.type)}`}
                    >
                      {getTypeIcon(component.type)}
                    </motion.div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                        Edit Component
                      </h2>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(component.type)}`}>
                          {formatType(component.type)}
                        </span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-600 font-medium">
                          {component.custom_name || component.name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <motion.button
                    whileHover={buttonHover}
                    whileTap={buttonTap}
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </motion.div>

                {/* Component Info Cards */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-6 border-b border-gray-100 bg-gray-50"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Basic Info */}
                    <motion.div
                      whileHover={cardHover}
                      transition={springTransition}
                      className="bg-white rounded-xl p-4 border border-gray-200"
                    >
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Package className="w-4 h-4 mr-2 text-gray-600" />
                        Component Info
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-500">ID:</span>
                          <span className="ml-2 font-mono text-gray-900">{component.id}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Original Name:</span>
                          <span className="ml-2 text-gray-900">{component.name}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Base Price:</span>
                          <span className="ml-2 font-semibold text-gray-900">${component.base_price}</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Specifications */}
                    <motion.div
                      whileHover={cardHover}
                      transition={springTransition}
                      className="bg-white rounded-xl p-4 border border-gray-200"
                    >
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Settings className="w-4 h-4 mr-2 text-gray-600" />
                        Specifications
                      </h3>
                      <div className="space-y-2 text-sm">
                        {formatSpecs(component.specs).slice(0, 3).map((spec, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + index * 0.05 }}
                          >
                            <span className="text-gray-500">{spec.label}:</span>
                            <span className="ml-2 text-gray-900">{spec.value}</span>
                          </motion.div>
                        ))}
                        {formatSpecs(component.specs).length === 0 && (
                          <span className="text-gray-400 italic">No specifications</span>
                        )}
                      </div>
                    </motion.div>

                    {/* Status */}
                    <motion.div
                      whileHover={cardHover}
                      transition={springTransition}
                      className="bg-white rounded-xl p-4 border border-gray-200"
                    >
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2 text-gray-600" />
                        Status
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <span className="text-gray-500">Availability:</span>
                          <motion.span
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${component.is_available
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                              }`}
                          >
                            {component.is_available ? 'Available' : 'Unavailable'}
                          </motion.span>
                        </div>
                        {/* Show stock info if available */}
                        {component.stock_count !== undefined && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.42 }}
                            className="flex items-center"
                          >
                            <span className="text-gray-500">Stock:</span>
                            <span className={`ml-2 font-semibold ${component.in_stock ? 'text-green-600' : 'text-red-600'}`}>
                              {component.stock_count} {component.in_stock ? '✓' : '✗'}
                            </span>
                          </motion.div>
                        )}
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.45 }}
                          className="flex items-center"
                        >
                          <span className="text-gray-500">User Access:</span>
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${component.is_enabled
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                            }`}>
                            {component.is_enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 }}
                        >
                          <span className="text-gray-500">Last Updated:</span>
                          <span className="ml-2 text-gray-900">
                            {new Date(component.last_updated_at).toLocaleDateString()}
                          </span>
                        </motion.div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Tabs */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="border-b border-gray-200"
                >
                  <nav className="flex space-x-8 px-6" aria-label="Tabs">
                    {tabs.map((tab, index) => {
                      const Icon = tab.icon;
                      return (
                        <motion.button
                          key={tab.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.35 + index * 0.05 }}
                          whileHover={buttonHoverLift}
                          whileTap={buttonTap}
                          onClick={() => setActiveTab(tab.id)}
                          className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center space-x-2 ${activeTab === tab.id
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{tab.label}</span>
                        </motion.button>
                      );
                    })}
                  </nav>
                </motion.div>

                {/* Tab Content */}
                <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
                  <AnimatePresence mode="wait">
                    {/* General Tab */}
                    {activeTab === 'general' && (
                      <motion.div
                        key="general"
                        variants={fadeInUp}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="space-y-6"
                      >
                        {/* Enable/Disable Toggle */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                        >
                          <div className="flex items-center space-x-3">
                            <motion.div
                              whileHover={smallElementHover}
                              className={`p-2 rounded-lg ${component.is_available ? 'bg-green-100' : 'bg-red-100'}`}
                            >
                              <AlertCircle className={`w-4 h-4 ${component.is_available ? 'text-green-600' : 'text-red-600'}`} />
                            </motion.div>
                            <div>
                              <h4 className="font-medium text-gray-900">Enable for Users</h4>
                              <p className="text-sm text-gray-500">
                                {component.is_available
                                  ? 'Allow users to select this component in their configurations'
                                  : `Component is not available ${!component.in_stock ? '(out of stock)' : '(not in DataPacket)'} and cannot be enabled`
                                }
                              </p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.is_enabled}
                              onChange={(e) => handleInputChange('is_enabled', e.target.checked)}
                              disabled={!component.is_available}
                              className="sr-only peer"
                            />
                            <motion.div
                              whileTap={{ scale: 0.95 }}
                              className={`relative w-11 h-6 rounded-full peer transition-colors duration-200 ${component.is_available
                                  ? 'bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300'
                                  : 'bg-gray-100 cursor-not-allowed'
                                }`}
                            >
                              <motion.div
                                animate={{ x: formData.is_enabled ? 20 : 0 }}
                                transition={springTransition}
                                className="absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5"
                              />
                            </motion.div>
                          </label>
                        </motion.div>

                        {/* Custom Name */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Custom Display Name
                          </label>
                          <motion.input
                            whileFocus={{ scale: 1.01 }}
                            type="text"
                            value={formData.custom_name}
                            onChange={(e) => handleInputChange('custom_name', e.target.value)}
                            placeholder={component.name}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          />
                          <p className="text-xs text-gray-500 mt-2 flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Leave empty to use original name: "{component.name}"
                          </p>
                        </motion.div>

                        {/* Sort Order */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sort Order
                          </label>
                          <motion.input
                            whileFocus={{ scale: 1.01 }}
                            type="number"
                            value={formData.sort_order}
                            onChange={(e) => handleInputChange('sort_order', e.target.value)}
                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.sort_order ? 'border-red-300 bg-red-50' : 'border-gray-300'
                              }`}
                          />
                          <AnimatePresence>
                            {errors.sort_order && (
                              <motion.p
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="text-xs text-red-600 mt-2 flex items-center"
                              >
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {errors.sort_order}
                              </motion.p>
                            )}
                          </AnimatePresence>
                          <p className="text-xs text-gray-500 mt-2">
                            Lower numbers appear first. Default is 0.
                          </p>
                        </motion.div>
                      </motion.div>
                    )}

                    {/* Pricing Tab */}
                    {activeTab === 'pricing' && (
                      <motion.div
                        key="pricing"
                        variants={fadeInUp}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="space-y-6"
                      >
                        {/* Price Comparison */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            whileHover={cardHover}
                            className="bg-gray-50 rounded-xl p-4"
                          >
                            <h4 className="font-medium text-gray-900 mb-2">Base Price</h4>
                            <p className="text-2xl font-bold text-gray-900">${component.base_price}</p>
                            <p className="text-sm text-gray-500">From DataPacket API</p>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            whileHover={cardHover}
                            className="bg-blue-50 rounded-xl p-4"
                          >
                            <h4 className="font-medium text-gray-900 mb-2">Current Price</h4>
                            <motion.p
                              key={formData.custom_price}
                              initial={{ scale: 0.9 }}
                              animate={{ scale: 1 }}
                              transition={springTransition}
                              className="text-2xl font-bold text-blue-600"
                            >
                              ${(formData.custom_price ? parseFloat(formData.custom_price) : component.base_price)}
                            </motion.p>
                            <p className="text-sm text-gray-500">
                              {formData.custom_price ? 'Custom price' : 'Using base price'}
                            </p>
                          </motion.div>
                        </div>

                        {/* Custom Price */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Custom Price
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <DollarSign className="w-4 h-4 text-gray-400" />
                            </div>
                            <motion.input
                              whileFocus={{ scale: 1.01 }}
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.custom_price}
                              onChange={(e) => handleInputChange('custom_price', e.target.value)}
                              placeholder={component.base_price}
                              className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.custom_price ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                            />
                          </div>
                          <AnimatePresence>
                            {errors.custom_price && (
                              <motion.p
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="text-xs text-red-600 mt-2 flex items-center"
                              >
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {errors.custom_price}
                              </motion.p>
                            )}
                          </AnimatePresence>
                          <p className="text-xs text-gray-500 mt-2">
                            Leave empty to use base price (${component.base_price})
                          </p>
                        </motion.div>
                      </motion.div>
                    )}

                    {/* Notes Tab */}
                    {activeTab === 'notes' && (
                      <motion.div
                        key="notes"
                        variants={fadeInUp}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                      >
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Admin Notes
                        </label>
                        <motion.textarea
                          whileFocus={{ scale: 1.01 }}
                          value={formData.admin_notes}
                          onChange={(e) => handleInputChange('admin_notes', e.target.value)}
                          placeholder="Internal notes about this component..."
                          rows={6}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          These notes are only visible to administrators and will not be shown to users.
                        </p>
                      </motion.div>
                    )}

                    {/* Appearance Tab - Only show for Operating Systems */}
{activeTab === 'appearance' && component.type === 'operatingSystems' && (
  <motion.div 
    key="appearance"
    variants={fadeInUp}
    initial="initial"
    animate="animate"
    exit="exit"
    className="space-y-6"
  >
    {/* Icon Selection */}
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Icon Selection
      </label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {availableIcons.map((icon) => (
          <motion.button
            key={icon.value}
            type="button"
            whileHover={cardHover}
            whileTap={buttonTap}
            onClick={() => handleInputChange('os_icon', icon.value)}
            className={`p-4 border-2 rounded-xl transition-all duration-200 ${
              formData.os_icon === icon.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-2xl mb-2">{icon.preview}</div>
            <div className="text-sm font-medium text-gray-900">{icon.label}</div>
            <div className="text-xs text-gray-500">{icon.value}</div>
          </motion.button>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Current: {formData.os_icon || component.specs?.icon || 'otherOS.svg'}
      </p>
    </motion.div>

    {/* Color Selection */}
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Brand Color
      </label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {availableColors.map((color) => (
          <motion.button
            key={color.value}
            type="button"
            whileHover={cardHover}
            whileTap={buttonTap}
            onClick={() => handleInputChange('os_color', color.value)}
            className={`p-3 border-2 rounded-xl transition-all duration-200 ${
              formData.os_color === color.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className={`w-8 h-8 ${color.bg} rounded-full mx-auto mb-2`}></div>
            <div className="text-xs font-medium text-gray-900">{color.label}</div>
            <div className="text-xs text-gray-500 font-mono">{color.value}</div>
          </motion.button>
        ))}
      </div>
      <div className="mt-3">
        <input
          type="color"
          value={formData.os_color || component.specs?.brandColor || '#6B7280'}
          onChange={(e) => handleInputChange('os_color', e.target.value)}
          className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
        />
        <p className="text-xs text-gray-500 mt-1">
          Or choose a custom color
        </p>
      </div>
    </motion.div>

    {/* Category Selection */}
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <label className="block text-sm font-medium text-gray-700 mb-2">
        OS Category
      </label>
      <select
        value={formData.os_category}
        onChange={(e) => handleInputChange('os_category', e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">Select category...</option>
        {osCategories.map((category) => (
          <option key={category.value} value={category.value}>
            {category.label}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500 mt-2">
        Used for grouping and filtering operating systems
      </p>
    </motion.div>

    {/* Preview */}
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-gray-50 rounded-xl p-4"
    >
      <h4 className="font-medium text-gray-900 mb-3">Preview</h4>
      <div 
        className="inline-flex items-center px-3 py-2 rounded-lg border"
        style={{ 
          backgroundColor: `${formData.os_color || component.specs?.brandColor || '#6B7280'}15`,
          borderColor: formData.os_color || component.specs?.brandColor || '#6B7280',
          color: formData.os_color || component.specs?.brandColor || '#6B7280'
        }}
      >
        <Package className="w-4 h-4 mr-2" />
        <span className="text-sm font-medium">
          {formData.custom_name || component.name}
        </span>
      </div>
    </motion.div>
  </motion.div>
)}

{/* For non-OS components, show message */}
{activeTab === 'appearance' && component.type !== 'operatingSystems' && (
  <motion.div 
    key="appearance-not-os"
    variants={fadeInUp}
    initial="initial"
    animate="animate"
    exit="exit"
    className="text-center py-8"
  >
    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <p className="text-gray-500">Appearance customization is only available for Operating Systems.</p>
  </motion.div>
)}
                  </AnimatePresence>
                </div>

                {/* Error Display */}
                <AnimatePresence>
                  {errors.general && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="mx-6 mb-6 bg-red-50 border border-red-200 rounded-xl p-4"
                    >
                      <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                        <span className="text-sm text-red-600">{errors.general}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex justify-between items-center p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl"
                >
                  <div className="text-sm text-gray-500">
                    Changes will be saved immediately
                  </div>
                  <div className="flex space-x-3">
                    <motion.button
                      whileHover={buttonHover}
                      whileTap={buttonTap}
                      onClick={onClose}
                      disabled={loading}
                      className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-all duration-200"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={!loading ? buttonHover : {}}
                      whileTap={!loading ? buttonTap : {}}
                      onClick={handleSave}
                      disabled={loading}
                      className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 flex items-center space-x-2"
                    >
                      <AnimatePresence mode="wait">
                        {loading ? (
                          <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center space-x-2"
                          >
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                            />
                            <span>Saving...</span>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="save"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center space-x-2"
                          >
                            <Check className="w-4 h-4" />
                            <span>Save Changes</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}