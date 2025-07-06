'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import EmailEditor from '@/components/editor/EmailEditor';
import AdminApiService from '@/services/adminApiService';

export default function EmailTemplateModal({
  open,
  onClose,
  template,
  token
}) {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    header: '',
    footer: '',
    is_active: true,
    language: 'en',
    tags: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('content');

  // Load template data when provided
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        subject: template.subject || '',
        body: template.body || '',
        header: template.header || '',
        footer: template.footer || '',
        is_active: template.is_active === 1 || template.is_active === true,
        language: template.language || 'en',
        tags: template.tags || [],
      });
    }
  }, [template]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleBodyChange = (content) => {
    setFormData({
      ...formData,
      body: content
    });
  };

  const handleHeaderChange = (content) => {
    setFormData({
      ...formData,
      header: content
    });
  };

  const handleFooterChange = (content) => {
    setFormData({
      ...formData,
      footer: content
    });
  };

  // Tag management functions
  const [newTag, setNewTag] = useState({ tag: '', is_required: false });
  const [editingTagIndex, setEditingTagIndex] = useState(-1);
  
  const handleTagChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewTag({
      ...newTag,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const addTag = () => {
    if (!newTag.tag.trim()) return;
    
    if (editingTagIndex >= 0) {
      // Update existing tag
      const updatedTags = [...formData.tags];
      updatedTags[editingTagIndex] = newTag;
      setFormData({
        ...formData,
        tags: updatedTags
      });
      setEditingTagIndex(-1);
    } else {
      // Add new tag
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag]
      });
    }
    
    // Reset form
    setNewTag({ tag: '', is_required: false });
  };

  const editTag = (index) => {
    setNewTag({ ...formData.tags[index] });
    setEditingTagIndex(index);
  };

  const removeTag = (index) => {
    const updatedTags = [...formData.tags];
    updatedTags.splice(index, 1);
    setFormData({
      ...formData,
      tags: updatedTags
    });
    
    if (editingTagIndex === index) {
      setEditingTagIndex(-1);
      setNewTag({ tag: '', is_required: false });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (template && template.id) {
        // Update existing template
        await AdminApiService.updateEmailTemplate(token, template.id, formData);
      } else {
        // Create new template
        await AdminApiService.createEmailTemplate(token, formData);
      }
      onClose(true); // Close with refresh indication
    } catch (err) {
      console.error('Error saving template:', err);
      setError(err.message || 'Failed to save template');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onRequestClose={() => !isSubmitting && onClose(false)}
      title={template ? `Edit Email Template: ${template.name}` : 'New Email Template'}
      size="4xl"
    >
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Template Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
            Email Subject
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        {/* Language Selector */}
        <label htmlFor="language" className="block text-sm font-medium text-gray-700">
          Language
        </label>
        <select
          id="language"
          name="language"
          value={formData.language}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="it">Italian</option>
          <option value="pt">Portuguese</option>
        </select>

        <div className="mb-4">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                type="button"
                onClick={() => setActiveTab('content')}
                className={`w-1/5 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'content'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Main Content
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('header')}
                className={`w-1/5 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'header'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Header
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('footer')}
                className={`w-1/5 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'footer'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Footer
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('tags')}
                className={`w-1/5 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'tags'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Tags
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`w-1/5 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'preview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Preview
              </button>
            </nav>
          </div>

          <div className="mt-4">
            {activeTab === 'content' && (
              <div>
                <EmailEditor
                  content={formData.body}
                  onChange={handleBodyChange}
                  height={400}
                  showValidation={false}
                />
              </div>
            )}

            {activeTab === 'header' && (
              <div>
                <EmailEditor
                  content={formData.header}
                  onChange={handleHeaderChange}
                  height={400}
                  showValidation={false}
                />
              </div>
            )}

            {activeTab === 'footer' && (
              <div>
                <EmailEditor
                  content={formData.footer}
                  onChange={handleFooterChange}
                  height={400}
                  showValidation={false}
                />
              </div>
            )}

            {activeTab === 'tags' && (
              <div className="min-h-[400px] bg-white p-4">
                <div className="mb-5">
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Manage Template Tags</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Tags can be used as placeholders for dynamic content in your email templates.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="col-span-2">
                      <label htmlFor="tag" className="block text-sm font-medium text-gray-700">
                        Tag Name
                      </label>
                      <input
                        type="text"
                        id="tag"
                        name="tag"
                        value={newTag.tag}
                        onChange={handleTagChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter tag name (e.g. user_name, company, etc)"
                      />
                    </div>
                    <div className="flex items-end">
                      <div className="flex items-center h-10">
                        <input
                          id="is_required"
                          name="is_required"
                          type="checkbox"
                          checked={newTag.is_required}
                          onChange={handleTagChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_required" className="ml-2 block text-sm text-gray-900">
                          Required Tag
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={addTag}
                        className="ml-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {editingTagIndex >= 0 ? 'Update Tag' : 'Add Tag'}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tag Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Required
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formData.tags.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                            No tags added yet
                          </td>
                        </tr>
                      ) : (
                        formData.tags.map((tag, index) => (
                          <tr key={index} className={editingTagIndex === index ? 'bg-blue-50' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {tag.tag}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {tag.is_required ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Yes
                                </span>
                              ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                  No
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                type="button"
                                onClick={() => editTag(index)}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => removeTag(index)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-md font-medium text-gray-700 mb-2">How to use tags in your template</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm text-gray-700">
                    <p>Insert tags in your template using the following format: <code className="bg-gray-200 px-1 py-0.5 rounded">{'{{tag_name}}'}</code></p>
                    <p className="mt-2">Example: <code className="bg-gray-200 px-1 py-0.5 rounded">Hello {'{{user_name}}'}, welcome to {'{{company_name}}'}</code></p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preview' && (
              <div className="bg-white rounded border p-4 min-h-[400px]">
                <div dangerouslySetInnerHTML={{ __html: formData.header }} />
                <div dangerouslySetInnerHTML={{ __html: formData.body }} />
                <div dangerouslySetInnerHTML={{ __html: formData.footer }} />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="is_active"
            name="is_active"
            type="checkbox"
            checked={formData.is_active}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
            Active Template
          </label>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => onClose(false)}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              'Save Template'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
