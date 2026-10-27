/*
 * Portfolio behaviour: mobile menu, light/dark theme and contact form validation.
 * Each feature lives in its own init function and is started at the bottom of the file.
 */

/* ==========================================================================
   1. Mobile navigation
   ========================================================================== */
function initMobileMenu() {
  const menuButton = document.getElementById('menu-toggle');
  const nav = document.getElementById('primary-nav');
  if (!menuButton || !nav) return;

  // Must match the breakpoint in style.css where the links become always visible
  const desktopQuery = window.matchMedia('(min-width: 860px)');

  function setMenuOpen(isOpen) {
    nav.classList.toggle('is-open', isOpen);
    menuButton.setAttribute('aria-expanded', String(isOpen));
  }

  menuButton.addEventListener('click', function () {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    setMenuOpen(!isOpen);
  });

  // Choosing a section closes the menu; the browser follows the #link as normal
  nav.addEventListener('click', function (event) {
    if (event.target.closest('a')) {
      setMenuOpen(false);
    }
  });

  // Escape closes the menu and puts focus back on the button
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      setMenuOpen(false);
      menuButton.focus();
    }
  });

  // Clicking anywhere outside the open menu closes it
  document.addEventListener('click', function (event) {
    if (!nav.contains(event.target) && !menuButton.contains(event.target)) {
      setMenuOpen(false);
    }
  });

  // Reset when the screen grows to desktop size, so the state never gets stuck open
  desktopQuery.addEventListener('change', function () {
    setMenuOpen(false);
  });
}

/* ==========================================================================
   2. Light and dark theme
   ========================================================================== */
const THEME_STORAGE_KEY = 'portfolio-theme';

// Storage can throw (blocked cookies, private mode), so every access is guarded.
// If it fails, the theme still switches for this visit; it just is not remembered.
function readSavedTheme() {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch (error) {
    return null;
  }
}

function saveTheme(theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    // Nothing else to do: the page keeps working without persistence.
  }
}

function initThemeToggle() {
  const themeButton = document.getElementById('theme-toggle');
  if (!themeButton) return;

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    // The button is named "Dark theme"; aria-pressed says whether it is on
    themeButton.setAttribute('aria-pressed', String(theme === 'dark'));
  }

  // Light is the default when nothing has been saved
  applyTheme(readSavedTheme() === 'dark' ? 'dark' : 'light');

  themeButton.addEventListener('click', function () {
    const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    saveTheme(nextTheme);
  });
}

/* ==========================================================================
   3. Contact form validation
   ========================================================================== */
const MESSAGE_MIN = 20;
const MESSAGE_MAX = 500;
// Something@something.tld with no spaces, and a top-level domain of 2+ letters
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Each rule returns an error message, or an empty string when the value is valid
const fieldRules = {
  name: function (value) {
    const name = value.trim();
    if (name.length === 0) return 'Please enter your name.';
    if (name.length < 2) return 'Your name needs at least 2 characters.';
    return '';
  },
  email: function (value) {
    const email = value.trim();
    if (email.length === 0) return 'Please enter your email address.';
    if (!EMAIL_PATTERN.test(email)) return 'Please enter a valid email address, like name@example.com.';
    return '';
  },
  message: function (value) {
    const length = value.trim().length;
    if (length === 0) return 'Please write a message.';
    if (length < MESSAGE_MIN) return 'Your message needs at least ' + MESSAGE_MIN + ' characters (currently ' + length + ').';
    if (length > MESSAGE_MAX) return 'Your message must be ' + MESSAGE_MAX + ' characters or fewer (currently ' + length + ').';
    return '';
  }
};

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const status = document.getElementById('form-status');
  const messageField = form.elements.message;
  const charCount = document.getElementById('message-count');
  const fieldNames = Object.keys(fieldRules);

  // Shows or clears the error for one field and returns true when it is valid
  function validateField(field) {
    const errorMessage = fieldRules[field.name](field.value);
    const errorElement = document.getElementById(field.name + '-error');

    errorElement.textContent = errorMessage;
    if (errorMessage) {
      field.setAttribute('aria-invalid', 'true');
    } else {
      field.removeAttribute('aria-invalid');
    }
    return errorMessage === '';
  }

  function updateCharCount() {
    const length = messageField.value.trim().length;
    charCount.textContent = length + ' / ' + MESSAGE_MAX;
    charCount.classList.toggle('is-over', length > MESSAGE_MAX);
  }

  fieldNames.forEach(function (name) {
    const field = form.elements[name];

    field.addEventListener('input', function () {
      if (name === 'message') updateCharCount();
      // Only re-check a field that is already showing an error,
      // so visitors are not told off while they are still typing
      if (field.getAttribute('aria-invalid') === 'true') {
        validateField(field);
      }
      status.textContent = '';
    });

    // Check a field once the visitor leaves it, if they typed something
    field.addEventListener('blur', function () {
      if (field.value.trim() !== '') {
        validateField(field);
      }
    });
  });

  form.addEventListener('submit', function (event) {
    // Never navigate or reload: this form is a frontend demo only
    event.preventDefault();
    status.classList.remove('is-error');

    let firstInvalidField = null;
    fieldNames.forEach(function (name) {
      const field = form.elements[name];
      const isValid = validateField(field);
      if (!isValid && !firstInvalidField) {
        firstInvalidField = field;
      }
    });

    if (firstInvalidField) {
      status.textContent = '';
      firstInvalidField.focus();
      return;
    }

    // Entered values are kept, so the visitor can copy them into an email
    status.textContent = 'Demo only. Your message has not been sent.';
  });

  updateCharCount();
}

/* ==========================================================================
   Start everything
   ========================================================================== */
initMobileMenu();
initThemeToggle();
initContactForm();

document.getElementById('year').textContent = new Date().getFullYear();
