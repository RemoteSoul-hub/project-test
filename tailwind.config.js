/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', 
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-offer': 'linear-gradient(90deg, #A12BF0 11%, #3241E7 47%, #2E3CD3 99%)',
      },
      colors: {
        primary: {
          light: '#f2f2f2',
          dark: '#010314',
        },
        text: {
          light: '#17181E',
          dark: '#ffffff',
        },
        neutral: {
          50: '#FAFAFA',
          900: '#111827',
        },
        gray: {
          450: '#878787',
        },
        active: {
          light: '#1F69FE',
          dark: '#ffffff'
        },
        blue: {
          cta: '#1F69FE',
        },
        slate: {
          DEFAULT: '#17181E',
          dark: '#232436'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        haas: ['"NeueHaasDisplay"', 'sans-serif'],
      },
      maxWidth: {
        '8xl': '1400px',
      },
      boxShadow: {
        'blue-glow': '0 0 4px #1F69FE',
      },
      borderRadius: {
        'sd': '4px',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
