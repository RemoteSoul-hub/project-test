import React from 'react';
import { X } from 'lucide-react';

/**
 * EmailViewerModal - A modal component for viewing email details
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when closing the modal
 * @param {Object} props.email - Email object to display
 * @param {string} props.email.id - Email ID
 * @param {string} props.email.to - Email recipient
 * @param {string} props.email.from_name - Sender name
 * @param {string} props.email.from_email - Sender email
 * @param {string} props.email.subject - Email subject
 * @param {string} props.email.body - Email body (HTML)
 * @param {string} props.email.sent_at - Date/time email was sent
 */
const EmailViewerModal = ({ isOpen, onClose, email }) => {
  if (!isOpen || !email) return null;

  // Format the sent date
  const sentDate = new Date(email.sent_at).toLocaleString();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Modal header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Email Details</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Email metadata */}
        <div className="p-4 border-b space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <p className="text-sm text-gray-600">From:</p>
              <p className="font-medium">{email.from_name} &lt;{email.from_email}&gt;</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">To:</p>
              <p className="font-medium">{email.to}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Subject:</p>
            <p className="font-medium">{email.subject}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Sent:</p>
            <p className="font-medium">{sentDate}</p>
          </div>
        </div>
        
        {/* Email content */}
        <div className="flex-1 overflow-auto p-4">
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: email.body }}
          />
        </div>
      </div>
    </div>
  );
};

export default EmailViewerModal;