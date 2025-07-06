'use client';
import { useState, useEffect } from 'react';
import MarketingHeader from '@/components/MarketingHeader';
import Steps from '@/components/Steps';
import OffersTabs from '@/components/OffersTabs';
import ConfigureServer from '@/components/offers/ConfigureServer';
import TailoredSolution from '@/components/offers/TailoredSolution';
import VpsInfrastructurePlatform from '@/components/offers/VpsInfrastructurePlatform';

export default function ControlPanelPage() {
  const [activeTab, setActiveTab] = useState('configure');
  const [step, setStep] = useState(1);

  // No need to manage component-level configuration state - child handles everything

  const getCopy = () => {
    switch (activeTab) {
      case 'configure':
        return {
          title: (
            <>
              Server <span className="text-gradient">Configuration</span>
            </>
          ),
          description: (
            <>
              Dedicated servers backed by overprovisioned network. Unlimited data transfer,{" "}
              <span className="hidden md:inline"><br /></span>
              unshared 1×10GE — 2×100GE ports, unmetered DDoS protection and no commitment.
            </>
          ),
        };
      case 'tailored':
        return {
          title: (
            <>
              Let's build <span className="text-gradient">your Infrastructure</span>
            </>
          ),
          description: (
            <>
              Provide detailed information about your project to help us understand your{" "}
              <span className="hidden md:inline"><br /></span>
              requirements. We'll get back to you with a tailored proposal{" "}
              <span className="text-active-light font-medium">within 1 working day</span>.
            </>
          ),
        };
      case 'vps':
        return {
          title: (
            <>
              Effortlessly offer VPS to <span className="text-gradient">Your End-Users</span>
            </>
          ),
          description: (
            <>
              Provide detailed information about your project to help us understand your{" "}
              <span className="hidden md:inline"><br /></span>
              requirements. We'll get back to you with a tailored proposal within 1 working day.
            </>
          ),
        };
      default:
        return { title: null, description: null };
    }
  };

  const { title, description } = getCopy();

  return (
    <>
      {/* Hero Section */}
      <div className="relative min-h-[200px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat block dark:hidden transition-opacity duration-500"
          style={{ backgroundImage: "url('/bg/header-light.svg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-[#f2f2f2]/30 to-[#f2f2f2] dark:hidden" />
        
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat hidden dark:block opacity-80 transition-opacity duration-500"
          style={{ backgroundImage: "url('/bg/header-dark.svg')" }}
        />

        <div className="relative z-10 w-full">
          <div className="px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-[1600px] mx-auto py-4 lg:py-6">
            <MarketingHeader />
          </div>

          <div className="px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-6xl mx-auto text-center">
            <div className="transition-all duration-300 ease-out">
              <OffersTabs active={activeTab} onChange={setActiveTab} />
            </div>
            
            <h1 className="mt-6 lg:mt-8 text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 
                          font-haas font-medium leading-tight tracking-normal
                          animate-fade-in animate-slide-in-from-bottom animate-duration-500">
              {title}
            </h1>
            

            <p className="mt-3 md:mt-4 mb-12 sm:mb-16 lg:mb-20 
                          text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl
                          leading-relaxed text-text-light dark:text-text-dark
                          max-w-5xl mx-auto
                          animate-fade-in animate-slide-in-from-bottom animate-duration-500 animate-delay-150">
              {description}
            </p>
          </div>

          {/* Steps Component - Only for Configure Server tab */}
          {activeTab === 'configure' && (
            <div className="px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-[1600px] mx-auto
                          animate-fade-in animate-slide-in-from-bottom animate-duration-500 animate-delay-300">
              <Steps currentStep={step} onStepClick={setStep} />
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-primary-light dark:bg-primary-dark transition-colors duration-300">
        <div className="w-full max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 pb-16 sm:pb-20 lg:pb-24">
          <div className="transition-all duration-500 ease-out">
            {activeTab === 'configure' && (
              <div className="animate-in fade-in slide-in-from-bottom duration-500">
                <ConfigureServer
                  step={step}
                  setStep={setStep}
                />
              </div>
            )}
            
            {activeTab === 'tailored' && (
              <div className="animate-in fade-in slide-in-from-bottom duration-500">
                <TailoredSolution />
              </div>
            )}
            
            {activeTab === 'vps' && (
              <div className="animate-in fade-in slide-in-from-bottom duration-500">
                <VpsInfrastructurePlatform />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}