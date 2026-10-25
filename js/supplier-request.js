(function () {
  'use strict';

  const store = window.VoltixSupplierRequests;
  const form = document.getElementById('supplier-request-form');
  const type = document.getElementById('request-type');
  const productFields = document.getElementById('product-fields');
  const feedback = document.getElementById('request-feedback');
  const button = document.getElementById('submit-request');
  const delivery = document.getElementById('expected-delivery-date');
  let submitting = false;

  function syncFields() {
    productFields.hidden = type.value !== 'products';
    productFields.disabled = productFields.hidden;
    delivery.min = store.today();
  }

  type.addEventListener('change', syncFields);
  // Whitespace-only required values must fail before the browser reports validity.
  function validateField(input) {
    input.setCustomValidity('');
    if (input.disabled || input.closest('fieldset:disabled')) return;
    if (input.required && !input.value.trim()) input.setCustomValidity('Please complete this field.');
    else if (input.name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) input.setCustomValidity('Enter a valid email address.');
    else if (input.name === 'phone' && (!/^\+?[\d\s()-]+$/.test(input.value.trim()) || !/^\d{7,15}$/.test(input.value.replace(/\D/g, '')))) input.setCustomValidity('Enter a valid phone number with 7 to 15 digits.');
  }
  form.addEventListener('input', (event) => {
    if (event.target.matches('input, textarea, select')) validateField(event.target);
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (submitting) return;
    syncFields();
    form.querySelectorAll('input, textarea, select').forEach(validateField);
    if (!form.reportValidity()) return;
    submitting = true;
    button.disabled = true;
    const result = store.submit(Object.fromEntries(new FormData(form)));
    feedback.hidden = false;
    feedback.dataset.state = result.ok ? 'success' : 'error';
    feedback.textContent = result.ok
      ? `Request submitted successfully. Reference: ${result.data.id}. Status: Pending. Our team will review your request.`
      : result.error;
    if (result.ok) { form.reset(); syncFields(); }
    feedback.focus();
    submitting = false;
    button.disabled = false;
  });
  syncFields();
  button.disabled = false;
}());
