'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGetStartedOpen, setIsGetStartedOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const getStartedDropdownRef = useRef<HTMLDivElement>(null);
  const getStartedButtonRef = useRef<HTMLButtonElement>(null);
  const adminDropdownRef = useRef<HTMLDivElement>(null);
  const adminButtonRef = useRef<HTMLButtonElement>(null);

  const otherLinks = [
    { name: 'Home', href: '/' },
    { name: 'History', href: '/history' },
    { name: 'FAQs', href: '/faqs' },
    { name: 'Contact-Us', href: '/contact' },
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      const clickedOutsideGetStarted =
        getStartedDropdownRef.current && !getStartedDropdownRef.current.contains(targetNode) &&
        getStartedButtonRef.current && !getStartedButtonRef.current.contains(targetNode);
      const clickedOutsideAdmin =
        adminDropdownRef.current && !adminDropdownRef.current.contains(targetNode) &&
        adminButtonRef.current && !adminButtonRef.current.contains(targetNode);

      if (clickedOutsideGetStarted) setIsGetStartedOpen(false);
      if (clickedOutsideAdmin) setIsAdminOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu when clicking on a link
  const closeMobileMenu = () => {
    setIsMenuOpen(false);
    setIsGetStartedOpen(false);
    setIsAdminOpen(false);
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
              {/* Get Started dropdown */}
              <div className="relative" ref={getStartedDropdownRef}>
                <button
                  id="get-started-button"
                  ref={getStartedButtonRef}
                  onClick={() => setIsGetStartedOpen(!isGetStartedOpen)}
                  onMouseEnter={() => setIsGetStartedOpen(true)}
                  className="px-3 py-2 rounded-md text-sm font-medium hover:text-oyoOrange hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-oyoOrange focus:ring-offset-2 focus:ring-offset-oyoGreen"
                  aria-expanded={isGetStartedOpen}
                  aria-haspopup="true"
                  aria-controls="get-started-menu"
                >
                  Get Started
                  <svg
                    className={`ml-1 inline-block w-4 h-4 transition-transform duration-200 ${isGetStartedOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {/* Dropdown Menu */}
                <div
                  id="get-started-menu"
                  className={`absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 transition-all duration-200 ${
                    isGetStartedOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
                  }`}
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="get-started-button"
                  onMouseLeave={() => setIsGetStartedOpen(false)}
                >
                  <div className="py-1">
                    <Link
                      href="/pensioner/login"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-oyoGreen hover:text-oyoWhite transition-colors duration-200"
                      role="menuitem"
                      onClick={() => setIsGetStartedOpen(false)}
                    >
                      Pensioner Login
                    </Link>
                    <Link
                      href="/register"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-oyoGreen hover:text-oyoWhite transition-colors duration-200"
                      role="menuitem"
                      onClick={() => setIsGetStartedOpen(false)}
                    >
                      Pensioner Register
                    </Link>
                  </div>
                </div>
              </div>

              {/* Admin Access dropdown */}
              <div className="relative" ref={adminDropdownRef}>
                <button
                  id="admin-access-button"
                  ref={adminButtonRef}
                  onClick={() => setIsAdminOpen(!isAdminOpen)}
                  onMouseEnter={() => setIsAdminOpen(true)}
                  className="px-3 py-2 rounded-md text-sm font-medium hover:text-oyoOrange hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-oyoOrange focus:ring-offset-2 focus:ring-offset-oyoGreen"
                  aria-expanded={isAdminOpen}
                  aria-haspopup="true"
                  aria-controls="admin-access-menu"
                >
                  Admin Access
                  <svg
                    className={`ml-1 inline-block w-4 h-4 transition-transform duration-200 ${isAdminOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {/* Dropdown Menu */}
                <div
                  id="admin-access-menu"
                  className={`absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 transition-all duration-200 ${
                    isAdminOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
                  }`}
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="admin-access-button"
                  onMouseLeave={() => setIsAdminOpen(false)}
                >
                  <div className="py-1">
                    <Link
                      href="/admin/login"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-oyoGreen hover:text-oyoWhite transition-colors duration-200"
                      role="menuitem"
                      onClick={() => setIsAdminOpen(false)}
                    >
                      Admin Login
                    </Link>
                    <Link
                      href="/officer/login"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-oyoGreen hover:text-oyoWhite transition-colors duration-200"
                      role="menuitem"
                      onClick={() => setIsAdminOpen(false)}
                    >
                      Verification Officer Login
                    </Link>
                    <Link
                      href="/register-staff"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-oyoGreen hover:text-oyoWhite transition-colors duration-200"
                      role="menuitem"
                      onClick={() => setIsAdminOpen(false)}
                    >
                      Register Staff (Admin/Verification Officer)
                    </Link>
                    <Link
                      href="/admin/enquiries"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-oyoGreen hover:text-oyoWhite transition-colors duration-200"
                      role="menuitem"
                      onClick={() => setIsAdminOpen(false)}
                    >
                      View Enquiries
                    </Link>
                  </div>
                </div>
              </div>

              {/* Other links */}
              {otherLinks.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="px-3 py-2 rounded-md text-sm font-medium hover:text-oyoOrange hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-oyoOrange focus:ring-offset-2 focus:ring-offset-oyoGreen"
                >
                  {item.name}
                </Link>
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
          {/* Get Started (mobile) */}
          <button
            onClick={() => setIsGetStartedOpen(!isGetStartedOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md text-base font-medium text-oyoWhite hover:text-oyoOrange hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-oyoOrange"
            aria-expanded={isGetStartedOpen}
            aria-controls="mobile-get-started"
          >
            <span>Get Started</span>
            <svg className={`h-5 w-5 transition-transform duration-200 ${isGetStartedOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          <div
            id="mobile-get-started"
            className={`pl-6 space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${isGetStartedOpen ? 'max-h-64 opacity-100 visible' : 'max-h-0 opacity-0 invisible'}`}
          >
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

          {/* Admin Access (mobile) */}
          <button
            onClick={() => setIsAdminOpen(!isAdminOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md text-base font-medium text-oyoWhite hover:text-oyoOrange hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-oyoOrange"
            aria-expanded={isAdminOpen}
            aria-controls="mobile-admin-access"
          >
            <span>Admin Access</span>
            <svg className={`h-5 w-5 transition-transform duration-200 ${isAdminOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          <div
            id="mobile-admin-access"
            className={`pl-6 space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${isAdminOpen ? 'max-h-96 opacity-100 visible' : 'max-h-0 opacity-0 invisible'}`}
          >
            <Link
              href="/admin-login"
              className="block px-3 py-2 rounded-md text-base font-medium text-oyoWhite hover:text-oyoOrange hover:bg-white/10 transition-all duration-200"
              onClick={closeMobileMenu}
            >
              Login Admin
            </Link>
            <Link
              href="/register?role=admin"
              className="block px-3 py-2 rounded-md text-base font-medium text-oyoWhite hover:text-oyoOrange hover:bg-white/10 transition-all duration-200"
              onClick={closeMobileMenu}
            >
              Register Admin
            </Link>
            <Link
              href="/admin-login?role=officer"
              className="block px-3 py-2 rounded-md text-base font-medium text-oyoWhite hover:text-oyoOrange hover:bg-white/10 transition-all duration-200"
              onClick={closeMobileMenu}
            >
              Login Verification Officer
            </Link>
            <Link
              href="/register?role=officer"
              className="block px-3 py-2 rounded-md text-base font-medium text-oyoWhite hover:text-oyoOrange hover:bg-white/10 transition-all duration-200"
              onClick={closeMobileMenu}
            >
              Register Verification Officer
            </Link>
            <Link
              href="/admin/enquiries"
              className="block px-3 py-2 rounded-md text-base font-medium text-oyoWhite hover:text-oyoOrange hover:bg-white/10 transition-all duration-200"
              onClick={closeMobileMenu}
            >
              View Enquiries
            </Link>
          </div>

          {/* Other links */}
          {otherLinks.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="block px-3 py-2 rounded-md text-base font-medium text-oyoWhite hover:text-oyoOrange hover:bg-white/10 transition-all duration-200"
              onClick={closeMobileMenu}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
