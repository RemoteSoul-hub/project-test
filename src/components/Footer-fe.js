import Link from 'next/link';
import Image from 'next/image';
import Logo from '@/assets/images/thinkhuge-logo.svg';

const Footer = () => {
  return (
    <footer className="mt-16 pt-12 pb-8 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-6">
              <Image
                src={Logo}
                alt="ThinkHuge Logo"
                width={180}
                height={40}
                priority
                className="transition-all dark:invert w-32 h-auto sm:w-44 md:w-48"
              />
            </div>
            <div className="text-base text-text-light dark:text-text-dark space-y-1">
              <p>26th Floor, Beautiful Group Tower,</p>
              <p>77 Connaught Road Central,</p>
              <p>Central Hong Kong</p>
            </div>
          </div>

          {/* Products */}
          <div className="lg:col-span-1">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Products</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/forexvps" className="text-base text-text-light dark:text-text-dark hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  ForexVPS
                </Link>
              </li>
              <li>
                <Link href="/fxvm" className="text-base text-text-light dark:text-text-dark hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  FXVM
                </Link>
              </li>
              <li>
                <Link href="/algobuilder" className="text-base text-text-light dark:text-text-dark hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Algobuilder
                </Link>
              </li>
              <li>
                <Link href="/pingplayers" className="text-base text-text-light dark:text-text-dark hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  PingPlayers
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="lg:col-span-1">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-base text-text-light dark:text-text-dark hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  About us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-base text-text-light dark:text-text-dark hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Contact us
                </Link>
              </li>
              <li>
                <Link href="/linkedin" className="text-base text-text-light dark:text-text-dark hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Linkedin
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-base text-text-light dark:text-text-dark hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Privacy / Terms of service
                </Link>
              </li>
            </ul>
          </div>

          {/* Certifications & Copyright */}
          <div className="lg:col-span-1 flex flex-col justify-end items-end h-full">
            <div className="flex flex-wrap gap-4 mb-6 justify-end">
              {/* ISO Certification Logos */}
              <div className="flex items-center justify-center">
                <Image
                  src="/assets/images/afaq-9001.png"
                  alt="ISO 9001 Certification"
                  width={64}
                  height={48}
                  className="object-contain dark:invert transition-all duration-300"
                />
              </div>
              <div className="flex items-center justify-center">
                <Image
                  src="/assets/images/afaq-27001.png"
                  alt="ISO 27001 Certification"
                  width={64}
                  height={48}
                  className="object-contain dark:invert transition-all duration-300"
                />
              </div>
            </div>
            <div className="text-base text-text-light dark:text-text-dark text-right">
              Copyright © 2013—2025 ThinkHuge Ltd.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;