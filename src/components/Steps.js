'use client';

export default function Steps({ currentStep, onStepClick, isLoggedIn = false }) {
  // Conditionally create steps array based on login status
  const allSteps = [
    { name: 'Configure', id: 'configure' },
    { name: 'Login/Register', id: 'auth' },
    { name: 'Payment', id: 'payment' }
  ];
  
  const steps = isLoggedIn 
    ? allSteps.filter(step => step.id !== 'auth')
    : allSteps;
    
  const stepNames = steps.map(step => step.name);
        
  // Calculate progress based on completed steps - adjusted for dynamic step count
  const getProgressWidth = () => {
    if (isLoggedIn) {
      // Only 2 steps: Configure -> Payment
      if (currentStep === 1) return '0%';
      if (currentStep === 2) return '100%';
      return '0%';
    } else {
      // 3 steps: Configure -> Login/Register -> Payment
      if (currentStep === 1) return '0%';
      if (currentStep === 2) return '51%';
      if (currentStep === 3) return '100%';
      return '0%';
    }
  };

  // Map logical step numbers to display step numbers
  const getDisplayStepNumber = (logicalStep) => {
    if (isLoggedIn) {
      // For logged in users: step 1 -> 1, step 3 -> 2
      return logicalStep === 1 ? 1 : 2;
    }
    return logicalStep;
  };

  // Map display step back to logical step for click handling
  const getLogicalStepNumber = (displayIndex) => {
    if (isLoggedIn) {
      // For logged in users: display index 0 -> step 1, display index 1 -> step 3
      return displayIndex === 0 ? 1 : 3;
    }
    return displayIndex + 1;
  };

  return (
    <div className="flex justify-center items-start mb-8 sm:mb-10 lg:mb-12 relative px-4 sm:px-6">
      {/* Container for the progress line - responsive width */}
      <div className="absolute top-6 sm:top-7 lg:top-8 w-full max-w-[200px] sm:max-w-[280px] lg:max-w-[320px] left-1/2 transform -translate-x-1/2 z-0">
        {/* Static background line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gray-200 dark:bg-gray-700" />
                        
        {/* Animated gradient progress line */}
        <div
          className="absolute top-0 left-0 h-px transition-all duration-600 ease-in-out"
          style={{
            background: 'linear-gradient(90deg, #A12BF0 0%, #2E3CD3 100%)',
            width: getProgressWidth()
          }}
        />
      </div>

      {/* Step Indicators - responsive spacing */}
      <div className={`flex items-start justify-center z-20 relative w-full max-w-lg ${
        isLoggedIn ? 'space-x-16 sm:space-x-20 md:space-x-24 lg:space-x-28' : 'space-x-8 sm:space-x-12 md:space-x-16 lg:space-x-20'
      }`}>
        {stepNames.map((label, index) => {
          const logicalStepNumber = getLogicalStepNumber(index);
          const displayStepNumber = getDisplayStepNumber(logicalStepNumber);
          const isActive = currentStep === logicalStepNumber;
          const isComplete = currentStep > logicalStepNumber;
          const isClickable = logicalStepNumber <= currentStep;

          const handleStepClick = () => {
            if (isClickable && onStepClick) {
              onStepClick(logicalStepNumber);
            }
          };

          return (
            <div 
              key={`${label}-${isLoggedIn}`}
              className={`flex flex-col items-center transition-all duration-200 ${
                isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-60'
              }`}
              onClick={handleStepClick}
            >
              {/* Step Label - responsive text */}
              <span
                className={`text-xs sm:text-sm font-medium transition-colors text-center leading-tight ${
                  isActive || isComplete ? 'text-black dark:text-white font-semibold' : 'text-gray-450 dark:text-gray-500'
                } ${isClickable ? 'hover:text-[#A12BF0]' : ''}`}
              >
                {/* Mobile: Show shortened labels */}
                <span className="block sm:hidden">
                  {label === 'Login/Register' ? 'Login' : label}
                </span>
                {/* Desktop: Show full labels */}
                <span className="hidden sm:block">
                  {label}
                </span>
              </span>
              
              {/* Step Indicator Dot */}
              <div className="mt-1.5 sm:mt-2 h-2 flex items-center justify-center">
                <span
                  className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full transition-all duration-200 ${
                    isActive || isComplete
                      ? displayStepNumber === (isLoggedIn ? 2 : 3)
                        ? 'bg-[#2E3CD3]'
                        : 'bg-[#A12BF0]'
                      : 'bg-gray-300 dark:bg-gray-600'
                  } ${isClickable ? 'hover:scale-125' : ''}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}