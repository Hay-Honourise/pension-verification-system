"use client";
import React, { useEffect, useState } from "react";
import oyoSecretariat from "@/assets/Oyo_State_Secretariat.jpg";
import pension1 from "@/assets/pension1.jpg";
import pension2 from "@/assets/pension2.jpg";
import oyo from "@/assets/oyo.jpg";
import Image from "next/image";
import {
  FaFacebook,
  FaLinkedin,
  FaYoutube,
  FaInstagram,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaClock,
  FaShieldAlt,
  FaCheckCircle,
  FaAward,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import Link from "next/link";

const LandingPage = () => {
  const slides = [
    { src: oyoSecretariat, alt: "Oyo State Secretariat" },
    { src: pension1, alt: "Pension verification session" },
    { src: pension2, alt: "Pensioners support and assistance" },
    { src: oyo, alt: "Oyo State" },
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [slides.length]);

  return (
    <div className="flex flex-col text-white">
      {/* Hero Section with Changing Background Images */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Images with Fade Transition */}
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              activeIndex === index ? "opacity-100 z-0" : "opacity-0 z-0"
            }`}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-cover"
              quality={90}
            />
            {/* Dark Overlay for Better Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/60 to-black/70 z-10"></div>
            {/* Animated Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-oyoGreen/30 via-transparent to-oyoOrange/20 z-10"></div>
          </div>
        ))}

        {/* Floating Particles Effect */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 md:py-32 text-center">
          <div className="space-y-6 sm:space-y-8 animate-fade-in">
            {/* Animated Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 animate-slide-down">
              <FaShieldAlt className="text-oyoOrange text-sm" />
              <span className="text-sm sm:text-base font-medium">
                Official Government Portal
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-tight">
              <span className="block bg-gradient-to-r from-white via-oyoGreen/90 to-white bg-clip-text text-transparent animate-gradient">
                Welcome to the Oyo State
              </span>
              <span className="block mt-2 sm:mt-3 bg-gradient-to-r from-oyoOrange via-white to-oyoOrange bg-clip-text text-transparent">
                Virtual Pension Verification System
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 max-w-3xl mx-auto leading-relaxed font-light">
              Secure, Convenient, and Reliable Pensioner Verification for
              Retired Public Servants in Oyo State.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4 sm:pt-6">
              <Link
                href="/pensioner/login"
                className="group px-8 py-4 bg-oyoOrange hover:bg-oyoOrange/90 text-white font-semibold rounded-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
              >
                Pensioner Login
                <FaCheckCircle className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/admin/login"
                className="px-8 py-4 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white font-semibold rounded-lg border-2 border-white/30 hover:border-white/50 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                Admin Portal
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 pt-8 sm:pt-12 max-w-4xl mx-auto">
              <div className="flex flex-col items-center gap-2 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <FaShieldAlt className="text-3xl text-oyoGreen" />
                <span className="text-sm sm:text-base font-medium">
                  Secure Platform
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <FaAward className="text-3xl text-oyoOrange" />
                <span className="text-sm sm:text-base font-medium">
                  Government Verified
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <FaCheckCircle className="text-3xl text-oyoGreen" />
                <span className="text-sm sm:text-base font-medium">
                  Reliable Service
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeIndex === index
                  ? "w-8 bg-oyoOrange"
                  : "w-2 bg-white/60 hover:bg-white/80"
              }`}
            />
          ))}
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 hidden md:block animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1.5 h-3 bg-white/50 rounded-full mt-2"></div>
          </div>
        </div>
      </section>

      {/* Professional Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 mb-10">
            {/* About Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-4">
                About Oyo Pension Board
              </h3>
              <p className="text-sm leading-relaxed text-gray-400">
                The Oyo State Pensions Board is committed to providing secure,
                efficient, and reliable pension verification services for all
                retired public servants in Oyo State.
              </p>
              <div className="flex gap-4 pt-4">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-oyoOrange text-white flex items-center justify-center transition-all duration-300 hover:scale-110"
                >
                  <FaFacebook className="w-5 h-5" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X (Twitter)"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-oyoOrange text-white flex items-center justify-center transition-all duration-300 hover:scale-110"
                >
                  <FaXTwitter className="w-5 h-5" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-oyoOrange text-white flex items-center justify-center transition-all duration-300 hover:scale-110"
                >
                  <FaLinkedin className="w-5 h-5" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-oyoOrange text-white flex items-center justify-center transition-all duration-300 hover:scale-110"
                >
                  <FaYoutube className="w-5 h-5" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-oyoOrange text-white flex items-center justify-center transition-all duration-300 hover:scale-110"
                >
                  <FaInstagram className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Services Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-4">Our Services</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <FaCheckCircle className="text-oyoGreen mt-1 flex-shrink-0" />
                  <span>Pensioner Registration</span>
                </li>
                <li className="flex items-start gap-2">
                  <FaCheckCircle className="text-oyoGreen mt-1 flex-shrink-0" />
                  <span>Biometric Verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <FaCheckCircle className="text-oyoGreen mt-1 flex-shrink-0" />
                  <span>Document Verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <FaCheckCircle className="text-oyoGreen mt-1 flex-shrink-0" />
                  <span>Pension Status Tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <FaCheckCircle className="text-oyoGreen mt-1 flex-shrink-0" />
                  <span>Support & Assistance</span>
                </li>
              </ul>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-4">Contact Us</h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <FaMapMarkerAlt className="text-oyoOrange mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium mb-1">Office Address</p>
                    <p className="text-gray-400">
                      Oyo State Pensions Board Secretariat,
                      <br />
                      Ibadan, Oyo State, Nigeria
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FaPhone className="text-oyoOrange mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium mb-1">Phone</p>
                    <a
                      href="tel:+2349035631361"
                      className="text-gray-400 hover:text-oyoOrange transition-colors block"
                    >
                      +234 903 563 1361
                    </a>
                    <a
                      href="tel:+2348051715400"
                      className="text-gray-400 hover:text-oyoOrange transition-colors block"
                    >
                      +234 805 171 5400
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FaEnvelope className="text-oyoOrange mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium mb-1">Email</p>
                    <a
                      href="mailto:pensionboard@oyostate.gov.ng"
                      className="text-gray-400 hover:text-oyoOrange transition-colors break-all"
                    >
                      pensionboard@oyostate.gov.ng
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FaClock className="text-oyoOrange mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium mb-1">Office Hours</p>
                    <p className="text-gray-400">
                      Monday - Friday: 8:00 AM - 4:00 PM
                      <br />
                      Saturday - Sunday: Closed
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Access */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-4">Quick Access</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    href="/pensioner/register"
                    className="flex items-center gap-2 text-gray-400 hover:text-oyoOrange transition-colors group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                    Pensioner Registration
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pensioner/login"
                    className="flex items-center gap-2 text-gray-400 hover:text-oyoOrange transition-colors group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                    Pensioner Login
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/login"
                    className="flex items-center gap-2 text-gray-400 hover:text-oyoOrange transition-colors group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                    Admin Portal
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faqs"
                    className="flex items-center gap-2 text-gray-400 hover:text-oyoOrange transition-colors group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                    Frequently Asked Questions
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="flex items-center gap-2 text-gray-400 hover:text-oyoOrange transition-colors group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                    Contact Support
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-700 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
              <p className="text-gray-400 text-center md:text-left">
                &copy; {new Date().getFullYear()} Oyo State Pensions Board. All
                rights reserved.
              </p>
              <div className="flex flex-wrap justify-center md:justify-end gap-6">
                <Link
                  href="#"
                  className="text-gray-400 hover:text-oyoOrange transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="#"
                  className="text-gray-400 hover:text-oyoOrange transition-colors"
                >
                  Terms of Service
                </Link>
                <Link
                  href="#"
                  className="text-gray-400 hover:text-oyoOrange transition-colors"
                >
                  Cookie Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom CSS for Animations */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
            opacity: 1;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes gradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }

        .animate-slide-down {
          animation: slide-down 0.8s ease-out;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
