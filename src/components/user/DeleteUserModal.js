'use client'
import Modal from '@/components/Modal';

/**
 * Delete User Confirmation Modal
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onClose - Function to call when the modal is closed
 * @param {function} props.onConfirm - Function to call when deletion is confirmed
 * @param {Object} props.user - User object containing information about the user to delete
 */
export default function DeleteUserModal({ isOpen, onClose, onConfirm, user }) {
  if (!user) return null;
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete User"
      size="md"
    >
      <div className="flex flex-col gap-4">
        <p className="text-gray-700">
          Are you sure you want to delete this user?
        </p>
        
        <div className="bg-gray-50 p-4 rounded-md">
          <p className="font-medium text-gray-900">{user.name || user.username}</p>
          <p className="text-gray-500">{user.email}</p>
        </div>
        
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            No
          </button>
          <button
            onClick={() => onConfirm(user.id)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}
