'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const menuItems = [
    { name: 'Home', href: '/' },
    { name: 'Get Started', href: '#', hasDropdown: true },
    { name: 'Admin Login', href: '/admin-login' },
    { name: 'History', href: '/history' },
    { name: 'FAQs', href: '/questions' },
    { name: 'About', href: '/about' },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu when clicking on a link
  const closeMobileMenu = () => {
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
  };

  return (
    <nav className="bg-oyoGreen text-oyoWhite shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold hover:text-oyoOrange transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-oyoOrange focus:ring-offset-2 focus:ring-offset-oyoGreen rounded">
              Oyo Pension Verification
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-1">
              {menuItems.map((item) => (
                item.hasDropdown ? (
                  <div key={item.name} className="relative" ref={dropdownRef}>
                    <button
                      ref={buttonRef}
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      onMouseEnter={() => setIsDropdownOpen(true)}
                      // onMouseLeave={() => setIsDropdownOpen(false)}
                      className="px-3 py-2 rounded-md text-sm font-medium hover:text-oyoOrange hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-oyoOrange focus:ring-offset-2 focus:ring-offset-oyoGreen"
                      aria-expanded={isDropdownOpen}
                      aria-haspopup="true"
                    >
                      {item.name}
                      <svg 
                        className={`ml-1 inline-block w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* Dropdown Menu */}
                    <div 
                      className={`absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 transition-all duration-200 ${
                        isDropdownOpen 
                          ? 'opacity-100 visible translate-y-0' 
                          : 'opacity-0 invisible -translate-y-2'
                      }`}
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="get-started-button"
                    >
                      <div className="py-1">
                        <Link
                          href="/pensioner/login"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-oyoGreen hover:text-oyoWhite transition-colors duration-200"
                          role="menuitem"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Pensioner Login
                        </Link>
                        <Link
                          href="/register"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-oyoGreen hover:text-oyoWhite transition-colors duration-200"
                          role="menuitem"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Pensioner Register
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="px-3 py-2 rounded-md text-sm font-medium hover:text-oyoOrange hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-oyoOrange focus:ring-offset-2 focus:ring-offset-oyoGreen"
                  >
                    {item.name}
                  </Link>
                )
              ))}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-oyoWhite hover:text-oyoOrange hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-oyoOrange transition-all duration-200"
              aria-expanded={isMenuOpen}
              aria-label="Toggle navigation menu"
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div 
        className={`md:hidden transition-all duration-300 ease-in-out ${
          isMenuOpen 
            ? 'max-h-96 opacity-100 visible' 
            : 'max-h-0 opacity-0 invisible'
        }`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-oyoGreen/95 backdrop-blur-sm">
          {menuItems.map((item) => (
            item.hasDropdown ? (
              <div key={item.name}>
                <div className="px-3 py-2 text-base font-medium text-oyoWhite/80">
                  {item.name}
                </div>
                <div className="pl-6 space-y-1">
                  <Link
                    href="/pensioner/login"
                    className="block px-3 py-2 rounded-md text-base font-medium text-oyoWhite hover:text-oyoOrange hover:bg-white/10 transition-all duration-200"
                    onClick={closeMobileMenu}
                  >
                    Pensioner Login
                  </Link>
                  <Link
                    href="/register"
                    className="block px-3 py-2 rounded-md text-base font-medium text-oyoWhite hover:text-oyoOrange hover:bg-white/10 transition-all duration-200"
                    onClick={closeMobileMenu}
                  >
                    Pensioner Register
                  </Link>
                </div>
              </div>
            ) : (
              <Link
                key={item.name}
                href={item.href}
                className="block px-3 py-2 rounded-md text-base font-medium text-oyoWhite hover:text-oyoOrange hover:bg-white/10 transition-all duration-200"
                onClick={closeMobileMenu}
              >
                {item.name}
              </Link>
            )
          ))}
        </div>
      </div>
    </nav>
  );
}
