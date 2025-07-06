'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import EmailEditor from '@/components/editor/EmailEditor';
import AdminApiService from '@/services/adminApiService';
import { useAuth } from '@/components/providers/AuthProvider';

const availableLanguages = [
  { name: 'English', value: 'en' }, // English is the default, not for 'translations' array
  { name: 'Spanish', value: 'es' },
  { name: 'Portuguese', value: 'pt' },
  { name: 'German', value: 'de' },
  { name: 'French', value: 'fr' },
  { name: 'Italian', value: 'it' },
  { name: 'Japanese', value: 'ja' },
  { name: 'Chinese', value: 'zh' },
  { name: 'Korean', value: 'ko' },
];

const DEFAULT_LANGUAGE_CODE = 'en';

export default function AddEmailTemplatePage() {
  const { token } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    subject: '', // For default language (English)
    body: '',    // For default language (English)
    header: '',
    footer: '',
    is_active: true,
    tags: [],
    translations: [], // For *other* languages
  });
  
  const [activeMainTab, setActiveMainTab] = useState('Default Content (EN)');
  // activeLanguageTab is for sub-tabs within 'Translations' main tab
  const [activeLanguageTab, setActiveLanguageTab] = useState(''); 
  // previewingContent determines what's shown in Preview tab
  const [previewingContent, setPreviewingContent] = useState({ lang: DEFAULT_LANGUAGE_CODE, subject: formData.subject, body: formData.body });


  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Update preview content when relevant data changes
  useEffect(() => {
    // Determine current content based on active tab and language
    const getContentForPreview = () => {
      if (activeMainTab === 'Default Content (EN)') {
        return {
          lang: DEFAULT_LANGUAGE_CODE,
          subject: formData.subject,
          body: formData.body
        };
      } 
      
      if (activeMainTab === 'Translations' && activeLanguageTab) {
        const trans = formData.translations.find(t => t.language === activeLanguageTab);
        if (trans) {
          return {
            lang: trans.language,
            subject: trans.subject,
            body: trans.body
          };
        }
      }
      
      // Default fallback
      return {
        lang: DEFAULT_LANGUAGE_CODE,
        subject: formData.subject,
        body: formData.body
      };
    };
    
    const content = getContentForPreview();
    setPreviewingContent({
      ...content,
      header: formData.header,
      footer: formData.footer
    });
  }, [formData.subject, formData.body, formData.translations, activeMainTab, activeLanguageTab, formData.header, formData.footer]);


  // Memoized current *additional* translation object based on activeLanguageTab
  const currentEditingAdditionalTranslation = useMemo(() => {
    if (activeMainTab === 'Translations' && activeLanguageTab) {
      return formData.translations.find(t => t.language === activeLanguageTab);
    }
    return null;
  }, [formData.translations, activeLanguageTab, activeMainTab]);

  useEffect(() => {
    // Ensure activeLanguageTab is valid if 'Translations' tab is active
    if (activeMainTab === 'Translations') {
      if (formData.translations.length > 0 && !formData.translations.some(t => t.language === activeLanguageTab)) {
        setActiveLanguageTab(formData.translations[0].language);
      } else if (formData.translations.length === 0) {
        setActiveLanguageTab(''); // No additional translations to select
      }
    }
  }, [formData.translations, activeMainTab, activeLanguageTab]);


  const handleGeneralChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // Handlers for default language content
  const handleDefaultSubjectChange = (e) => setFormData(prev => ({ ...prev, subject: e.target.value }));
  const handleDefaultBodyChange = (content) => setFormData(prev => ({ ...prev, body: content }));

  // Handlers for *additional* translations' content
  const handleAdditionalSubjectChange = (newSubject) => {
    setFormData(prev => ({
      ...prev,
      translations: prev.translations.map(t =>
        t.language === activeLanguageTab ? { ...t, subject: newSubject } : t
      ),
    }));
  };
  const handleAdditionalBodyChange = (newBody) => {
    setFormData(prev => ({
      ...prev,
      translations: prev.translations.map(t =>
        t.language === activeLanguageTab ? { ...t, body: newBody } : t
      ),
    }));
  };
  
  const handleHeaderChange = (content) => setFormData(prev => ({ ...prev, header: content }));
  const handleFooterChange = (content) => setFormData(prev => ({ ...prev, footer: content }));

  const handleAddTranslationLanguage = (langCodeToAdd) => {
    if (langCodeToAdd === DEFAULT_LANGUAGE_CODE || formData.translations.some(t => t.language === langCodeToAdd)) return;

    const newTranslation = {
      language: langCodeToAdd,
      subject: formData.subject, // Copy from default English subject
      body: formData.body,       // Copy from default English body
    };
    setFormData(prev => ({ ...prev, translations: [...prev.translations, newTranslation] }));
    setActiveMainTab('Translations'); // Ensure translations tab is active
    setActiveLanguageTab(langCodeToAdd); // Switch to newly added language tab
  };

  const handleRemoveTranslationLanguage = (langCodeToRemove) => {
    setError("");
    const updatedTranslations = formData.translations.filter(t => t.language !== langCodeToRemove);
    setFormData(prev => ({ ...prev, translations: updatedTranslations }));
    
    if (activeLanguageTab === langCodeToRemove) {
      setActiveLanguageTab(updatedTranslations.length > 0 ? updatedTranslations[0].language : '');
    }
  };

  // Tag management
  const [newTag, setNewTag] = useState({ tag: '', is_required: false });
  const [editingTagIndex, setEditingTagIndex] = useState(-1);
  const handleTagChange = (e) => { const { name, value, type, checked } = e.target; setNewTag({ ...newTag, [name]: type === 'checkbox' ? checked : value }); };
  const addTag = () => {
    if (!newTag.tag.trim()) return;
    const newTagsList = [...formData.tags];
    if (editingTagIndex >= 0) newTagsList[editingTagIndex] = newTag; else newTagsList.push(newTag);
    setFormData(prev => ({ ...prev, tags: newTagsList }));
    setNewTag({ tag: '', is_required: false }); setEditingTagIndex(-1);
  };
  const editTag = (index) => { setNewTag({ ...formData.tags[index] }); setEditingTagIndex(index); };
  const removeTag = (index) => {
    const updatedTags = formData.tags.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, tags: updatedTags }));
    if (editingTagIndex === index) { setEditingTagIndex(-1); setNewTag({ tag: '', is_required: false });}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) { setError('Authentication token is missing.'); setIsSubmitting(false); return; }

    // Validate default content
    if (!formData.subject.trim() || !formData.body.trim()) {
      setError(`Default (English) Subject and Body are required.`);
      setActiveMainTab('Default Content (EN)');
      setIsSubmitting(false); return;
    }
    // Validate additional translations
    for (const t of formData.translations) {
      if (!t.subject.trim() || !t.body.trim()) {
        setError(`Subject and Body are required for language: ${getLanguageName(t.language)}. Please fill them or remove the language.`);
        setActiveMainTab('Translations'); setActiveLanguageTab(t.language);
        setIsSubmitting(false); return;
      }
    }
    setError(''); setIsSubmitting(true);
    try {
      // Construct payload ensuring top-level language field for 'en'
      const payload = {
        ...formData,
        language: DEFAULT_LANGUAGE_CODE, // Add language: 'en' to the main payload
      };
      await AdminApiService.createEmailTemplate(token, payload);
      router.push('/admin/email-templates');
    } catch (err) {
      console.error('Error creating template:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create template');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getLanguageName = (langCode) => availableLanguages.find(l => l.value === langCode)?.name || langCode;

  const mainTabsConfig = [
    { name: 'Default Content (EN)', key: 'Default Content (EN)' },
    { name: 'Translations', key: 'Translations' },
    { name: 'Header', key: 'Header' },
    { name: 'Footer', key: 'Footer' },
    { name: 'Tags', key: 'Tags' },
    { name: 'Preview', key: 'Preview' },
  ];
  
  const handleMainTabClick = (tabKey) => {
    setActiveMainTab(tabKey);
    // Update previewing content when main tab changes
    if (tabKey === 'Default Content (EN)') {
        setPreviewingContent({ lang: DEFAULT_LANGUAGE_CODE, subject: formData.subject, body: formData.body, header: formData.header, footer: formData.footer });
    } else if (tabKey === 'Translations') {
        const langToPreview = activeLanguageTab || (formData.translations.length > 0 ? formData.translations[0].language : DEFAULT_LANGUAGE_CODE);
        const contentToPreview = langToPreview === DEFAULT_LANGUAGE_CODE 
            ? { subject: formData.subject, body: formData.body } 
            : formData.translations.find(t => t.language === langToPreview) || { subject: '', body: ''};
        setPreviewingContent({ lang: langToPreview, ...contentToPreview, header: formData.header, footer: formData.footer });
    }
  };


  return (
    <div className="container mx-auto p-4 md:p-8 bg-gray-50 min-h-screen">
      <header className="mb-8"><h1 className="text-3xl font-bold text-gray-800">Create New Email Template</h1></header>
      {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert"><p className="font-bold">Error</p><p>{error}</p></div>}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-4 md:p-8 rounded-lg shadow-lg">
        <section className="border-b pb-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Template Name</h2>
          <input type="text" id="name" name="name" value={formData.name} onChange={handleGeneralChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-1.5 md:p-2" required placeholder="e.g., Welcome Email Series"/>
        </section>

        <div className="border-b border-gray-200 mb-4">
          <nav className="-mb-px flex space-x-4" aria-label="Main Tabs">
            {mainTabsConfig.map((tab) => (
              <button key={tab.key} type="button" onClick={() => handleMainTabClick(tab.key)}
                className={`capitalize whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm ${
                  activeMainTab === tab.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >{tab.name}</button>
            ))}
          </nav>
        </div>

        <div className="mt-4 min-h-[500px]"> {/* Ensure content area has enough height */}
          {activeMainTab === 'Default Content (EN)' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="defaultSubject" className="block text-sm font-medium text-gray-700 mb-1">Subject (English - Default)</label>
                <input type="text" id="defaultSubject" value={formData.subject} onChange={handleDefaultSubjectChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-1.5 md:p-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body (English - Default)</label>
                <EmailEditor content={formData.body} onChange={handleDefaultBodyChange} height={400} />
              </div>
            </div>
          )}

          {activeMainTab === 'Translations' && (
            <div>
              <div className="mb-6 pb-6 border-b">
                <h3 className="text-md font-semibold text-gray-700 mb-3">Manage Additional Languages</h3>
                <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                  {formData.translations.map(t => (
                    <div key={t.language} className="flex items-center justify-between p-2 border rounded-md bg-gray-50">
                      <span>{getLanguageName(t.language)} ({t.language})</span>
                      <button type="button" onClick={() => handleRemoveTranslationLanguage(t.language)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium">Remove</button>
                    </div>
                  ))}
                </div>
                <div className="flex items-end gap-2">
                  <select id="addLanguageSelect" className="mt-1 block w-auto rounded-md border-gray-300 shadow-sm p-1.5 md:p-2 text-sm" defaultValue="">
                    <option value="" disabled>Select language to add...</option>
                    {availableLanguages.filter(al => al.value !== DEFAULT_LANGUAGE_CODE && !formData.translations.some(t => t.language === al.value)).map(lang => (
                      <option key={lang.value} value={lang.value}>{lang.name} ({lang.value})</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => {
                      const select = document.getElementById('addLanguageSelect');
                      if (select.value) { handleAddTranslationLanguage(select.value); select.value = "";}
                    }}
                    className="px-2 md:px-3 py-1.5 md:py-2 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                    disabled={availableLanguages.filter(al => al.value !== DEFAULT_LANGUAGE_CODE && !formData.translations.some(t => t.language === al.value)).length === 0}
                  >Add Language</button>
                </div>
              </div>
              {formData.translations.length > 0 && (
                <div className="border-b border-gray-200 mb-4">
                  <nav className="-mb-px flex space-x-2 overflow-x-auto pb-px" aria-label="Language Tabs">
                    {formData.translations.map(t => (
                      <button key={t.language} type="button" onClick={() => setActiveLanguageTab(t.language)}
                        className={`whitespace-nowrap py-2 px-3 border-b-2 font-medium text-xs rounded-t-md ${
                          activeLanguageTab === t.language ? 'border-indigo-500 text-indigo-600 bg-indigo-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >{getLanguageName(t.language)}</button>
                    ))}
                  </nav>
                </div>
              )}
              
              {currentEditingAdditionalTranslation && activeLanguageTab && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor={`subject-${activeLanguageTab}`} className="block text-sm font-medium text-gray-700 mb-1">
                      Subject ({getLanguageName(activeLanguageTab)})
                    </label>
                    <input type="text" id={`subject-${activeLanguageTab}`} value={currentEditingAdditionalTranslation.subject}
                      onChange={(e) => handleAdditionalSubjectChange(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-1.5 md:p-2" required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Body ({getLanguageName(activeLanguageTab)})</label>
                    <EmailEditor content={currentEditingAdditionalTranslation.body} onChange={handleAdditionalBodyChange} height={400} />
                  </div>
                </div>
              )}
              {formData.translations.length === 0 && (
                <p className="text-gray-500 text-center py-4">No additional translations added yet. Add one below.</p>
              )}
            </div>
          )}

          {activeMainTab === 'Header' && <EmailEditor content={formData.header} onChange={handleHeaderChange} height={400} />}
          {activeMainTab === 'Footer' && <EmailEditor content={formData.footer} onChange={handleFooterChange} height={400} />}
          {activeMainTab === 'Tags' && ( /* Tag Management UI from previous version */ 
            <div className="p-2">
              <h3 className="text-lg font-medium text-gray-800 mb-3">Manage Template Tags</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-2 md:p-4 border rounded-md bg-white">
                <div className="md:col-span-2">
                  <label htmlFor="tag" className="block text-sm font-medium text-gray-700 mb-1">Tag Name</label>
                  <input type="text" id="tag" name="tag" value={newTag.tag} onChange={handleTagChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-1.5 md:p-2" placeholder="e.g. user_name"/>
                </div>
                <div className="flex items-end space-x-3">
                  <div className="flex items-center pt-5">
                    <input id="is_required" name="is_required" type="checkbox" checked={newTag.is_required} onChange={handleTagChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"/>
                    <label htmlFor="is_required" className="ml-2 block text-sm text-gray-900">Required</label>
                  </div>
                  <button type="button" onClick={addTag}
                    className="px-3 md:px-4 py-1.5 md:py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                    {editingTagIndex >= 0 ? 'Update Tag' : 'Add Tag'}
                  </button>
                </div>
              </div>
              <div className="border rounded-md overflow-hidden bg-white">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100"><tr>
                      <th className="px-2 md:px-4 py-1.5 md:py-3 text-left text-xs font-medium text-gray-600 uppercase">Tag Name</th>
                      <th className="px-2 md:px-4 py-1.5 md:py-3 text-left text-xs font-medium text-gray-600 uppercase">Required</th>
                      <th className="px-2 md:px-4 py-1.5 md:py-3 text-left text-xs font-medium text-gray-600 uppercase">Actions</th>
                  </tr></thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.tags.length === 0 ? (
                      <tr><td colSpan="3" className="px-2 md:px-4 py-4 text-sm text-gray-500 text-center">No tags.</td></tr>
                    ) : ( formData.tags.map((tag, index) => (
                        <tr key={index} className={editingTagIndex === index ? 'bg-blue-50' : ''}>
                          <td className="px-2 md:px-4 py-1.5 md:py-3 text-sm text-gray-800">{tag.tag}</td>
                          <td className="px-2 md:px-4 py-1.5 md:py-3 text-sm">
                            {tag.is_required ? <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">Yes</span> : <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">No</span>}
                          </td>
                          <td className="px-2 md:px-4 py-1.5 md:py-3 text-sm space-x-2">
                            <button type="button" onClick={() => editTag(index)} className="text-indigo-600 hover:text-indigo-900 font-medium">Edit</button>
                            <button type="button" onClick={() => removeTag(index)} className="text-red-600 hover:text-red-900 font-medium">Delete</button>
                          </td>
                        </tr>)))}
                  </tbody></table></div></div>
           )}

          {activeMainTab === 'Preview' && (
            <div className="bg-white rounded border p-2 md:p-4 min-h-[400px] prose max-w-none">
              <h3 className="text-lg font-semibold mb-2">Live Preview ({getLanguageName(previewingContent.lang)})</h3>
              <div className="border p-1.5 md:p-2 rounded">
                  {previewingContent.header && <div dangerouslySetInnerHTML={{ __html: previewingContent.header }} />}
                  <div dangerouslySetInnerHTML={{ __html: previewingContent.body || '<p>No body content for this language.</p>' }} />
                  {previewingContent.footer && <div dangerouslySetInnerHTML={{ __html: previewingContent.footer }} />}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-6 border-t mt-6">
          <div className="flex items-center">
            <input id="is_active" name="is_active" type="checkbox" checked={formData.is_active} onChange={handleGeneralChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"/>
            <label htmlFor="is_active" className="ml-2 block text-sm font-medium text-gray-900">Set as Active Template</label>
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={() => router.push('/admin/email-templates')} disabled={isSubmitting}
              className="px-3 md:px-4 py-1.5 md:py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={isSubmitting || !token}
              className="px-4 md:px-6 py-1.5 md:py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
              {isSubmitting ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
