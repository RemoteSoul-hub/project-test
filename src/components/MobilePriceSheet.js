import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, ShoppingCart } from 'lucide-react';
import { 
  fadeInUp, 
  dropdownVariants, 
  buttonHover, 
  buttonTap, 
  buttonHoverLift,
  smallElementHover,
  smallElementTap,
  springTransition 
} from '@/animations/variants';

const MobilePriceSheet = ({ 
  pricing, 
  currency, 
  currencies, 
  setCurrency, 
  hasFullConfiguration, 
  onContinue  
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const sheetVariants = {
    hidden: { 
      y: "100%",
      opacity: 0 
    },
    visible: { 
      y: 0,
      opacity: 1,
      transition: springTransition
    },
    exit: {
      y: "100%",
      opacity: 0,
      transition: {
        duration: 0.2
      }
    }
  };

  const floatingButtonVariants = {
    hidden: { y: 100, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: springTransition
    }
  };

  const handleContinue = () => {
    if (hasFullConfiguration && onContinue) {
      onContinue();
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Floating Price Button - Mobile Only */}
      <motion.div
        className="fixed bottom-4 right-4 z-30 xl:hidden"
        variants={floatingButtonVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.button
          onClick={() => setIsOpen(true)}
          className={`bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg flex items-center space-x-2 ${
            hasFullConfiguration ? 'hover:bg-blue-700' : 'opacity-60'
          }`}
          whileHover={buttonHoverLift}
          whileTap={buttonTap}
          transition={springTransition}
        >
          <ShoppingCart size={20} />
          <span className="font-semibold">
            {currency.symbol}{(pricing.total * currency.rate).toFixed(2)}/mo
          </span>
        </motion.button>
      </motion.div>

      {/* Bottom Sheet Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 xl:hidden"
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Bottom Sheet */}
            <motion.div
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-dark rounded-t-2xl z-50 xl:hidden"
              variants={sheetVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(event, info) => {
                if (info.offset.y > 100) {
                  setIsOpen(false);
                }
              }}
            >
              {/* Handle */}
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-4"></div>

              {/* Header */}
              <motion.div 
                className="flex items-center justify-between px-6 pb-4 border-b border-gray-300 dark:border-gray-450"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.1 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-text-dark">
                  Server Price
                </h3>
                <motion.button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                  whileHover={smallElementHover}
                  whileTap={smallElementTap}
                  transition={springTransition}
                >
                  <X size={20} className="text-gray-500" />
                </motion.button>
              </motion.div>

              {/* Content */}
              <motion.div 
                className="px-6 py-6 space-y-6"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.2 }}
              >
                {/* Currency Selector */}
                <motion.div 
                  className="grid grid-cols-3 border border-gray-300 dark:border-gray-100 rounded overflow-hidden"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, ...springTransition }}
                >
                  {currencies.map((cur, i) => (
                    <motion.button
                      key={cur.id}
                      onClick={() => setCurrency(cur)}
                      className={`px-4 py-3 text-sm font-semibold text-center transition-colors ${
                        currency.id === cur.id
                          ? "text-blue-600 bg-white dark:bg-transparent shadow-[inset_0_0_0_2px_#3b82f6]"
                          : "text-black dark:text-text-dark bg-gray-50 dark:bg-transparent"
                      } ${i !== 0 ? "border-l border-gray-300 dark:border-gray-100" : ""}`}
                      whileHover={buttonHover}
                      whileTap={buttonTap}
                      transition={springTransition}
                    >
                      {cur.label}
                    </motion.button>
                  ))}
                </motion.div>

                {/* Price Display */}
                <motion.div 
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <motion.div
                    className="text-4xl font-bold text-gray-900 dark:text-text-dark mb-2"
                    key={pricing.total}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={springTransition}
                  >
                    {currency.symbol}
                    {(pricing.total * currency.rate).toFixed(2)}
                    <span className="text-lg font-normal text-gray-500 dark:text-text-dark">/mo</span>
                  </motion.div>
                  
                  {/* Security Notice */}
                  <motion.p 
                    className="text-xs text-gray-500 dark:text-gray-450 flex items-center justify-center space-x-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Lock size={12} />
                    <span>Payments are secure and encrypted</span>
                  </motion.p>
                </motion.div>

                {/* Continue Button */}
                <motion.button
                  disabled={!hasFullConfiguration}
                  onClick={handleContinue}
                  className={`w-full py-4 px-6 rounded-lg font-semibold text-base transition-all ${
                    hasFullConfiguration
                      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                  whileHover={hasFullConfiguration ? buttonHoverLift : {}}
                  whileTap={hasFullConfiguration ? buttonTap : {}}
                  transition={springTransition}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    transition: { delay: 0.6 }
                  }}
                >
                  {hasFullConfiguration ? "Continue" : "Complete Configuration First"}
                </motion.button>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobilePriceSheet;