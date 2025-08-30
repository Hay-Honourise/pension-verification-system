'use client';

import { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    id: 1,
    question: "What is the Oyo State Virtual Pension Verification System?",
    answer: "The Oyo State Virtual Pension Verification System is a digital platform designed to streamline and modernize the pension verification process for retired civil servants in Oyo State. It allows pensioners to verify their identity and pension details remotely using advanced technology, eliminating the need for physical visits to government offices."
  },
  {
    id: 2,
    question: "Who can use this system?",
    answer: "This system is designed for retired civil servants of Oyo State who are currently receiving or are eligible to receive pension benefits. This includes former employees of the Oyo State Civil Service, teachers, and other government workers who have completed their service and are entitled to pension payments."
  },
  {
    id: 3,
    question: "What information do I need to register?",
    answer: "To register, you'll need your Pension ID number, National Identification Number (NIN), full name as it appears on official documents, date of birth, email address, phone number, and residential address. You'll also need to provide details about your employment history including date of first appointment, date of retirement, and current pension scheme type."
  },
  {
    id: 4,
    question: "How do I log in after registration?",
    answer: "After successful registration, you can log in using your Pension ID and the password you created during registration. Simply visit the login page, enter your credentials, and click 'Login'. If you forget your password, you can use the 'Forgot Password' feature to reset it through your registered email address."
  },
  {
    id: 5,
    question: "What happens if my details are outdated?",
    answer: "If your details are outdated, you can update them through your dashboard after logging in. The system allows you to modify personal information such as address, phone number, and email. For critical information like name or date of birth, you may need to contact the pension office directly with supporting documents."
  },
  {
    id: 6,
    question: "How is the verification done?",
    answer: "The verification process involves multiple steps: First, your personal information is cross-referenced with government records. Then, facial recognition technology is used to verify your identity by comparing your uploaded photo with official records. Finally, your pension details are validated against the state's pension database to ensure accuracy."
  },
  {
    id: 7,
    question: "What if face verification fails?",
    answer: "If face verification fails, don't worry. You can try uploading a clearer, more recent photograph. Ensure the photo is well-lit, shows your full face clearly, and matches your official identification. If the issue persists, you can contact our support team for assistance or schedule an in-person verification appointment."
  },
  {
    id: 8,
    question: "Is my data safe?",
    answer: "Yes, your data is completely safe. We use industry-standard encryption to protect all personal information. The system complies with Nigeria's data protection regulations and government security standards. Your information is only accessible to authorized personnel and is never shared with third parties without your consent."
  },
  {
    id: 9,
    question: "Can I use the system on my phone?",
    answer: "Absolutely! The Virtual Pension Verification System is fully responsive and works perfectly on mobile phones, tablets, and desktop computers. You can access all features including registration, login, document upload, and verification from any device with an internet connection."
  },
  {
    id: 10,
    question: "Who do I contact if I have issues?",
    answer: "If you encounter any issues, you can contact our support team through multiple channels: Call our helpline at 0800-PENSION, send an email to support@oyopension.com, or visit any of our pension offices across Oyo State. Our support team is available Monday to Friday, 8:00 AM to 5:00 PM."
  }
];

export default function FAQsPage() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (id: number) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-orange-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Frequently Asked Questions
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-oyoGreen to-oyoOrange mx-auto rounded-full"></div>
          <p className="text-gray-600 mt-6 text-lg max-w-2xl mx-auto">
            Find answers to common questions about the Oyo State Virtual Pension Verification System
          </p>
        </div>

        {/* FAQs Accordion */}
        <div className="space-y-4">
          {faqData.map((faq) => (
            <div
              key={faq.id}
              className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <button
                onClick={() => toggleItem(faq.id)}
                className="w-full px-6 py-4 text-left focus:outline-none focus:ring-2 focus:ring-oyoGreen focus:ring-inset"
                aria-expanded={openItems.includes(faq.id)}
                aria-controls={`faq-answer-${faq.id}`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800 pr-4">
                    {faq.question}
                  </h3>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-oyoGreen transition-transform duration-300 ${
                      openItems.includes(faq.id) ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>
              
              <div
                id={`faq-answer-${faq.id}`}
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openItems.includes(faq.id) 
                    ? 'max-h-96 opacity-100' 
                    : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-4">
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-gray-700 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-16 bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Still Have Questions?
          </h2>
          <p className="text-gray-600 mb-6">
            Can't find the answer you're looking for? Our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:0800-PENSION"
              className="inline-flex items-center px-6 py-3 bg-oyoGreen text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-oyoGreen focus:ring-offset-2"
            >
              📞 Call Support
            </a>
            <a
              href="mailto:support@oyopension.com"
              className="inline-flex items-center px-6 py-3 bg-oyoOrange text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-oyoOrange focus:ring-offset-2"
            >
              ✉️ Email Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
