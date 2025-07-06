'use client';
import clsx from 'clsx';

const tabs = [
  { id: 'configure', label: 'Configure Server', shortLabel: 'Configure' },
  { id: 'tailored', label: 'Tailored Solution', shortLabel: 'Tailored' },
  { id: 'vps', label: 'VPS Infrastructure Platform', shortLabel: 'VPS Platform' },
];

export default function OffersTabs({ active, onChange }) {
  return (
    <div className="w-full max-w-full mb-6">
      {/* Mobile: Vertical tabs with full labels */}
      <div className="sm:hidden space-y-2 px-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'w-full px-6 py-3 rounded-xl transition-all duration-300 text-sm font-medium',
              active === tab.id
                ? 'text-white bg-gradient-to-t from-[#A12BF0] via-[#3241E7] to-[#2E3CD3] shadow-lg'
                : 'text-gray-800 dark:text-gray-200 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/50 dark:hover:bg-gray-700/50'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tablet: Horizontal with short labels */}
      <div className="hidden sm:flex md:hidden items-center justify-center">
        <div 
          className="inline-flex items-center space-x-2 backdrop-blur-sm px-1 py-1 rounded-full text-sm font-medium text-gray-800 dark:text-gray-200 shadow-sm"
          style={{ backgroundColor: 'rgba(195, 195, 195, 0.3)' }}
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={clsx(
                'relative px-3 py-2 rounded-full transition-all duration-300 whitespace-nowrap',
                active === tab.id
                  ? 'text-white bg-gradient-to-t from-[#A12BF0] via-[#3241E7] to-[#2E3CD3] shadow-sm'
                  : 'text-gray-800 dark:text-gray-200 hover:bg-white/20 dark:hover:bg-gray-700/20'
              )}
            >
              {tab.shortLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: Horizontal with full labels */}
      <div className="hidden md:flex items-center justify-center">
        <div 
          className="inline-flex items-center space-x-4 backdrop-blur-sm px-1 py-1 rounded-full text-sm font-medium text-gray-800 dark:text-gray-200 shadow-sm"
          style={{ backgroundColor: 'rgba(195, 195, 195, 0.3)' }}
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={clsx(
                'relative px-4 py-2 rounded-full transition-all duration-300 whitespace-nowrap',
                active === tab.id
                  ? 'text-white bg-gradient-to-t from-[#A12BF0] via-[#3241E7] to-[#2E3CD3] shadow-sm'
                  : 'text-gray-800 dark:text-gray-200 hover:bg-white/20 dark:hover:bg-gray-700/20'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}