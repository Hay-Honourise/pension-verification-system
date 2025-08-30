"use client";
import React from "react";
import { motion } from "framer-motion";
import { 
  FaHistory, 
  FaClock, 
  FaShieldAlt, 
  FaChartLine, 
  FaEye, 
  FaMobileAlt,
  FaLaptop,
  FaServer,
  FaCloud
} from "react-icons/fa";

const HistoryPage = () => {
  const timelineData = [
    {
      period: "Pre-2000s",
      title: "Manual Verification Era",
      description: "Pensioners appeared physically with documents for verification. Paper-based records and manual processing.",
      icon: FaHistory,
      color: "bg-gray-500"
    },
    {
      period: "2000–2010",
      title: "Semi-Structured Verification",
      description: "Records partly digitized but still required significant manual intervention and physical presence.",
      icon: FaClock,
      color: "bg-blue-500"
    },
    {
      period: "2011–2020",
      title: "Computer-Based Records",
      description: "Advanced computer systems introduced but pensioners still required physical presence for verification.",
      icon: FaLaptop,
      color: "bg-green-500"
    },
    {
      period: "2021–Present",
      title: "Virtual Verification Revolution",
      description: "Complete digital transformation with biometrics, online platform, and remote verification capabilities.",
      icon: FaCloud,
      color: "bg-oyoOrange"
    }
  ];

  const impactData = [
    {
      title: "Transparency",
      description: "Complete audit trail and real-time status updates",
      icon: FaEye
    },
    {
      title: "Efficiency",
      description: "Reduced processing time from weeks to days",
      icon: FaChartLine
    },
    {
      title: "Faster Payments",
      description: "Streamlined verification leads to quicker pension disbursements",
      icon: FaMobileAlt
    },
    {
      title: "Reduced Fraud",
      description: "Advanced biometric verification eliminates ghost pensioners",
      icon: FaShieldAlt
    }
  ];

  const futurePlans = [
    "Expansion for both Total Pension and Contributory schemes",
    "Integration with National Identity Number (NIN)",
    "Bank Verification Number (BVN) integration",
    "Advanced security upgrades with blockchain technology",
    "Mobile app development for pensioners",
    "AI-powered fraud detection systems"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-oyoGreen/5 to-oyoOrange/5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-oyoGreen to-oyoOrange text-white py-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-3xl md:text-5xl font-bold mb-4"
          >
            History of Pension Verification in Oyo State
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto"
          >
            A journey of transformation from manual processes to cutting-edge virtual verification
          </motion.p>
        </div>
      </motion.div>

      {/* Introduction Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-white rounded-lg shadow-lg p-8 md:p-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-oyoGreen mb-6">
              Introduction
            </h2>
            <p className="text-gray-700 text-lg leading-relaxed">
              Pension verification in Oyo State has undergone a remarkable evolution over the decades. 
              What began as a manual, paper-based system has transformed into a sophisticated virtual 
              verification platform that serves thousands of pensioners efficiently and securely. 
              This journey reflects our commitment to innovation, transparency, and service excellence 
              in public administration.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-center text-oyoGreen mb-12"
          >
            Evolution Timeline
          </motion.h2>

          {/* Desktop Timeline */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gray-300 h-full"></div>
              
              {timelineData.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className={`flex items-center mb-12 ${
                    index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
                  }`}
                >
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-oyoOrange">
                      <div className="flex items-center mb-3">
                        <span className={`${item.color} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
                          {item.period}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-oyoGreen mb-2">{item.title}</h3>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                  </div>
                  
                  {/* Timeline Icon */}
                  <div className="relative z-10">
                    <div className={`w-16 h-16 ${item.color} rounded-full flex items-center justify-center shadow-lg`}>
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  
                  <div className="w-1/2"></div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mobile Timeline */}
          <div className="lg:hidden">
            {timelineData.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="mb-8"
              >
                <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-oyoOrange">
                  <div className="flex items-center mb-4">
                    <div className={`w-12 h-12 ${item.color} rounded-full flex items-center justify-center mr-4`}>
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className={`${item.color} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
                      {item.period}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-oyoGreen mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Virtual Verification Section */}
      <section className="py-16 bg-gradient-to-r from-oyoGreen/10 to-oyoOrange/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-oyoGreen mb-6">
              Why Virtual Verification Was Introduced
            </h2>
            <p className="text-lg text-gray-700 max-w-4xl mx-auto">
              The transition to virtual verification was driven by several key objectives aimed at 
              improving service delivery and operational efficiency.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white rounded-lg shadow-lg p-8"
            >
              <h3 className="text-xl font-bold text-oyoGreen mb-4">Reduce Stress</h3>
              <p className="text-gray-600">
                Eliminate the need for pensioners to travel long distances and wait in queues 
                for verification. Virtual verification can be completed from the comfort of home.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="bg-white rounded-lg shadow-lg p-8"
            >
              <h3 className="text-xl font-bold text-oyoGreen mb-4">Minimize Fraud</h3>
              <p className="text-gray-600">
                Advanced biometric verification and digital audit trails help prevent 
                identity theft and eliminate ghost pensioners from the system.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
              className="bg-white rounded-lg shadow-lg p-8"
            >
              <h3 className="text-xl font-bold text-oyoGreen mb-4">Improve Accuracy</h3>
              <p className="text-gray-600">
                Digital verification reduces human errors and ensures consistent 
                processing standards across all verification activities.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              viewport={{ once: true }}
              className="bg-white rounded-lg shadow-lg p-8"
            >
              <h3 className="text-xl font-bold text-oyoGreen mb-4">Enhance Efficiency</h3>
              <p className="text-gray-600">
                Streamlined processes reduce administrative overhead and enable 
                faster processing times for pension verification and payments.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-center text-oyoGreen mb-12"
          >
            Impact So Far
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {impactData.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="bg-gradient-to-br from-oyoGreen to-oyoOrange rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-oyoGreen mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Looking Ahead Section */}
      <section className="py-16 bg-gradient-to-r from-oyoGreen/10 to-oyoOrange/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-white rounded-lg shadow-lg p-8 md:p-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-oyoGreen mb-8 text-center">
              Looking Ahead
            </h2>
            <p className="text-lg text-gray-700 mb-8 text-center">
              The future of pension verification in Oyo State is bright with planned innovations 
              and expansions that will further enhance service delivery.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {futurePlans.map((plan, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start space-x-3"
                >
                  <div className="w-2 h-2 bg-oyoOrange rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700">{plan}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-oyoGreen text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-lg">
            Committed to continuous innovation and excellence in pension administration
          </p>
          <p className="text-sm text-white/70 mt-2">
            Oyo State Pensions Board - Serving with Integrity
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HistoryPage;
