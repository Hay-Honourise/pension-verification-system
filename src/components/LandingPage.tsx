"use client";
import React, { useEffect, useState } from "react";
import oyoSecretariat from "@/assets/Oyo_State_Secretariat.jpg";
import pension1 from "@/assets/pension1.jpg";
import pension2 from "@/assets/pension2.jpg";
import oyo from "@/assets/oyo.jpg";
import Image from "next/image";
import {
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaYoutube,
  FaInstagram,
} from "react-icons/fa";

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
      {/* Main Content Area */}
      <section className="bg-gradient-to-r from-oyoGreen/110 to-oyoOrange/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between py-4 xs:py-4 sm:py-6 md:py-6">
            <div className="md:w-1/2 mb-6 xs:mb-8 md:mb-0 text-center md:text-left">
              <h1 className="text-lg xs:text-xl sm:text-2xl md:text-4xl font-extrabold text-white mb-2 xs:mb-3 drop-shadow-lg leading-tight">
                Welcome to the Oyo State Virtual Pension Verification System
              </h1>
              <p className="text-xs xs:text-sm sm:text-base md:text-lg text-white/90 mb-3 xs:mb-4">
                Secure, Convenient, and Reliable Pensioner Verification for
                Retired Public Servants in Oyo State.
              </p>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="relative rounded-lg shadow-lg w-full max-w-[180px] xs:max-w-[220px] sm:max-w-sm md:max-w-sm aspect-[4/3] overflow-hidden">
                {slides.map((slide, index) => (
                  <Image
                    key={index}
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    sizes="(max-width: 768px) 220px, 480px"
                    priority={index === 0}
                    className={`object-cover transition-opacity duration-700 ease-in-out ${
                      activeIndex === index ? "opacity-100" : "opacity-0"
                    }`}
                  />
                ))}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {slides.map((_, index) => (
                    <span
                      key={index}
                      aria-hidden
                      className={`h-1.5 w-1.5 rounded-full transition-colors ${
                        activeIndex === index ? "bg-oyoOrange" : "bg-white/60"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="bg-oyoGreen text-oyoWhite py-2 shrink-0">
        <div className="max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 xs:gap-6 sm:gap-8 sm:grid-cols-2 md:grid-cols-3 text-center sm:text-left">
            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-1 xs:mb-2 text-base xs:text-lg">
                Quick Links
              </h3>
              <ul className="flex gap-2">
                <li>
                  <a href="#" className="hover:text-oyoOrange block py-1">
                    Home
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-oyoOrange block py-1">
                    Login
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-oyoOrange block py-1">
                    Register
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-oyoOrange block py-1">
                    FAQs
                  </a>
                </li>
              </ul>
            </div>
            {/* Address */}
            <div>
              <h3 className="font-semibold mb-1 xs:mb-2 text-base xs:text-lg">
                Address
              </h3>
              <p className="text-xs xs:text-sm">
                Oyo State Pensions Board Secretariat,
                <br />
                Ibadan Oyo State, Nigeria
              </p>
            </div>
            {/* Contact */}
            <div>
              <h3 className="font-semibold mb-1 xs:mb-2 text-base xs:text-lg">
                Contact
              </h3>
              <p className="text-xs xs:text-sm">
                Email:{" "}
                <a
                  href="mailto:pensionboard@oyostate.gov.ng"
                  className="hover:text-oyoOrange"
                >
                  pensionboard@oyostate.gov.ng
                </a>
              </p>
              <p className="text-xs xs:text-sm">
                Phone:{" "}
                <a href="tel:+234802xxxxxxx" className="hover:text-oyoOrange">
                  +234 802 xxx xxxx
                </a>
              </p>
              {/* Social Media Links */}
              <div className="flex justify-center sm:justify-start mt-6 gap-3 xs:gap-4">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="rounded-full bg-white text-green-500 hover:bg-orange-500 hover:text-white transition-colors focus:outline-none w-10 h-10 flex items-center justify-center shadow"
                >
                  <FaFacebook className="w-5 h-5 xs:w-6 xs:h-6" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                  className="rounded-full bg-white text-green-500 hover:bg-orange-500 hover:text-white transition-colors focus:outline-none w-10 h-10 flex items-center justify-center shadow"
                >
                  <FaTwitter className="w-5 h-5 xs:w-6 xs:h-6" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="rounded-full bg-white text-green-500 hover:bg-orange-500 hover:text-white transition-colors focus:outline-none w-10 h-10 flex items-center justify-center shadow"
                >
                  <FaLinkedin className="w-5 h-5 xs:w-6 xs:h-6" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="rounded-full bg-white text-green-500 hover:bg-orange-500 hover:text-white transition-colors focus:outline-none w-10 h-10 flex items-center justify-center shadow"
                >
                  <FaYoutube className="w-5 h-5 xs:w-6 xs:h-6" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="rounded-full bg-white text-green-500 hover:bg-orange-500 hover:text-white transition-colors focus:outline-none w-10 h-10 flex items-center justify-center shadow"
                >
                  <FaInstagram className="w-5 h-5 xs:w-6 xs:h-6" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
      <div className="text-center text-[10px] py-4 xs:text-xs text-oyoWhite/70 mt-4 xs:mt-6">
        &copy; {new Date().getFullYear()} Oyo State Pensions Board. All rights
        reserved.
      </div>
    </div>
  );
};

export default LandingPage;
