export function validateFormData(formData) {
  const required = ['firstName', 'lastName', 'email', 'streetAddress', 'city', 'zipCode', 'country'];
  
  // Check if all required fields are filled
  for (const field of required) {
    if (!formData[field] || formData[field].trim() === '') {
      return false;
    }
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email)) {
    return false;
  }
  
  // Password validation (if password is required)
  if (formData.password && formData.password.length < 8) {
    return false;
  }
  
  return true;
}

export function validatePaymentForm(cardData, agreedToTerms) {
  // Check if user agreed to terms
  if (!agreedToTerms) {
    return false;
  }
  
  // Validate card data
  if (!cardData.cardNumber || !cardData.expirationDate || !cardData.cvc) {
    return false;
  }
  
  // Basic card number validation (remove spaces and check length)
  const cardNumber = cardData.cardNumber.replace(/\s/g, '');
  if (cardNumber.length < 13 || cardNumber.length > 19) {
    return false;
  }
  
  // Basic expiration date validation (MM/YY format)
  const expirationRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
  if (!expirationRegex.test(cardData.expirationDate)) {
    return false;
  }
  
  // Basic CVC validation
  if (cardData.cvc.length < 3 || cardData.cvc.length > 4) {
    return false;
  }
  
  return true;
}

export function createInputHandler(setStateFunction) {
  return (field, value) => {
    setStateFunction(prev => ({
      ...prev,
      [field]: value
    }));
  };
}