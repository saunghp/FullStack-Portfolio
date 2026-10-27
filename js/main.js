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

  const submitButton = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async function (event) {
    // Never navigate or reload; the message is sent with fetch instead
    event.preventDefault();
    status.classList.remove('is-error');

    // Validate first, so only complete messages are sent
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

    // The Web3Forms access_key is a hidden field in the form, so FormData includes it
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Sending...';
    submitButton.disabled = true;
    status.textContent = '';

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: new FormData(form)
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message);
      }

      status.textContent = 'Thanks! Your message has been sent. I usually reply within a day.';
      form.reset();
      updateCharCount();
    } catch (error) {
      status.classList.add('is-error');
      status.textContent = 'Sorry, your message could not be sent. Please email me at saunghpdev@gmail.com instead.';
    } finally {
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }
  });

  updateCharCount();
}

/* ==========================================================================
   4. Project data, cards and category filters
   ========================================================================== */

// Single source of truth for the projects section. Add an object here and a
// card (and, for a new category, a filter button) appears without editing HTML.
const projects = [
  {
    title: 'Swee - Smart Task Allocation',
    description: 'AI-powered workforce management that matches the right worker to the right job using availability, proximity, workload and performance.',
    category: 'Web Apps',
    technologies: ['Next.js 14', 'Supabase', 'Tailwind CSS', 'OpenAI', 'Azure OpenAI', 'Vercel'],
    demoUrl: 'https://taskallocate.vercel.app/',
    sourceUrl: 'https://github.com/saunghp/Swee---Task-Allocation',
    image: 'assets/projects/swee.jpg',
    imageAlt: 'Screenshot of the Swee task allocation app'
  },
  {
    title: 'Emochi - AI Emotional Wellness Platform',
    description: 'An 8-agent AI wellness platform where specialised characters debate, support and help you make sense of how you feel.',
    category: 'AI Apps',
    award: 'Community Choice & Best Use of Microsoft Stack',
    technologies: ['Next.js', 'Azure AI Foundry', 'Prisma / SQL Server', 'Auth.js'],
    demoUrl: 'https://emochiverse.vercel.app/',
    sourceUrl: 'https://github.com/saunghp/emochi',
    image: 'assets/projects/emochi.jpg',
    imageAlt: 'Screenshot of the Emochi sign-in screen with a sleepy Emochi character'
  },
  {
    title: 'Hope Spring - Online Fundraising System',
    description: 'A multi-role fundraising platform where donees discover causes and fundraisers manage campaigns end to end. Built as a team using Agile Scrum.',
    category: 'Web Apps',
    technologies: ['TypeScript', 'React', 'Supabase', 'GitHub', 'Agile Scrum'],
    demoUrl: 'https://hope-spring-si.vercel.app/',
    sourceUrl: 'https://github.com/saunghp/CSIT314-SIM2026Q2-ShibaInu',
    image: 'assets/projects/hope-spring.jpg',
    imageAlt: 'Screenshot of the Hope Spring fundraising home page'
  },
  {
    title: 'Oops Too Slow - Reaction Game',
    description: 'A hackathon reaction game that swaps the keyboard for hand gestures, with solo and team leaderboards.',
    category: 'Web Apps',
    technologies: ['JavaScript', 'HTML', 'CSS', 'MediaPipe', 'Firebase', 'Webcam API'],
    demoUrl: 'https://nan2-28pm.vercel.app/',
    sourceUrl: 'https://github.com/saunghp/oops-too-slow',
    image: 'assets/projects/oops-too-slow.jpg',
    imageAlt: 'Screenshot of the Oops Too Slow start screen asking for a nickname'
  },
  {
    title: 'Customer Support Chatbot',
    description: 'A support chatbot named Aria that replies in the customer\'s own language, looks up their orders and saves every chat.',
    category: 'AI Apps',
    technologies: ['React', 'Node.js', 'Express', 'Supabase', 'OpenRouter'],
    demoUrl: 'https://customer-support-chatbot-kappa-virid.vercel.app/',
    sourceUrl: 'https://github.com/saunghp/Customer-Support-Chatbot',
    image: 'assets/projects/chatbot.jpg',
    imageAlt: 'Screenshot of a conversation with the Aria support chatbot'
  },
  {
    title: 'Machine Translation Across Six Directions',
    description: 'Translation models I trained to translate between English and Korean, Vietnamese and Indonesian, comparing MarianMT, mBART-50 and NLLB-200.',
    category: 'Machine Learning',
    technologies: ['Python', 'PyTorch', 'Hugging Face', 'LoRA', 'Jupyter'],
    sourceUrl: 'https://github.com/saunghp/Machine-Translation-Models-Across-Six-Translation-Directions',
    facts: ['EN ⇄ KO', 'EN ⇄ VI', 'EN ⇄ ID', 'MarianMT', 'mBART-50', 'NLLB-200']
  },
  {
    title: 'Drive a Taxi',
    description: 'A Q-learning agent that learns to pick up and drop off passengers in Gymnasium\'s Taxi-v3 world, using exploration and rewards to find the shortest routes.',
    category: 'Machine Learning',
    technologies: ['Python', 'Gymnasium', 'NumPy', 'Matplotlib', 'tqdm'],
    sourceUrl: 'https://github.com/saunghp/csci323-drive-a-taxi',
    facts: ['30,000 training episodes', '500 states', '6 actions', '4 pick-up points']
  }
];

const ALL_CATEGORIES = 'All';

// Small helper so card-building code stays readable
function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function createProjectLink(url, label, projectTitle, isPrimary) {
  const link = createElement('a', 'button ' + (isPrimary ? 'button-primary' : 'button-secondary'), label);
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener';
  // Screen readers hear which project the link is for, e.g. "Live demo of Swee..."
  link.setAttribute('aria-label', label + ' of ' + projectTitle + ' (opens in a new tab)');
  return link;
}

function createProjectCard(project) {
  const card = createElement('article', 'card project-card');

  // Top: screenshot, or a panel of key facts for projects without a UI
  if (project.image) {
    const media = createElement('div', 'project-media');
    const image = document.createElement('img');
    image.src = project.image;
    image.alt = project.imageAlt;
    image.width = 800;
    image.height = 500;
    image.loading = 'lazy';
    media.append(image);
    card.append(media);
  } else if (project.facts) {
    const factList = createElement('ul', 'project-media project-media-facts');
    factList.setAttribute('aria-label', 'Key facts');
    project.facts.forEach(function (fact) {
      factList.append(createElement('li', '', fact));
    });
    card.append(factList);
  }

  const body = createElement('div', 'project-body');

  const meta = createElement('p', 'project-meta');
  meta.append(createElement('span', 'category-badge', project.category));
  if (project.award) {
    meta.append(createElement('span', 'award-badge', 'Award: ' + project.award));
  }

  const techList = createElement('ul', 'tech-list');
  techList.setAttribute('aria-label', 'Technologies used');
  project.technologies.forEach(function (tech) {
    techList.append(createElement('li', '', tech));
  });

  const links = createElement('div', 'project-links');
  if (project.demoUrl) {
    links.append(createProjectLink(project.demoUrl, 'Live demo', project.title, true));
  }
  if (project.sourceUrl) {
    links.append(createProjectLink(project.sourceUrl, 'Source code', project.title, !project.demoUrl));
  }

  body.append(
    meta,
    createElement('h3', '', project.title),
    createElement('p', '', project.description),
    techList,
    links
  );
  card.append(body);
  return card;
}

function initProjects() {
  const grid = document.getElementById('project-grid');
  const filterBar = document.getElementById('project-filters');
  const resultsCount = document.getElementById('results-count');
  if (!grid || !filterBar || !resultsCount) return;

  // Unique categories, in the order they first appear in the data
  const categories = [ALL_CATEGORIES].concat(
    projects
      .map(function (project) { return project.category; })
      .filter(function (category, index, list) { return list.indexOf(category) === index; })
  );

  function getProjectsIn(category) {
    // filter() returns a new array, so the original projects array is never changed
    if (category === ALL_CATEGORIES) return projects;
    return projects.filter(function (project) { return project.category === category; });
  }

  function showCategory(category) {
    const visibleProjects = getProjectsIn(category);

    // replaceChildren() removes the old cards first, so switching filters never duplicates cards
    grid.replaceChildren.apply(grid, visibleProjects.map(createProjectCard));

    filterBar.querySelectorAll('.filter-button').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.category === category));
    });

    const noun = visibleProjects.length === 1 ? 'project' : 'projects';
    resultsCount.textContent = category === ALL_CATEGORIES
      ? 'Showing all ' + visibleProjects.length + ' ' + noun
      : 'Showing ' + visibleProjects.length + ' ' + noun + ' in ' + category;
  }

  // Build one real <button> per category; aria-pressed exposes the selected one
  categories.forEach(function (category) {
    const button = createElement('button', 'filter-button', category);
    button.type = 'button';
    button.dataset.category = category;
    button.setAttribute('aria-pressed', 'false');

    const count = createElement('span', 'filter-count', '(' + getProjectsIn(category).length + ')');
    button.append(' ', count);

    button.addEventListener('click', function () {
      showCategory(category);
    });
    filterBar.append(button);
  });

  showCategory(ALL_CATEGORIES);
}

/* ==========================================================================
   Start everything
   ========================================================================== */
initMobileMenu();
initThemeToggle();
initContactForm();
initProjects();

document.getElementById('year').textContent = new Date().getFullYear();
