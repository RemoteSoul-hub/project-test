'use client';
import React, { useState } from 'react';
import Modal from '../Modal';
import Image from 'next/image'; // Import Next.js Image component
import ThLogo from '@/assets/images/th.png'; // Placeholder, assuming th.png is not available
import ApiService from '@/services/apiService';
import { getUser } from '@/services/AuthService';

const ContactSalesModal = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitted(false);
    // Get user id from AuthService
    const user = getUser();
    const userId = user?.id;
    try {
      await ApiService.post('/support-email', {
        message,
        'user_id': userId,
      });
      setIsSubmitted(true);
    } catch (err) {
      // Optionally show error to user
      alert(err?.message || 'Failed to send request.');
    }
  };

  const handleCloseModal = () => {
    setIsSubmitted(false); // Reset submission state when closing
    setMessage(''); // Clear message
    onClose();
  };

  // Target dimensions: 777x499px. Using Tailwind's 3xl (768px) for width.
  // Height will be controlled by content, aiming for approx 499px.
  // Target content height around 420px (499px total - ~50px for header - ~30px for padding)
  const contentHeight = { height: '420px' };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleCloseModal} 
      title="Dedicated Server Inquiry" 
      size="3xl"
      showTitleSeparator={true}
      closeOnClickOutside={false} // Prevent closing on outside click
      confirmOnClose={true}       // Enable confirmation before closing
    >
      {isSubmitted ? (
        <div className="text-center p-8 flex flex-col justify-center items-center" style={contentHeight}>
          <div className="mb-6">
            {/* Using Next/Image. Replace src with actual th.png path if available in public folder e.g. /assets/images/th.png */}
            {/* Using imported SVG as a placeholder */}
            <Image src={ThLogo} alt="Company Logo" width={80} height={80} />
            {/* If th.png is in public/assets/images/th.png:
            <Image src="/assets/images/th.png" alt="Company Logo" width={80} height={80} />
            */}
          </div>
          <h2 className="text-4xl font-bold mb-3 text-gray-900">Thank you!</h2>
          <p className="text-3xl font-semibold mb-6" style={{ color: '#581c87' }}> {/* Darker Purple for better contrast potentially */}
            Your request has been sent
          </p>
          <p className="text-gray-700 text-base leading-relaxed">
            {/* This line was moved to the form section */}
            We'll get back to you with a tailored proposal <span className="font-semibold" style={{ color: '#581c87' }}>within 1 working day.</span>
          </p>
        </div>
      ) : (
        // Form takes full height of the content area defined by contentHeight
        // Modal's internal padding (p-4) will apply around this form
        <form onSubmit={handleSubmit} className="flex flex-col pt-4" style={contentHeight}> {/* Added pt-4 to compensate for removed h1 margin if needed */}
          <div className=""> {/* Label for textarea */}
            {/* Removed h1 title from here, it's now passed to Modal component */}
            <h2 className="text-lg text-gray-700">
            Please detail what dedicated server and in which of our locations are you wanting to launch? We will then raise a quote to your inbox.
            </h2>
            <label htmlFor="sales-message" className="block text-md font-medium text-gray-500 mt-4">
            Coming soon: automated real-time checkout flow with same day hardware delivery.
            </label>
          </div>
          {/* Textarea container grows to fill available space */}
          <div className="flex-grow mb-4">
            <textarea
              id="sales-message"
              name="sales-message"
              className="w-full h-full p-3 border border-gray-300 rounded-lg focus:ring-purple-600 focus:border-purple-600 text-base resize-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please provide details about your project or requirements..."
              required
            ></textarea>
          </div>
          {/* Buttons aligned to the bottom right */}
          <div className="flex justify-end mt-auto">
            <button
              type="button"
              onClick={handleCloseModal}
              className="mr-2 px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Send Request
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default ContactSalesModal;
