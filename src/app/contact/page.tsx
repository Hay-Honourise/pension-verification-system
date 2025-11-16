"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaClock,
  FaPaperPlane,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaUser,
  FaFileAlt,
  FaHeadset,
  FaComments,
} from 'react-icons/fa';
import oyoSecretariat from "@/assets/Oyo_State_Secretariat.jpg";
import pension1 from "@/assets/pension1.jpg";
import pension2 from "@/assets/pension2.jpg";
import oyo from "@/assets/oyo.jpg";

const subjects = ["Complaint", "Enquiry", "Support", "Others"] as const;

type Subject = typeof subjects[number];

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  subject: Subject;
  message: string;
};

export default function ContactPage() {
  const [form, setForm] = useState<FormState>({
    fullName: "",
    email: "",
    phone: "",
    subject: "Enquiry",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const backgroundImages = [
    oyoSecretariat,
    pension1,
    pension2,
    oyo,
  ];

  useEffect(() => {
    const intervalId = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 6000);
    return () => clearInterval(intervalId);
  }, [backgroundImages.length]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      if (!form.fullName || !form.email || !form.subject || !form.message) {
        setErrorMsg("Please fill in all required fields.");
        return;
      }

      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone || null,
          subject: form.subject,
          message: form.message,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to submit enquiry");
      }
      setSuccessMsg(`Your enquiry has been submitted successfully. Tracking ID: ${data.trackingId}`);
      setForm({ fullName: "", email: "", phone: "", subject: "Enquiry", message: "" });
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to submit enquiry");
    } finally {
      setLoading(false);
    }
  }

  const contactInfo = [
    {
      icon: FaMapMarkerAlt,
      title: "Address",
      content: "Oyo State Pensions Board Secretariat, Agodi, Ibadan, Oyo State, Nigeria",
      link: "https://maps.google.com/?q=Oyo+State+Pensions+Board+Secretariat+Agodi+Ibadan",
      color: "from-blue-500 to-blue-600",
      hoverColor: "hover:from-blue-600 hover:to-blue-700",
    },
    {
      icon: FaPhone,
      title: "Phone",
      content: "+234 903 563 1361\n+234 805 171 5400",
      link: "tel:+2349035631361",
      color: "from-oyoGreen to-green-600",
      hoverColor: "hover:from-green-600 hover:to-green-700",
    },
    {
      icon: FaEnvelope,
      title: "Email",
      content: "pensionboard@oyostate.gov.ng",
      link: "mailto:pensionboard@oyostate.gov.ng",
      color: "from-oyoOrange to-orange-600",
      hoverColor: "hover:from-orange-600 hover:to-orange-700",
    },
    {
      icon: FaClock,
      title: "Office Hours",
      content: "Monday - Friday: 8:00 AM - 4:00 PM\nSaturday - Sunday: Closed",
      link: null,
      color: "from-purple-500 to-purple-600",
      hoverColor: "hover:from-purple-600 hover:to-purple-700",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Changing Background */}
      <section className="relative min-h-[50vh] sm:min-h-[60vh] md:min-h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Background Images with Fade Transition */}
        {backgroundImages.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              activeImageIndex === index ? "opacity-100 z-0" : "opacity-0 z-0"
            }`}
          >
            <Image
              src={img}
              alt={`Background ${index + 1}`}
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-cover"
              quality={90}
            />
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/60 to-black/70 z-10"></div>
            {/* Animated Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-oyoGreen/30 via-transparent to-oyoOrange/20 z-10"></div>
          </div>
        ))}

        {/* Floating Particles */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {[...Array(15)].map((_, i) => (
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
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4 sm:space-y-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20"
            >
              <FaHeadset className="text-oyoOrange" />
              <span className="text-sm sm:text-base font-medium">We're Here to Help</span>
            </motion.div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
              <span className="block bg-gradient-to-r from-white via-oyoGreen/90 to-white bg-clip-text text-transparent">
                Contact Support
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-white/95 max-w-3xl mx-auto leading-relaxed">
              Reach out to the Oyo State Pensions Board for inquiries, complaints, or support.
              We're committed to assisting you with all your pension verification needs.
            </p>
          </motion.div>
        </div>

        {/* Image Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-3">
          {backgroundImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveImageIndex(index)}
              aria-label={`Go to image ${index + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeImageIndex === index
                  ? "w-8 bg-oyoOrange"
                  : "w-2 bg-white/60 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 -mt-10 sm:-mt-16 relative z-30">
        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-12 sm:mb-16">
          {contactInfo.map((info, index) => {
            const Icon = info.icon;
            const contentLines = info.content.split('\n');
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${info.color} ${info.hoverColor} p-6 sm:p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2`}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                    backgroundSize: '24px 24px'
                  }}></div>
                </div>
                
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">{info.title}</h3>
                  {info.link ? (
                    <a
                      href={info.link}
                      className="block space-y-1 text-white/90 hover:text-white transition-colors"
                    >
                      {contentLines.map((line, i) => (
                        <p key={i} className="text-sm sm:text-base leading-relaxed">{line}</p>
                      ))}
                    </a>
                  ) : (
                    <div className="space-y-1">
                      {contentLines.map((line, i) => (
                        <p key={i} className="text-sm sm:text-base leading-relaxed">{line}</p>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Form and Additional Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10 border border-gray-100">
              <div className="mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Send Us a Message
                </h2>
                <p className="text-gray-600 text-sm sm:text-base">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="sm:col-span-2">
                    <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        required
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-oyoOrange focus:ring-2 focus:ring-oyoOrange/20 transition-all duration-300 text-gray-900 placeholder-gray-400"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-oyoOrange focus:ring-2 focus:ring-oyoOrange/20 transition-all duration-300 text-gray-900 placeholder-gray-400"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number <span className="text-gray-400 text-xs">(Optional)</span>
                    </label>
                    <div className="relative">
                      <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-oyoOrange focus:ring-2 focus:ring-oyoOrange/20 transition-all duration-300 text-gray-900 placeholder-gray-400"
                        placeholder="+234 800 000 0000"
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="sm:col-span-2">
                    <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FaFileAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
                      <select
                        id="subject"
                        name="subject"
                        required
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value as Subject })}
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-oyoOrange focus:ring-2 focus:ring-oyoOrange/20 transition-all duration-300 text-gray-900 appearance-none bg-white cursor-pointer"
                        aria-label="Select enquiry subject"
                      >
                        {subjects.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="sm:col-span-2">
                    <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FaComments className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={6}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-oyoOrange focus:ring-2 focus:ring-oyoOrange/20 transition-all duration-300 text-gray-900 placeholder-gray-400 resize-none"
                        placeholder="Tell us how we can help you..."
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-oyoOrange to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="w-5 h-5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Message</span>
                        <FaPaperPlane className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>

                {/* Success/Error Messages */}
                {successMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-start gap-3"
                  >
                    <FaCheckCircle className="text-green-600 w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-green-800 font-medium">Success!</p>
                      <p className="text-green-700 text-sm mt-1">{successMsg}</p>
                    </div>
                    <button
                      onClick={() => setSuccessMsg(null)}
                      className="text-green-600 hover:text-green-800 transition-colors"
                      aria-label="Close success message"
                    >
                      <FaTimesCircle className="w-5 h-5" />
                    </button>
                  </motion.div>
                )}

                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3"
                  >
                    <FaTimesCircle className="text-red-600 w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-red-800 font-medium">Error</p>
                      <p className="text-red-700 text-sm mt-1">{errorMsg}</p>
                    </div>
                    <button
                      onClick={() => setErrorMsg(null)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      aria-label="Close error message"
                    >
                      <FaTimesCircle className="w-5 h-5" />
                    </button>
                  </motion.div>
                )}
              </form>
            </div>
          </motion.div>

          {/* Additional Information */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6 sm:space-y-8"
          >
            {/* Quick Tips */}
            <div className="bg-gradient-to-br from-oyoGreen to-green-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
              <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
                <FaCheckCircle className="w-6 h-6" />
                Quick Tips
              </h3>
              <ul className="space-y-3 sm:space-y-4 text-sm sm:text-base">
                <li className="flex items-start gap-3">
                  <span className="mt-1">✓</span>
                  <span>Include your pension ID or tracking number for faster assistance</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1">✓</span>
                  <span>Check our FAQs section for common questions</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1">✓</span>
                  <span>We typically respond within 24-48 hours</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1">✓</span>
                  <span>Save your tracking ID for future reference</span>
                </li>
              </ul>
            </div>

            {/* Response Time */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-gray-200 shadow-lg">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FaClock className="text-oyoOrange w-6 h-6" />
                Response Time
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Enquiries</span>
                  <span className="text-sm font-semibold text-oyoGreen">24-48 hours</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Complaints</span>
                  <span className="text-sm font-semibold text-oyoOrange">48-72 hours</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Support</span>
                  <span className="text-sm font-semibold text-blue-600">24 hours</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Google Map */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-12 sm:mt-16"
        >
          <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 overflow-hidden border border-gray-100">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
              <FaMapMarkerAlt className="text-oyoOrange w-6 h-6" />
              Find Us on Map
            </h3>
            <div className="aspect-video w-full overflow-hidden rounded-xl shadow-lg">
              <iframe
                title="Oyo State Pensions Board Secretariat Location"
                src="https://www.google.com/maps?q=Oyo%20State%20Pensions%20Board%20Secretariat%2C%20Agodi%2C%20Ibadan&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              ></iframe>
            </div>
          </div>
        </motion.div>
      </section>

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

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
