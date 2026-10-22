(() => {
  "use strict";

  // Frontend demo authentication is NOT secure for production.
  // Demo credentials are public, and browser storage can be edited by the user.
  // Real authentication and authorization must eventually be verified by a backend.
  const DEMO_USERS = [
    { id: "user-admin", name: "Admin", email: "admin@voltix.test", password: "Admin123!", role: "admin" },
    { id: "user-staff", name: "Staff", email: "staff@voltix.test", password: "Staff123!", role: "staff" }
  ];

  // The dashboard can read this session later; no shared module APIs are defined here.
  const SESSION_KEY = "voltix.session";
  const REMEMBERED_EMAIL_KEY = "voltix.rememberedEmail";
  const DASHBOARD_PATH = "pages/dashboard.html";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const form = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const rememberEmailInput = document.getElementById("remember-email");
  const passwordToggle = document.getElementById("toggle-password");
  const signInButton = document.getElementById("sign-in");
  const signInLabel = document.getElementById("sign-in-label");
  const feedback = document.getElementById("form-feedback");
  let isSubmitting = false;

  // Use an explicit allowlist so passwords never enter the saved session.
  function createSession(user) {
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  function clearFeedback() {
    feedback.hidden = true;
    feedback.textContent = "";
    delete feedback.dataset.state;
  }

  function showFeedback(message, state = "error") {
    feedback.dataset.state = state;
    feedback.textContent = message;
    feedback.hidden = false;
  }

  function setFieldError(input, message = "") {
    const error = document.getElementById(input.id + "-error");
    input.setAttribute("aria-invalid", message ? "true" : "false");
    error.textContent = message;
    error.hidden = !message;
  }

  function validateFields(email, password) {
    const emailError = !email
      ? "Enter your email address."
      : (!EMAIL_PATTERN.test(email) || emailInput.validity.typeMismatch)
        ? "Enter a valid email address, such as you@voltix.test."
        : "";
    const passwordError = password ? "" : "Enter your password.";

    setFieldError(emailInput, emailError);
    setFieldError(passwordInput, passwordError);

    if (emailError || passwordError) {
      showFeedback("Check the highlighted fields and try again.");
      (emailError ? emailInput : passwordInput).focus();
      return false;
    }

    return true;
  }

  function setSubmitting(submitting) {
    isSubmitting = submitting;
    signInButton.disabled = submitting;
    signInButton.classList.toggle("is-loading", submitting);
    signInLabel.textContent = submitting ? "Opening workspace…" : "Sign In";
    form.setAttribute("aria-busy", String(submitting));
  }

  function restoreRememberedEmail() {
    try {
      const savedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
      if (savedEmail && EMAIL_PATTERN.test(savedEmail)) {
        emailInput.value = savedEmail;
        rememberEmailInput.checked = true;
      }
    } catch {
      // Remembering an email is optional when browser storage is unavailable.
    }
  }

  function saveEmailPreference(email, remember) {
    try {
      if (remember) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }
    } catch {
      // A blocked preference store must not prevent a valid session from opening.
    }
  }

  function hasDemoSession() {
    try {
      const savedSession = JSON.parse(sessionStorage.getItem(SESSION_KEY));
      const user = DEMO_USERS.find((account) =>
        savedSession &&
        savedSession.id === account.id &&
        savedSession.name === account.name &&
        savedSession.email === account.email &&
        savedSession.role === account.role
      );

      if (!user) {
        sessionStorage.removeItem(SESSION_KEY);
        return false;
      }

      // Normalize restored sessions to the same four allowed fields.
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(createSession(user)));
      return true;
    } catch {
      // Invalid JSON or blocked session storage should leave the login usable.
      try {
        sessionStorage.removeItem(SESSION_KEY);
      } catch {
        // Storage access may itself be blocked by browser privacy settings.
      }
      return false;
    }
  }

  function openDashboard() {
    window.location.assign(DASHBOARD_PATH);
  }

  function handleSignIn(event) {
    event.preventDefault();
    if (isSubmitting) return;

    clearFeedback();
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value; // Passwords are case-sensitive; do not trim.
    emailInput.value = email;

    if (!validateFields(email, password)) return;

    const user = DEMO_USERS.find((account) =>
      account.email === email && account.password === password
    );

    if (!user) {
      showFeedback("We couldn’t sign you in. Check your email and password, then try again.");
      passwordInput.value = "";
      passwordInput.focus();
      return;
    }

    setSubmitting(true);

    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(createSession(user)));
    } catch {
      setSubmitting(false);
      showFeedback("Your browser couldn’t start a session. Allow browser storage for this page and try again.");
      return;
    }

    saveEmailPreference(email, rememberEmailInput.checked);
    passwordInput.value = "";
    showFeedback("You’re signed in. Opening your workspace…", "success");
    // Let the visible and announced success state render before navigating.
    window.setTimeout(openDashboard, 350);
  }

  passwordToggle.addEventListener("click", () => {
    const showPassword = passwordInput.type === "password";
    passwordInput.type = showPassword ? "text" : "password";
    passwordToggle.textContent = showPassword ? "Hide" : "Show";
    passwordToggle.setAttribute("aria-label", showPassword ? "Hide password" : "Show password");
    passwordToggle.setAttribute("aria-pressed", String(showPassword));
  });

  [emailInput, passwordInput].forEach((input) => {
    input.addEventListener("input", () => {
      setFieldError(input);
      if (!isSubmitting) clearFeedback();
    });
  });

  rememberEmailInput.addEventListener("change", () => {
    if (!rememberEmailInput.checked) saveEmailPreference("", false);
  });

  form.addEventListener("submit", handleSignIn);
  restoreRememberedEmail();
  signInButton.disabled = false;

  if (hasDemoSession()) {
    setSubmitting(true);
    showFeedback("You’re already signed in. Opening your workspace…", "success");
    openDashboard();
  }
})();
