'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'emailComposerState';

const validateTemplateTags = (body, requiredTags) => {
  const missingTags = [];
  requiredTags.forEach(tag => {
    if (tag.is_required && !body.includes(`{${tag.tag}}`)) {
      missingTags.push(tag.tag);
    }
  });
  return missingTags;
};

export default function useEmailComposer(initialTemplate = null) {
  const [state, setState] = useState({
    to: '',
    subject: '',
    body: '',
    tags: [],
    templateName: '',
    isLoading: false,
    error: null,
    missingTags: []
  });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        setState(prev => ({
          ...prev,
          to: parsed.to || '',
          subject: parsed.subject || '',
          body: parsed.body || '',
          templateName: parsed.templateName || ''
        }));
      }
    } catch (err) {
      console.error('Failed to load email state from localStorage', err);
    }
  }, []);

  // Save to localStorage on state changes
  useEffect(() => {
    const { to, subject, body, templateName } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ to, subject, body, templateName }));
  }, [state.to, state.subject, state.body, state.templateName]);

  const updateField = (field, value) => {
    setState(prev => {
      const newState = { ...prev, [field]: value };
      
      // Validate tags when body changes
      if (field === 'body') {
        const missingTags = validateTemplateTags(value, prev.tags);
        return { ...newState, missingTags };
      }
      
      return newState;
    });
  };

  const loadTemplate = (template) => {
    setState(prev => ({
      ...prev,
      subject: template.subject || '',
      body: template.body || '',
      tags: template.tags || [],
      templateName: template.name || '',
      missingTags: []
    }));
  };

  const reset = () => {
    if (state.templateName) {
      const template = initialTemplate?.find(t => t.name === state.templateName);
      if (template) {
        loadTemplate(template);
      }
    }
  };

  const validateBeforeSend = () => {
    const { subject, body, tags } = state;
    const missingTags = validateTemplateTags(body, tags);
    
    setState(prev => ({
      ...prev,
      missingTags,
      error: missingTags.length > 0 
        ? `Missing required tags: ${missingTags.join(', ')}`
        : null
    }));

    return missingTags.length === 0 && subject.trim() && body.trim();
  };

  return {
    ...state,
    updateField,
    loadTemplate,
    reset,
    validateBeforeSend,
    hasErrors: !!state.error || state.missingTags.length > 0
  };
}