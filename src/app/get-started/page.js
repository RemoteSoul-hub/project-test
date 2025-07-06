'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Settings, Layers, Grid, ChevronLeft } from 'lucide-react';
import Steps from '@/components/Steps';
import OffersTabs from '@/components/OffersTabs';
import ConfigureServer from '@/components/offers/ConfigureServer';
import TailoredSolution from '@/components/offers/TailoredSolution';
import VpsInfrastructurePlatform from '@/components/offers/VpsInfrastructurePlatform';
import { useAuth } from '@/components/providers/AuthProvider';
import { isImpersonating, getImpersonatedUser, getUser } from '@/services/AuthService';

export default function ServiceSelectionScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceParam = searchParams.get('service'); 
  
  const [hoveredCard, setHoveredCard] = useState(null);
  const [step, setStep] = useState(1);
  const { user } = useAuth();

  // Check if user is authenticated
  const isUserLoggedIn = () => {
    try {
      // Check if impersonating or regular user exists
      if (isImpersonating()) {
        const impersonatedUser = getImpersonatedUser();
        return !!impersonatedUser;
      } else {
        const regularUser = getUser();
        return !!regularUser;
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      // Fallback to AuthProvider user
      return !!user;
    }
  };

  const services = [
    {
      id: 'server',
      slug: 'server-configuration',
      title: 'Server',
      subtitle: 'Configuration',
      description: '24 hr setup. Customise up to 64 cores / 512 GB RAM / 10 TB disk and more.',
      buttonText: 'Start Configuring Server',
      icon: Settings,
      tabName: 'configure',
      position: 'left'
    },
    {
      id: 'tailored',
      slug: 'tailored-solutions',
      title: 'Tailored',
      subtitle: 'Solutions',
      description: 'Live Trading Servers, Cloud, Managed Services, and much more.',
      buttonText: 'Request Custom Solution',
      icon: Layers,
      tabName: 'tailored',
      position: 'center'
    },
    {
      id: 'vps',
      slug: 'vps-infrastructure',
      title: 'VPS',
      subtitle: 'Infrastructure',
      description: 'Extensive API library and bespoke VPS solutions for your business use‑case.',
      buttonText: 'Enquire Today',
      icon: Grid,
      tabName: 'vps',
      position: 'right'
    }
  ];

  // Map service params to tab names
  const serviceToTabMap = {
    'server-configuration': 'configure',
    'tailored-solutions': 'tailored', 
    'vps-infrastructure': 'vps'
  };

  // Map tab names to service params
  const tabToServiceMap = {
    'configure': 'server-configuration',
    'tailored': 'tailored-solutions',
    'vps': 'vps-infrastructure'
  };

  // Get active tab from URL param
  const activeTab = serviceParam ? serviceToTabMap[serviceParam] || 'configure' : null;
  const selectedService = serviceParam;

  const handleServiceSelect = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      const serviceParam = tabToServiceMap[service.tabName];
      router.push(`/get-started?service=${serviceParam}`);
    }
  };

  const handleGoBack = () => {
    router.push('/get-started');
  };

  const getCopy = (isCompact = false) => {
    switch (activeTab) {
      case 'configure':
        return {
          title: isCompact ? (
            <>Configure Server</>
          ) : (
            <>
              Server <span className="text-gradient">Configuration</span>
            </>
          ),
          description: isCompact ? null : (
            <>
              Dedicated servers backed by overprovisioned network. Unlimited data transfer,{" "}
              <span className="hidden md:inline"><br /></span>
              unshared 1×10GE — 2×100GE ports, unmetered DDoS protection and no commitment.
            </>
          ),
        };
      case 'tailored':
        return {
          title: isCompact ? (
            <>Tailored Solutions</>
          ) : (
            <>
              Let's build <span className="text-gradient">your Infrastructure</span>
            </>
          ),
          description: isCompact ? null : (
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
          title: isCompact ? (
            <>VPS Infrastructure</>
          ) : (
            <>
              Effortlessly offer VPS to <span className="text-gradient">Your End-Users</span>
            </>
          ),
          description: isCompact ? null : (
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

  const { title, description } = getCopy(true); // Always use compact mode for now

  // If a service is selected, show the full page layout
  if (selectedService && activeTab) {
    return (
      <>
        {/* Hero Section */}
        <div className="light relative min-h-[200px] overflow-hidden bg-primary-light dark:bg-primary-dark">
          <div className="relative z-10 w-full">
            <div className="px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-[1600px] mx-auto py-2">
              {/* Back button */}
              <button
                onClick={handleGoBack}
                className="flex gap-2 justify-center items-center px-4 py-2 rounded hover:bg-gray-50 transition-colors text-base font-semibold"
              >
                <ChevronLeft size={14}/> <span>Back</span>
              </button>
            </div>
            <div className="px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-6xl mx-auto text-left">
              
              <h1 className="mt-6 lg:mt-8 text-2xl md:text-3xl 
                            font-haas text-gradient font-medium leading-tight tracking-normal
                            animate-fade-in animate-slide-in-from-bottom animate-duration-500">
                1. {title}
              </h1>
              
              {description && (
                <p className="mt-3 md:mt-4 mb-12 sm:mb-16 lg:mb-20 
                              text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl
                              leading-relaxed text-text-light dark:text-text-dark
                              max-w-5xl mx-auto
                              animate-fade-in animate-slide-in-from-bottom animate-duration-500 animate-delay-150">
                  {description}
                </p>
              )}
            </div>

            {/* Steps Component - Only for Configure Server tab */}
            {activeTab === 'configure' && (
              <div className="px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-[1600px] mx-auto
                            animate-fade-in animate-slide-in-from-bottom animate-duration-500 animate-delay-300">
                <Steps currentStep={step} onStepClick={setStep} isLoggedIn={true} />
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
                    isLoggedIn={isUserLoggedIn()}
                    isCompact={true}
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

  // Render the selection screen (your original cards layout)
  return (
    <div className="h-[calc(100vh-130px)] flex items-center justify-center px-0 relative overflow-hidden">
      {/* Blue Glow Background with transparency fade */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div 
          className="absolute w-[700px] h-[700px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(52, 71, 237, 0.8) 0%, rgba(52, 71, 237, 0.4) 30%, rgba(52, 71, 237, 0.1) 60%, transparent 100%)',
            filter: 'blur(40px)'
          }}
        />
          <img 
            src="/svgs/BGGrid.svg" 
            alt="" 
            className="w-full h-full object-cover"
            />
      </div>
      
      <div className="w-full max-w-6xl mx-auto relative z-10">
        <div className="grid gap-4 p-4 box-border 
                        grid-cols-1 
                        sm:grid-cols-2 
                        lg:grid-cols-3">
        
        {services.map((service, index) => {
          const IconComponent = service.icon;
          const isHovered = hoveredCard === service.id;
          
          // Mobile ordering: center first, right second, left third
          const mobileOrder = service.position === 'center' ? 'order-1' : 
                             service.position === 'right' ? 'order-2' : 'order-3';
          
          return (
            <div
              key={service.id}
              className={`
                relative flex flex-col justify-between gap-1.5 rounded 
                p-7 overflow-hidden text-white cursor-pointer
                transition-all duration-700 ease-out
                ${mobileOrder} sm:order-none
                ${service.position === 'left' ? `
                  bg-black bg-opacity-20
                  bg-gradient-to-br from-[rgba(1,3,20,0.7)] to-[rgba(6,18,122,0.7)]
                ` : ''}
                ${service.position === 'center' ? `
                  bg-black bg-opacity-20
                  bg-gradient-to-b from-[rgba(1,3,20,0.3)] to-[rgba(6,18,122,0.5)]
                  border border-gray-400
                ` : ''}
                ${service.position === 'right' ? `
                  bg-black bg-opacity-20
                  bg-gradient-to-tl from-[rgba(1,3,20,0.7)] to-[rgba(6,18,122,0.7)]
                ` : ''}
              `}
              onClick={() => handleServiceSelect(service.id)}
              onMouseEnter={() => setHoveredCard(service.id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                letterSpacing: '-0.011em'
              }}
            >
              {/* Hover overlay */}
              <div 
                className={`
                  absolute inset-0 rounded transition-opacity duration-700 ease-out pointer-events-none
                  ${isHovered ? 'opacity-100' : 'opacity-0'}
                  ${service.position === 'left' ? `
                    bg-gradient-to-br from-[rgba(1,3,20,0.9)] to-[rgba(52,71,237,0.9)]
                    shadow-[0_4px_20px_rgba(255,255,255,0.25)]
                  ` : ''}
                  ${service.position === 'center' ? `
                    bg-gradient-to-b from-[rgba(1,3,20,0.3)] to-[rgba(52,71,237,0.9)]
                    shadow-[0_4px_20px_rgba(255,255,255,0.15)]
                  ` : ''}
                  ${service.position === 'right' ? `
                    bg-gradient-to-br from-[rgba(1,3,20,0.9)] via-transparent to-[rgba(52,71,237,0.9)]
                    shadow-[0_4px_20px_rgba(255,255,255,0.25)]
                  ` : ''}
                `}
              />
              {/* Content */}
              <div className="relative z-10">
                {/* Icon */}
                <IconComponent size={40} className="mb-4 block" />
                
                {/* Title */}
                <h2 className="mb-4 text-white text-2xl font-medium leading-tight">
                  {service.title}{' '}
                  <span className="block bg-gradient-to-r from-gray-300 to-white bg-clip-text text-transparent">
                    {service.subtitle}
                  </span>
                </h2>
                
                {/* Description */}
                <p className="mb-6 text-gray-300 flex-1 md:text-lg md:leading-relaxed md:w-4/5">
                  {service.description}
                </p>
              </div>
              
              {/* CTA */}
              <div className="relative z-10">
                <div className="text-base leading-tight font-medium capitalize flex items-center gap-2 text-white hover:text-gray-200 transition-colors">
                  {service.buttonText}
                  <span className="font-light">→</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
  );
}