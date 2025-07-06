'use client';
import { useState } from 'react';
import Image from 'next/image';

/**
 * A form component that handles user profile data and image upload,
 * matching the design from your screenshot.
 */
export default function ProfileDetailsTab() {
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [formData, setFormData] = useState({
    username: 'Adrian',
    invoicingEmail: '',
    invoicingEmailCC: '',
    vatNumber: '',
    salesAgent: '',
    hubspotLink: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    company: '',
    language: 'English',
    password: '',
    confirmPassword: '',
  });

  // Handle text input changes
  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  // Handle the file input for profile photo
  function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (file) {
      // Create a temporary preview URL
      setProfilePhoto(URL.createObjectURL(file));
    }
  }

  // For demonstration; adapt to your real submission logic
  function handleSubmit(e) {
    e.preventDefault();
    alert('Profile details saved!');
    // ...send formData to your API or do other logic
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="w-full max-w-4xl">
        {/* Profile Photo + Upload Section */}
        <div className="flex flex-col md:flex-row mb-6 gap-6 items-start">
          {/* Left: Displayed profile photo & note */}
          <div className="flex flex-col items-center text-center md:w-1/3">
            <div className="w-24 h-24 rounded-full overflow-hidden mb-2">
              {profilePhoto ? (
                // Show selected photo preview
                <img
                  src={profilePhoto}
                  alt="Profile"
                  className="object-cover w-full h-full"
                />
              ) : (
                // Default placeholder if no photo is selected
                <Image
                  src="https://www.svgrepo.com/show/452030/avatar-default.svg"
                  alt="Default Avatar"
                  className="object-cover w-full h-full"
                  layout="responsive"
                  width={100}
                  height={100}
                />
              )}
            </div>
            <p className="text-sm text-gray-500">
              This will be displayed on your profile.
            </p>
          </div>

          {/* Right: Drag-and-drop / click-to-upload area */}
          <label className="border-2 border-gray-300 border-dashed rounded-md p-4 flex flex-col items-center justify-center cursor-pointer relative md:w-2/3">
            <p className="text-blue-600 mb-1">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-500">
              SVG, PNG, JPG or GIF (max. 800×400px)
            </p>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.gif,.svg"
              onChange={handlePhotoUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>
        </div>

        {/* Username */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Username</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            className="border rounded-md w-full px-3 py-2"
          />
        </div>

        {/* Invoicing Email */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Invoicing email address</label>
          <input
            type="email"
            name="invoicingEmail"
            value={formData.invoicingEmail}
            onChange={handleInputChange}
            placeholder="Enter email address"
            className="border rounded-md w-full px-3 py-2"
          />
        </div>

        {/* Invoicing Email (CC) */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">
            Invoicing email address (cc)
            <span className="block text-sm text-gray-400">
              Use a comma as a separator
            </span>
          </label>
          <input
            type="text"
            name="invoicingEmailCC"
            value={formData.invoicingEmailCC}
            onChange={handleInputChange}
            placeholder="Enter additional email address"
            className="border rounded-md w-full px-3 py-2"
          />
        </div>

        {/* VAT Number */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">VAT No.</label>
          <input
            type="text"
            name="vatNumber"
            value={formData.vatNumber}
            onChange={handleInputChange}
            placeholder="Enter VAT number"
            className="border rounded-md w-full px-3 py-2"
          />
        </div>

        {/* Sales Agent */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Sales Agent</label>
          <input
            type="text"
            name="salesAgent"
            value={formData.salesAgent}
            onChange={handleInputChange}
            placeholder="Enter sales agent"
            className="border rounded-md w-full px-3 py-2"
          />
        </div>

        {/* Hubspot Link */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Hubspot Link</label>
          <input
            type="text"
            name="hubspotLink"
            value={formData.hubspotLink}
            onChange={handleInputChange}
            placeholder="Enter Hubspot link"
            className="border rounded-md w-full px-3 py-2"
          />
        </div>

        {/* Name (First / Last) */}
        <div className="mb-4 flex flex-col md:flex-row gap-4">
          <div className="md:w-1/2">
            <label className="block mb-1 font-medium">First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="First name"
              className="border rounded-md w-full px-3 py-2"
            />
          </div>
          <div className="md:w-1/2">
            <label className="block mb-1 font-medium">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Last name"
              className="border rounded-md w-full px-3 py-2"
            />
          </div>
        </div>

        {/* Phone Number */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Phone Number</label>
          <input
            type="text"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            placeholder="Enter phone number"
            className="border rounded-md w-full px-3 py-2"
          />
        </div>

        {/* Company */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Company</label>
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleInputChange}
            placeholder="Enter company name"
            className="border rounded-md w-full px-3 py-2"
          />
        </div>

        {/* Language (dropdown) */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Language</label>
          <select
            name="language"
            value={formData.language}
            onChange={handleInputChange}
            className="border rounded-md w-full px-3 py-2"
          >
            <option value="English">English</option>
            <option value="French">French</option>
            <option value="Spanish">Spanish</option>
            <option value="German">German</option>
            {/* Add or modify options as needed */}
          </select>
        </div>

        {/* Password */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="border rounded-md w-full px-3 py-2"
          />
        </div>

        {/* Confirm Password */}
        <div className="mb-6">
          <label className="block mb-1 font-medium">Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="Enter password again"
            className="border rounded-md w-full px-3 py-2"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 rounded-md border border-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-blue-600 text-white"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
