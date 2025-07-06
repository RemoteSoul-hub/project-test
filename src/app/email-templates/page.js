'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image'; // Added for icons
import ApiService from '@/services/apiService';
import SimpleEmailEditor from '@/components/editor/SimpleEmailEditor';

const getLanguagePreference = (templateId) => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(`template_lang_${templateId}`);
  }
  return null;
};

const setLanguagePreference = (templateId, language) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`template_lang_${templateId}`, language);
  }
};

const languages = [
  { name: 'English', value: 'en' },
  { name: 'Spanish', value: 'es' },
  { name: 'Portuguese', value: 'pt' },
  { name: 'German', value: 'de' },
  { name: 'French', value: 'fr' },
  { name: 'Italian', value: 'it' },
  { name: 'Japanese', value: 'ja' },
  { name: 'Chinese', value: 'zh' },
  { name: 'Korean', value: 'ko' },
];

export default function EmailsPage() {
  const [activeTemplateId, setActiveTemplateId] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [partnerTranslatedTemplates, setPartnerTranslatedTemplates] = useState([]);
  const [emailContents, setEmailContents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [partnerId, setPartnerId] = useState(null); 
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [confirmingRevertId, setConfirmingRevertId] = useState(null);
  const [isTestEmailSectionOpen, setIsTestEmailSectionOpen] = useState(false);
  const { data: session } = useSession();

  const getDisplayContent = (template, pId, language, partnerTranslations) => {
    if (!template || pId === null) {
      return { subject: template?.subject || '', body: template?.body || '', source: 'base_or_no_template', partnerTranslationRecord: null };
    }
    
    const specificPartnerTranslation = partnerTranslations.find(ptt => 
      ptt.email_partner_template?.email_template_id === template.id &&
      ptt.email_partner_template?.partner_id === pId &&
      ptt.language === language
    );
    
    if (specificPartnerTranslation) {
      return { subject: specificPartnerTranslation.subject, body: specificPartnerTranslation.body, source: 'partner_translation', partnerTranslationRecord: specificPartnerTranslation };
    }
    
    const partnerLangOverride = template.partner_templates?.find(
      pt => pt.partner_id === pId && pt.language === language
    );
    
    if (partnerLangOverride) {
      return { subject: partnerLangOverride.subject, body: partnerLangOverride.body, source: 'partner_override', partnerTranslationRecord: null };
    }
    
    if (language !== template.language) {
      const translation = template.translations?.find(t => t.language === language);
      if (translation) {
        return { subject: translation.subject, body: translation.body, source: 'standard_translation', partnerTranslationRecord: null };
      }
    }
    
    return { subject: template.subject, body: template.body, source: 'base_template', partnerTranslationRecord: null };
  };
  
  const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);
  const formatTagName = (tagName) => tagName.replace(/_/g, ' ');

  const fetchUserDataAndTemplates = async () => {
    setIsLoading(true); setError(null);
    const fallbackPartnerId = 1; 
    let determinedPId = null;
    const token = session?.laravelApiToken || localStorage.getItem('auth_token');

    try {
      const userResponse = await ApiService.getCurrentUser({ token });
      if (userResponse.data && userResponse.data.partner && typeof userResponse.data.partner.id !== 'undefined') {
        determinedPId = userResponse.data.partner.id;
      } else if (userResponse.data && typeof userResponse.data.partner_id !== 'undefined') {
          determinedPId = userResponse.data.partner_id;
      } else if (userResponse.data && typeof userResponse.data.id !== 'undefined' && !userResponse.data.partner) {
          determinedPId = userResponse.data.id; 
      } else {
        const localUserData = localStorage.getItem('user');
        if (localUserData) {
          try { const user = JSON.parse(localUserData); determinedPId = user.partner_id || fallbackPartnerId; }
          catch (e) { determinedPId = fallbackPartnerId; }
        } else { determinedPId = fallbackPartnerId; }
      }
    } catch (err) {
      console.error('Failed to fetch user data, using fallback partnerId:', err);
      determinedPId = fallbackPartnerId;
    }
    setPartnerId(determinedPId);

    try {
      const authToken = token || localStorage.getItem('auth_token') || localStorage.getItem('laravelApiToken');
      const [templatesResponse, partnerTranslatedResponse] = await Promise.all([
        ApiService.getPartnerTemplates(null, null, { token: authToken }),
        ApiService.getPartnerTranslatedTemplates({ token: authToken }) 
      ]);

      if (templatesResponse.data) {
        setTemplates(templatesResponse.data);
        if (partnerTranslatedResponse.data) {
            setPartnerTranslatedTemplates(partnerTranslatedResponse.data);
        } else {
            setPartnerTranslatedTemplates([]);
        }

        const initialContents = templatesResponse.data.map(t => ({
          to: '', subject: t.subject, body: t.body,
          originalSubject: t.subject, originalBody: t.body,
          tags: t.tags?.reduce((acc, tag) => { acc[tag.tag] = ''; return acc; }, {}) || {},
          source: 'base_template', 
          partnerTranslationRecord: null,
        }));
        setEmailContents(initialContents);

        if (templatesResponse.data.length > 0) {
          let initialActiveId = activeTemplateId;
          // If no activeTemplateId is set from previous state (e.g. page load), or if it's no longer valid
          if (initialActiveId === null || !templatesResponse.data.some(t => t.id === initialActiveId)) {
            initialActiveId = templatesResponse.data[0].id;
            setActiveTemplateId(initialActiveId); 
            // The language for this newly set activeTemplateId will be handled by the useEffect below
          } else {
            // If activeTemplateId is already set and valid, ensure its language is loaded/defaulted
            const currentActiveTemplate = templatesResponse.data.find(t => t.id === initialActiveId);
            if (currentActiveTemplate) {
                 const preferredLang = getLanguagePreference(initialActiveId);
                 setCurrentLanguage(preferredLang || currentActiveTemplate.language || 'en');
            }
          }
        } else {
          setActiveTemplateId(null); setCurrentLanguage('en');
        }
      } else {
        setTemplates([]); setPartnerTranslatedTemplates([]); setEmailContents([]); setActiveTemplateId(null);
      }
    } catch (fetchError) {
      console.error("Error fetching template data:", fetchError)
      setError(fetchError.message || 'Failed to load templates');
      setTemplates([]); setPartnerTranslatedTemplates([]); setEmailContents([]); setActiveTemplateId(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (session !== undefined) { 
        fetchUserDataAndTemplates();
    }
  }, [session]);

  const activeIndex = useMemo(() => 
    templates.findIndex(t => t.id === activeTemplateId), 
    [templates, activeTemplateId]
  );

  useEffect(() => {
    if (activeTemplateId !== null && templates.length > 0) {
      const template = templates.find(t => t.id === activeTemplateId);
      if (template) {
        const preferredLang = getLanguagePreference(activeTemplateId);
        setCurrentLanguage(preferredLang || template.language || 'en');
      }
    }
  }, [activeTemplateId, templates]);


  useEffect(() => {
    if (activeIndex !== -1 && templates[activeIndex] && partnerId !== null && currentLanguage) { 
      const template = templates[activeIndex];
      const { subject: displaySubject, body: displayBody, source, partnerTranslationRecord } = getDisplayContent(template, partnerId, currentLanguage, partnerTranslatedTemplates);
      setEmailContents(prev => {
        const newContents = [...prev];
        if (newContents[activeIndex]) {
          newContents[activeIndex] = {
            ...newContents[activeIndex],
            subject: displaySubject, body: displayBody,
            originalSubject: displaySubject, originalBody: displayBody,
            source: source,
            partnerTranslationRecord: partnerTranslationRecord 
          };
        }
        return newContents;
      });
    }
  }, [activeTemplateId, currentLanguage, templates, partnerId, activeIndex, partnerTranslatedTemplates]);

  const handleLanguageChange = (newLanguage) => {
    setCurrentLanguage(newLanguage);
    if (activeTemplateId !== null) {
      setLanguagePreference(activeTemplateId, newLanguage);
    }
  };

  const handleTagChange = (tagName, value) => setEmailContents(prev => prev.map((item, index) => index === activeIndex ? { ...item, tags: { ...item.tags, [tagName]: value } } : item));
  
  const handleContentChange = (newContent) => setEmailContents(prev => prev.map((item, index) => index === activeIndex ? { ...item, body: newContent } : item));
  const handleSubjectChange = (e) => setEmailContents(prev => prev.map((item, index) => index === activeIndex ? { ...item, subject: e.target.value } : item));
  const handleToChange = (e) => setEmailContents(prev => prev.map((item, index) => index === activeIndex ? { ...item, to: e.target.value } : item));

  const { currentTemplate, currentContent } = useMemo(() => {
    const template = activeIndex !== -1 ? templates[activeIndex] : null;
    const content = activeIndex !== -1 && emailContents[activeIndex] ? emailContents[activeIndex] : { to: '', subject: '', body: '', tags: {}, originalSubject: '', originalBody: '', source: 'unknown', partnerTranslationRecord: null };
    return { currentTemplate: template, currentContent: content };
  }, [templates, emailContents, activeIndex]);

  const contentHasChanged = currentTemplate && currentContent && (currentContent.subject !== currentContent.originalSubject || currentContent.body !== currentContent.originalBody);

  const isOverridden = useMemo(() => {
    if (!currentTemplate || partnerId === null || !currentContent) return false; // Added !currentContent check
    const contentSource = currentContent?.source;
    return contentSource === 'partner_override' || contentSource === 'partner_translation';
  }, [currentTemplate, partnerId, currentLanguage, currentContent]);

  const validateRequiredTagsForSave = () => {
    if (!currentTemplate || !currentContent) return false;
    const { subject, body } = currentContent;
    const missingPlaceholders = currentTemplate.tags?.filter(tag => tag.is_required && !(subject?.includes(`{${tag.tag}}`) || body?.includes(`{${tag.tag}}`))).map(tag => formatTagName(tag.tag));
    if (missingPlaceholders?.length > 0) { setError(`Required tag placeholders missing: ${missingPlaceholders.join(', ')}.`); return false; }
    setError(null); return true;
  };
  
  const handleSend = async () => {
    setIsLoading(true); setError(null); setSuccessMessage(null);
    try {
      const token = session?.laravelApiToken;
      const currentTpl = templates[activeIndex];
      const currentCnt = emailContents[activeIndex];
      if (!currentTpl || !currentCnt) throw new Error("No active template.");
      if (!currentCnt.to) throw new Error('Recipient email is required.');
      const missingTags = currentTpl.tags?.filter(t => t.is_required && !currentCnt.tags[t.tag]).map(t => formatTagName(t.tag));
      if (missingTags?.length > 0) throw new Error(`Required tags missing: ${missingTags.join(', ')}.`);
      const payload = { email: currentCnt.to, template_id: currentTpl.id, data: { ...currentCnt.tags }, from_email: "noreply@thinkhuge.net", from_name: "noreply", name: currentTpl.name };
      await ApiService.sendTestEmailPreview(payload, { token });
      setSuccessMessage('Test email sent successfully!');
      setEmailContents(prev => prev.map((item, index) => index === activeIndex ? { ...item, to: '', tags: Object.fromEntries(Object.keys(item.tags).map(k => [k, ''])) } : item));
    } catch (error) { setError(error.errors?.general?.[0] || error.message || 'Failed to send email.');
    } finally { setIsLoading(false); }
  };

  const handleOverride = async () => { 
    if (!currentTemplate || !currentContent || !validateRequiredTagsForSave()) return;
    setIsProcessingAction(true); setError(null);
    try {
      const token = session?.laravelApiToken;
      const payload = { email_template_id: currentTemplate.id, partner_id: partnerId, subject: currentContent.subject, body: currentContent.body, language: currentLanguage };
      const existingPartnerTemplate = currentTemplate.partner_templates?.find(pt => pt.partner_id === partnerId && pt.language === currentLanguage);
      if (existingPartnerTemplate) {
        await ApiService.updatePartnerEmailTemplate(existingPartnerTemplate.id, { subject: currentContent.subject, body: currentContent.body }, { token });
        setSuccessMessage('Template override updated successfully!');
      } else {
        await ApiService.createPartnerEmailTemplate(payload, { token });
        setSuccessMessage('Template overridden successfully!');
      }
      await fetchUserDataAndTemplates(); 
    } catch (err) { setError(err.message || 'Failed to override/update template.'); setSuccessMessage(null);
    } finally { setIsProcessingAction(false); }
  };

  const handleUpdateTemplate = async () => {
    console.log('[handleUpdateTemplate] Clicked. Validating...');
    if (!currentTemplate || !currentContent || !validateRequiredTagsForSave()) {
        console.log('[handleUpdateTemplate] Validation failed or no current template/content.');
        if (!currentTemplate) console.log("currentTemplate is null/undefined");
        if (!currentContent) console.log("currentContent is null/undefined");
        if (currentTemplate && currentContent && !validateRequiredTagsForSave()) console.log("validateRequiredTagsForSave returned false");
        return;
    }
    setIsProcessingAction(true); setError(null); setSuccessMessage(null);
    console.log('[handleUpdateTemplate] Starting update process.');

    const contentSource = currentContent?.source;
    const token = session?.laravelApiToken;
    let updatePromise;

    console.log('[handleUpdateTemplate] Content Source:', contentSource);
    console.log('[handleUpdateTemplate] Current Content:', currentContent);


    if (contentSource === 'partner_translation') {
        const pttRecord = currentContent.partnerTranslationRecord;
        console.log('[handleUpdateTemplate] Source is partner_translation. PTT Record:', pttRecord);
        if (!pttRecord || !pttRecord.email_partner_template || typeof pttRecord.email_partner_template.id === 'undefined') { 
            setError("Cannot update: Partner translated template data is incomplete or not found (missing email_partner_template.id)."); 
            console.error("Error: Partner translated template data is incomplete.", pttRecord);
            setIsProcessingAction(false); return; 
        }
        
        const payload = { 
            email_partner_template_id: pttRecord.email_partner_template.id,
            language: currentLanguage, 
            subject: currentContent.subject, 
            body: currentContent.body,
        };
        console.log('[handleUpdateTemplate] Partner Translation Payload:', payload);
        updatePromise = ApiService.updatePartnerTranslationData(payload, { token });

    } else if (contentSource === 'partner_override') {
        const pt = currentTemplate.partner_templates?.find(item => item.partner_id === partnerId && item.language === currentLanguage);
        console.log('[handleUpdateTemplate] Source is partner_override. Partner Template Record (pt):', pt);
        if (!pt) { 
            setError("Cannot update: Partner override template record not found for this language."); 
            console.error("Error: Partner override template record not found.");
            setIsProcessingAction(false); return; 
        }
        const payload = { subject: currentContent.subject, body: currentContent.body };
        console.log('[handleUpdateTemplate] Partner Override Payload (for ID ' + pt.id + '):', payload);
        updatePromise = ApiService.updatePartnerEmailTemplate(pt.id, payload, { token });
    } else {
        setError("Cannot update: Template source is not eligible for direct partner update. Source: " + contentSource);
        console.error("Error: Unknown or ineligible content source: " + contentSource);
        setIsProcessingAction(false); return;
    }

    try {
      console.log('[handleUpdateTemplate] Awaiting update promise...');
      await updatePromise;
      setSuccessMessage('Template updated successfully!');
      console.log('[handleUpdateTemplate] Update successful. Fetching user data and templates...');
      await fetchUserDataAndTemplates(); 
    } catch (err) { 
      console.error('[handleUpdateTemplate] Error during update or fetch:', err);
      setError(err.message || 'Failed to update template.'); 
      setSuccessMessage(null);
    } finally { 
      setIsProcessingAction(false); 
      console.log('[handleUpdateTemplate] Process finished.');
    }
  };

  const handleRevert = () => { if (!currentTemplate) return; setError(null); setSuccessMessage(null); setConfirmingRevertId(currentTemplate.id); };
  const cancelRevert = () => setConfirmingRevertId(null);

  const executeRevert = async () => {
    if (!confirmingRevertId) return;
    setIsProcessingAction(true); setError(null); setSuccessMessage(null);
    const templateToRevert = templates.find(t => t.id === confirmingRevertId);
    if (!templateToRevert) { setIsProcessingAction(false); setConfirmingRevertId(null); return; }
    const contentSource = currentContent?.source;
    let deletePromise;
    const token = session?.laravelApiToken;

    if (contentSource === 'partner_translation') {
        const pttRecord = currentContent.partnerTranslationRecord;
        if (!pttRecord || typeof pttRecord.id === 'undefined') { 
            setError("Cannot revert: Partner translated template record not found or ID missing."); 
            setIsProcessingAction(false); setConfirmingRevertId(null); return; 
        }
        setError("Revert for partner-translated templates not yet fully implemented via a dedicated endpoint."); 
        setIsProcessingAction(false); setConfirmingRevertId(null); return; 
    } else if (contentSource === 'partner_override') {
        const pt = templateToRevert.partner_templates?.find(item => item.partner_id === partnerId && item.language === currentLanguage);
        if (!pt) { setError("Cannot revert: Partner override template record not found."); setIsProcessingAction(false); setConfirmingRevertId(null); return; }
        deletePromise = ApiService.deletePartnerEmailTemplate(pt.id, { token });
    } else {
        setError("Cannot revert: Template source is not eligible for direct partner revert.");
        setIsProcessingAction(false); setConfirmingRevertId(null); return;
    }

    try {
      if (deletePromise) {
        await deletePromise;
        setSuccessMessage('Template reverted successfully!');
        await fetchUserDataAndTemplates(); 
      }
    } catch (err) { setError(err.message || 'Failed to revert template.'); setSuccessMessage(null);
    } finally { setIsProcessingAction(false); setConfirmingRevertId(null); }
  };

  return (
    <div className="flex flex-row h-screen bg-white">
      <div className="w-1/6 border-r border-gray-200 p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Email Templates</h2>
        <div className="space-y-2">
          {templates.map((template) => {
            const isActive = activeTemplateId === template.id;
            // For the active template, use the current language from the dropdown.
            // For others, use their stored preference or base language.
            const languageForStatusCheck = isActive 
              ? currentLanguage 
              : (getLanguagePreference(template.id) || template.language || 'en');
            
            let isEditedForThisLanguage = false;
            // Ensure partnerId and a valid language are available before checking
            if (partnerId !== null && languageForStatusCheck) { 
              const displayInfo = getDisplayContent(template, partnerId, languageForStatusCheck, partnerTranslatedTemplates);
              isEditedForThisLanguage = displayInfo.source === 'partner_translation' || displayInfo.source === 'partner_override';
            }
            
            return (
              <button
                key={template.id}
                onClick={() => {
                  setActiveTemplateId(template.id);
                }}
                className={`p-3 text-sm font-medium rounded-md text-left w-full flex justify-between items-center ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                style={{ wordBreak: 'break-word' }}
              >
                <span>{capitalizeFirstLetter(formatTagName(template.name))}</span>
                {isEditedForThisLanguage && (
                  <span className={`text-xs ml-1 ${isActive ? 'text-white opacity-80' : 'text-gray-500 opacity-90'}`}>
                    (edited)
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6">
        {isLoading && templates.length === 0 && <div className="text-center py-4">Loading templates...</div>}
        {!isLoading && templates.length === 0 && !error && <div className="text-center py-4 text-gray-500">No templates available.</div>}
        {error && templates.length === 0 && !isLoading && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">{error}</div>}
        
        {(templates.length > 0 || isProcessingAction) && currentContent && (
          <div className="max-w-4xl mx-auto space-y-4">
            {successMessage && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4">{successMessage}</div>}
            {error && !(templates.length === 0 && !isLoading) && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">{error}</div>}

            <div className="flex items-end space-x-4">
              <div className="flex-grow">
                <label htmlFor="emailSubject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input id="emailSubject" type="text" value={currentContent.subject || ''} onChange={handleSubjectChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Enter email subject"/>
              </div>
              {currentTemplate && currentTemplate.available_languages && currentTemplate.available_languages.length > 0 && (
                <div className="w-1/4">
                  <label htmlFor="emailLanguage" className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Image src="/globe.svg" alt="language" width={20} height={20} />
                    </div>
                    <select
                      id="emailLanguage"
                      value={currentLanguage}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md bg-white appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {currentTemplate.available_languages
                        .map(langCode => languages.find(l => l.value === langCode))
                        .filter(lang => lang) // Ensure we found a match
                        .map(lang => (
                          <option key={lang.value} value={lang.value}>
                            {lang.name}
                          </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <SimpleEmailEditor
              content={currentContent.body || ''} onChange={handleContentChange}
              onOverwriteTemplate={handleOverride} onUpdateTemplate={handleUpdateTemplate} onRevertTemplate={handleRevert}
              isOverridden={isOverridden} enableSaveActions={contentHasChanged}
              showRevertConfirmationButtons={confirmingRevertId === currentTemplate?.id}
              onCancelRevert={cancelRevert} onConfirmRevert={executeRevert}
              isLoading={isProcessingAction || isLoading} showBusyOverlay={isProcessingAction}
              selectedLanguage={currentLanguage} 
              onLanguageChange={handleLanguageChange}
            />
            {currentTemplate?.tags?.length > 0 && (
              <div className="mt-6 mb-4 border-t pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Available Template Tags</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    {currentTemplate.tags.map((tag) => (
                      <div key={tag.id} className="flex items-start">
                        <div className="flex-shrink-0 mt-0.5"><span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium">{tag.is_required ? '*' : 'T'}</span></div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{'{' + tag.tag + '}'} {tag.is_required && <span className="text-red-500 ml-1">*</span>}</p>
                          <p className="text-sm text-gray-500">{tag.description || `Replace with ${formatTagName(tag.tag.toLowerCase())} value`}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    <span className="inline-flex items-center"><span className="h-4 w-4 rounded-full bg-blue-100 text-blue-600 text-xs font-medium flex items-center justify-center mr-1">*</span>Required tags</span>
                    <span className="inline-flex items-center ml-4"><span className="h-4 w-4 rounded-full bg-blue-100 text-blue-600 text-xs font-medium flex items-center justify-center mr-1">T</span>Optional tags</span>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-4 border border-gray-200 rounded-md bg-gray-50">
              <button onClick={() => setIsTestEmailSectionOpen(!isTestEmailSectionOpen)} className="w-full p-4 text-left font-medium text-gray-700 hover:bg-gray-100 focus:outline-none flex justify-between items-center">
                Test Email
                <svg className={`w-5 h-5 transform transition-transform ${isTestEmailSectionOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
              {isTestEmailSectionOpen && (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">To <span className="text-red-500">*</span></label>
                      <input type="email" value={emailContents[activeIndex]?.to || ''} onChange={handleToChange} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white" placeholder="Enter recipient email" required/>
                    </div>
                    {currentTemplate?.tags?.filter(t => t.is_required).map((tag) => (
                      <div key={tag.id}><label className="block text-sm text-gray-600 mb-1">{formatTagName(tag.tag)} <span className="text-red-500">*</span></label><input type="text" value={emailContents[activeIndex]?.tags?.[tag.tag] || ''} onChange={(e) => handleTagChange(tag.tag, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white" placeholder={`Enter ${formatTagName(tag.tag)}`} required/></div>
                    ))}
                    {currentTemplate?.tags?.filter(t => !t.is_required).map((tag) => (
                      <div key={tag.id}><label className="block text-sm text-gray-600 mb-1">{formatTagName(tag.tag)}</label><input type="text" value={emailContents[activeIndex]?.tags?.[tag.tag] || ''} onChange={(e) => handleTagChange(tag.tag, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white" placeholder={`Enter ${formatTagName(tag.tag)}`}/></div>
                    ))}
                  </div>
                  <div className="flex justify-center mt-4"><button onClick={handleSend} disabled={isLoading || isProcessingAction} className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${(isLoading || isProcessingAction) ? 'opacity-75 cursor-not-allowed' : ''}`}>{ (isLoading || isProcessingAction) ? 'Sending...' : 'Send Test Email'}</button></div>
                  <p className="text-xs text-gray-500 mt-2 text-center">Fill in the recipient email and any required/optional tag values above to send a test email. The content from the editor will be used.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
