import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import ServerConfigurationStep from './ConfigureServer/ServerConfigurationStep';
import RegistrationForm from './ConfigureServer/RegistrationForm';
import PaymentStep from './ConfigureServer/PaymentStep';

export default function ConfigureServer({ 
  step: initialStep = 1, 
  setStep: setParentStep,
  isLoggedIn = false,
  isCompact = false
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(initialStep);
  const [configuration, setConfiguration] = useState(null);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(isLoggedIn);
  
  // Update parent component's step if provided
  useEffect(() => {
    if (setParentStep) {
      setParentStep(step);
    }
  }, [step, setParentStep]);
  
  // Check if user is logged in
  useEffect(() => {
    setIsUserLoggedIn(isLoggedIn || !!user);
  }, [isLoggedIn, user]);
  
  const handleStepComplete = (nextStep) => {
    setStep(nextStep);
  };
  
  const handleRegistrationComplete = () => {
    setIsUserLoggedIn(true);
    setStep(3);
  };
  
  const handlePaymentComplete = () => {
    // Redirect to success page or dashboard
    router.push('/');
  };
  
  return (
    <div className={`${isCompact ? 'py-4' : 'py-8'}`}>
      {step === 1 && (
        <ServerConfigurationStep 
          onNext={() => handleStepComplete(2)} 
          setConfiguration={setConfiguration}
          configuration={configuration}
        />
      )}
      
      {step === 2 && !isUserLoggedIn && (
        <RegistrationForm 
          onComplete={handleRegistrationComplete}
          configuration={configuration}
        />
      )}
      
      {(step === 3 || (step === 2 && isUserLoggedIn)) && (
        <PaymentStep 
          configuration={configuration}
          onBack={() => handleStepComplete(1)}
          onComplete={handlePaymentComplete}
          isLoggedIn={isUserLoggedIn}
        />
      )}
    </div>
  );
}