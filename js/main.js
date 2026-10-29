/*
 * Portfolio behaviour. Each feature lives in its own init function and is
 * started at the bottom of the file:
 *   1. Mobile navigation (+ highlighting the section you are reading)
 *   2. Light and dark theme
 *   3. Contact form validation and sending
 *   4. Project data, cards, category filters and the details dialog
 *   5. Certificate viewer
 */

/* ==========================================================================
   Shared helpers
   ========================================================================== */
const SVG_NS = 'http://www.w3.org/2000/svg';

// Small helper so DOM-building code stays readable
function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

// Draws an icon from the sprite at the top of index.html
function createIcon(name, className) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', className ? 'icon ' + className : 'icon');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', '#i-' + name);
  svg.append(use);
  return svg;
}

/*
 * Native <dialog> elements give us Escape-to-close, a keyboard focus trap and
 * an inert background. This adds the rest: close buttons, a click on the
 * backdrop, no page scrolling behind the dialog, and focus returning to the
 * button that opened it.
 */
function setupDialog(dialog) {
  dialog.addEventListener('click', function (event) {
    // A click on the dark backdrop is reported as a click on the <dialog> itself
    if (event.target === dialog || event.target.closest('[data-close-dialog]')) {
      dialog.close();
    }
  });

  dialog.addEventListener('close', function () {
    document.documentElement.classList.remove('is-locked');
    const opener = dialog._opener;
    dialog._opener = null;
    if (opener && document.contains(opener)) {
      opener.focus();
    }
  });
}

function openDialog(dialog, opener) {
  dialog._opener = opener || null;
  document.documentElement.classList.add('is-locked');
  dialog.showModal();
}

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

// Marks the link of the section you are reading with aria-current, which also styles it
function initActiveNavLink() {
  const links = Array.from(document.querySelectorAll('#primary-nav .nav-list a[href^="#"]'));
  const sections = links
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);
  if (links.length === 0 || sections.length === 0) return;

  let waiting = false;

  function update() {
    waiting = false;
    // A section counts as "current" once its top passes about a third of the way down the screen
    const marker = window.innerHeight * 0.35;
    let current = sections[0];
    sections.forEach(function (section) {
      if (section.getBoundingClientRect().top <= marker) current = section;
    });

    links.forEach(function (link) {
      if (link.getAttribute('href') === '#' + current.id) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function requestUpdate() {
    if (!waiting) {
      waiting = true;
      window.requestAnimationFrame(update);
    }
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  update();
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
  const submitLabel = submitButton.querySelector('.submit-label');

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
    const originalText = submitLabel.textContent;
    submitLabel.textContent = 'Sending...';
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
      submitLabel.textContent = originalText;
      submitButton.disabled = false;
    }
  });

  updateCharCount();
}

/* ==========================================================================
   4. Project data, cards, category filters and details dialog
   ========================================================================== */

// Single source of truth for the projects section. Add an object here and a
// card (and, for a new category, a filter button) appears without editing HTML.
//   features: the "at a glance" cards in the details dialog
//   story:    problem / what I did / outcome, shown in the details dialog
//   visual:   for projects without a screenshot, a panel of key facts instead
const projects = [
  {
    title: 'Swee - Smart Task Allocation',
    description: 'AI-powered workforce management that matches the right worker to the right job using availability, proximity, workload and performance.',
    category: 'Web Apps',
    technologies: ['Next.js 14', 'Supabase', 'Tailwind CSS', 'OpenAI', 'Azure OpenAI', 'Vercel'],
    demoUrl: 'https://taskallocate.vercel.app/',
    sourceUrl: 'https://github.com/saunghp/Swee---Task-Allocation',
    image: 'assets/projects/swee.jpg',
    imageAlt: 'Screenshot of the Swee task allocation app',
    features: [
      { icon: '🧭', title: 'AI Staff Matching', text: 'Ranks available workers by proximity, workload and performance for every job.' },
      { icon: '💬', title: 'AI Scheduling Agent', text: 'Chat prompts become recurring contracts and auto-generated weekly schedules.' },
      { icon: '🏢', title: 'Multi-Tenant SaaS', text: '6 role types, with tenant isolation enforced by Supabase Row-Level Security.' },
      { icon: '📍', title: 'QR Attendance', text: 'Staff check in with time-limited QR codes; managers see it live.' }
    ],
    story: {
      problem: 'Service businesses coordinating staff across shifts and locations need to match the right worker to the right job while keeping each client\'s data separate. That process is hard to scale manually once you have multiple tenants and role types.',
      contribution: 'Built the platform end-to-end: the multi-tenant data model and access control, an AI recommendation engine for staff matching, a natural-language scheduling agent, and the attendance and booking workflows around them.',
      outcome: 'Shipped a working product covered by Jest unit tests and Playwright E2E tests, deployed on Vercel.'
    }
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
    imageAlt: 'Screenshot of the Emochi sign-in screen with a sleepy Emochi character',
    features: [
      { icon: '🎭', title: '8 AI Personas', text: 'Each character is a real Azure AI Foundry agent grounded via RAG, not a script.' },
      { icon: '⚡', title: 'Real-Time Streaming', text: 'Token-by-token replies over the OpenAI-compatible Responses API.' },
      { icon: '⚖️', title: 'Debate Arena', text: 'A director agent casts a mixed panel that argues it out, then Wisey judges.' },
      { icon: '📊', title: 'Daily Check-Ins', text: 'Sleep, workload and mood feed a live, personalised suggestion engine.' }
    ],
    story: {
      problem: 'Generic wellness chatbots give generic advice. Different emotional check-ins (sleep, workload, mood) call for different, non-generic perspectives rather than one model answering everything the same way.',
      contribution: 'Built the full-stack Next.js app and its 8-agent architecture: RAG grounding per agent, the streaming chat integration, a multi-agent debate system, the check-in-driven suggestion engine, and the auth and data layer underneath.',
      outcome: 'Awarded Community Choice and Best Use of Microsoft Stack.'
    }
  },
  {
    title: 'Hope Spring - Online Fundraising System',
    description: 'A multi-role fundraising platform where donees discover causes and fundraisers manage campaigns end to end. Built as a team using Agile Scrum.',
    category: 'Web Apps',
    technologies: ['TypeScript', 'React', 'Supabase', 'GitHub', 'Agile Scrum'],
    demoUrl: 'https://hope-spring-si.vercel.app/',
    sourceUrl: 'https://github.com/saunghp/CSIT314-SIM2026Q2-ShibaInu',
    image: 'assets/projects/hope-spring.jpg',
    imageAlt: 'Screenshot of the Hope Spring fundraising home page',
    features: [
      { icon: '🔍', title: 'Discover Campaigns', text: 'Browse and search fundraising activities by interest and category.' },
      { icon: '📈', title: 'Campaign Management', text: 'Create, update, close and track fundraising activities in one place.' },
      { icon: '💳', title: 'Donation Tracking', text: 'Raised amount, deadline, views and recent donations at a glance.' },
      { icon: '👥', title: '4 User Roles', text: 'Admin, Fundraiser, Donee and Platform Management, each with its own view.' }
    ],
    story: {
      problem: 'Fundraising platforms have to serve several stakeholders at once (admins, fundraisers, donees and platform management), each with different permissions and workflows, while giving organisers visibility into how campaigns are actually performing.',
      contribution: 'Developed the platform\'s core features and designed the responsive UI/UX workflows and wireframes across 5 Agile Scrum sprints, including the analytics dashboards, while collaborating with the team via GitHub, Taiga and CI/CD.',
      outcome: 'Delivered across 5 Agile Scrum sprints with testing and CI/CD practices integrated throughout.'
    }
  },
  {
    title: 'Oops Too Slow - Reaction Game',
    description: 'A hackathon reaction game that swaps the keyboard for hand gestures, with solo and team leaderboards.',
    category: 'Web Apps',
    technologies: ['JavaScript', 'HTML', 'CSS', 'MediaPipe', 'Firebase', 'Webcam API'],
    demoUrl: 'https://nan2-28pm.vercel.app/',
    sourceUrl: 'https://github.com/saunghp/oops-too-slow',
    image: 'assets/projects/oops-too-slow.jpg',
    imageAlt: 'Screenshot of the Oops Too Slow start screen asking for a nickname',
    features: [
      { icon: '✋', title: 'Gesture Control', text: 'MediaPipe reads your hand in real time via the webcam, so no controller is needed.' },
      { icon: '⌨️', title: '3 Input Modes', text: 'Keyboard, mouse or hand gesture: whichever is fastest for you.' },
      { icon: '🏁', title: 'Solo & Team Modes', text: 'Race your own best time or compete on a shared Firebase leaderboard.' },
      { icon: '🌌', title: 'Dark Glow UI', text: 'A modern dark interface with glow effects for every on-screen prompt.' }
    ],
    story: {
      problem: 'The hackathon brief called for an engaging, accessible reaction game that would stand out with more than the usual keyboard-and-mouse input, built within a fixed 24-hour window.',
      contribution: 'Built the game and its gesture-control system: MediaPipe and webcam integration for hand tracking, both gameplay modes, the Firebase leaderboard and the interface polish, while testing and debugging against the hackathon deadline.',
      outcome: 'Delivered a working, playable build within the hackathon\'s time limit.'
    }
  },
  {
    title: 'Customer Support Chatbot',
    description: 'A support chatbot named Aria that replies in the customer\'s own language, looks up their orders and saves every chat.',
    category: 'AI Apps',
    technologies: ['React', 'Node.js', 'Express', 'Supabase', 'OpenRouter'],
    demoUrl: 'https://customer-support-chatbot-kappa-virid.vercel.app/',
    sourceUrl: 'https://github.com/saunghp/Customer-Support-Chatbot',
    image: 'assets/projects/chatbot.jpg',
    imageAlt: 'Screenshot of the Aria support chatbot greeting a visitor',
    features: [
      { icon: '🌐', title: 'Replies in Your Language', text: 'Detects the customer\'s language, such as Chinese, Burmese, Thai or Vietnamese, and answers in the same one.' },
      { icon: '📦', title: 'Order Tracking', text: 'Looks up the signed-in customer\'s orders and shows their status, with no order ID needed.' },
      { icon: '💬', title: 'Saved Chats', text: 'Customers sign in with Google, and their conversations are stored, reopened later or deleted.' },
      { icon: '⚡', title: 'Quick Replies', text: 'One-tap buttons for Track, Refund, Account help and talking to a human.' }
    ],
    story: {
      problem: 'Support teams answer the same routine questions again and again, often for customers who write in many different languages. A chatbot can take the routine ones, like order status, and reply in the language the customer used.',
      contribution: 'Built it on my own: the React chat interface, the Express backend, the Google sign-in and Supabase storage for chats and orders, and the AI replies through OpenRouter.',
      outcome: 'Delivered a working chatbot with a live demo: sign in with Google, ask about an order and get a short reply in your own language.'
    }
  },
  {
    title: 'Machine Translation Across Six Directions',
    description: 'Translation models I trained to translate between English and Korean, Vietnamese and Indonesian, using MarianMT, mBART-50 and NLLB-200.',
    category: 'Machine Learning',
    technologies: ['Python', 'PyTorch', 'Hugging Face', 'LoRA', 'Jupyter'],
    sourceUrl: 'https://github.com/saunghp/Machine-Translation-Models-Across-Six-Translation-Directions',
    visual: {
      type: 'languages',
      pairs: ['EN ⇄ KO', 'EN ⇄ VI', 'EN ⇄ ID'],
      caption: 'MarianMT · mBART-50 · NLLB-200'
    },
    features: [
      { icon: '🌏', title: '6 Translation Directions', text: 'English to and from Korean, Vietnamese and Indonesian.' },
      { icon: '🧠', title: '3 Models', text: 'MarianMT, mBART-50 and NLLB-200, all trained on the same data.' },
      { icon: '🧹', title: 'Clean Datasets', text: 'A notebook that prepares the training data and splits it the same way every time.' },
      { icon: '📏', title: 'Fine-Tuning', text: 'Each model is fine-tuned and scored with BLEU and chrF, using LoRA for NLLB-200.' }
    ],
    story: {
      problem: 'Translating between English and Korean, Vietnamese or Indonesian needs a model that handles each language well. I trained and tested three different models to see how each one does on all six directions.',
      contribution: 'Worked on this as part of a team. The repository holds a dataset-extraction notebook plus one notebook per model, each fine-tuned with Hugging Face\'s Seq2SeqTrainer.',
      outcome: 'Delivered as four notebooks: data preparation, MarianMT, mBART-50 and NLLB-200.'
    }
  },
  {
    title: 'Drive a Taxi',
    description: 'A Q-learning agent that learns to pick up and drop off passengers in Gymnasium\'s Taxi-v3 world, using exploration and rewards to find the shortest routes.',
    category: 'Machine Learning',
    technologies: ['Python', 'Gymnasium', 'NumPy', 'Matplotlib', 'tqdm'],
    sourceUrl: 'https://github.com/saunghp/csci323-drive-a-taxi',
    visual: {
      type: 'stats',
      title: 'By the numbers',
      items: [
        { value: '30,000', label: 'training episodes' },
        { value: '500', label: 'states' },
        { value: '6', label: 'possible actions' },
        { value: '4', label: 'pick-up / drop-off points' }
      ]
    },
    features: [
      { icon: '🚕', title: 'Q-Learning Agent', text: 'Model-free learning with an exploration rate that decays from 1.0 down to 0.1.' },
      { icon: '🧭', title: 'Taxi-v3 World', text: 'A 5×5 grid with 4 pick-up and drop-off points, 6 actions and a 500 × 6 Q-table.' },
      { icon: '📈', title: 'Training Tracking', text: 'Rewards, steps, average Q-values, exploration rate and success rate across every episode.' },
      { icon: '🗺️', title: 'Learning Curves & Routes', text: 'Plots how the agent improves and shows the routes it learns to drive.' }
    ],
    story: {
      problem: 'Teach an agent to drive a taxi without being told the rules: through trial and reward, it has to discover how to pick up a passenger and drop them off in as few actions as possible.',
      contribution: 'Worked on this as part of a six-person group (FT37) for a reinforcement-learning course project.',
      outcome: 'Delivered a training script that learns the task over 30,000 episodes, with plots of the learning curve, average Q-value growth and success rate.'
    }
  }
];

const ALL_CATEGORIES = 'All';

function createProjectLink(url, label, projectTitle, className, iconName) {
  const link = createElement('a', 'button button-small ' + className);
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener';
  link.append(createIcon(iconName), label);
  // Screen readers hear which project the link is for, e.g. "Live demo of Swee..."
  link.setAttribute('aria-label', label + ' of ' + projectTitle + ' (opens in a new tab)');
  return link;
}

// The panel shown instead of a screenshot (machine-learning projects have no UI)
function createVisualPanel(visual) {
  const panel = createElement('div', 'project-visual');

  if (visual.type === 'stats') {
    panel.append(createElement('p', 'visual-title', visual.title));
    const list = createElement('ul', 'stat-grid');
    visual.items.forEach(function (item) {
      const entry = createElement('li');
      entry.append(createElement('span', 'stat-value', item.value), createElement('span', 'stat-label', item.label));
      list.append(entry);
    });
    panel.append(list);
  } else if (visual.type === 'languages') {
    const list = createElement('ul', 'language-panel');
    visual.pairs.forEach(function (pair) {
      list.append(createElement('li', '', pair));
    });
    panel.append(list, createElement('p', 'visual-caption', visual.caption));
  }
  return panel;
}

function createTechList(project) {
  const techList = createElement('ul', 'tech-list');
  techList.setAttribute('aria-label', 'Technologies used');
  project.technologies.forEach(function (tech) {
    techList.append(createElement('li', '', tech));
  });
  return techList;
}

function createProjectCard(project) {
  const card = createElement('article', 'glass glow-hover project-card');

  // Top: screenshot (opens the details), or a panel of key facts for projects without a UI
  if (project.image) {
    const media = createElement('button', 'project-media project-media-open');
    media.type = 'button';
    media.setAttribute('aria-haspopup', 'dialog');
    media.setAttribute('aria-label', 'Open details for ' + project.title);
    media.dataset.project = project.title;
    const image = document.createElement('img');
    image.src = project.image;
    image.alt = project.imageAlt;
    image.width = 800;
    image.height = 500;
    image.loading = 'lazy';
    image.decoding = 'async';
    media.append(image);
    card.append(media);
  } else if (project.visual) {
    const media = createElement('div', 'project-media');
    media.append(createVisualPanel(project.visual));
    card.append(media);
  }

  const body = createElement('div', 'project-body');

  // The number comes from a CSS counter, so it always matches the cards currently shown
  const meta = createElement('p', 'project-meta');
  const number = createElement('span', 'project-number');
  number.setAttribute('aria-hidden', 'true');
  meta.append(number, createElement('span', 'category-badge', project.category));

  const links = createElement('div', 'project-links');
  if (project.demoUrl) {
    links.append(createProjectLink(project.demoUrl, 'Live demo', project.title, 'button-primary', 'eye'));
  }
  if (project.sourceUrl) {
    links.append(createProjectLink(project.sourceUrl, 'Source code', project.title, 'button-secondary', 'github'));
  }
  const detailsButton = createElement('button', 'button button-small button-soft');
  detailsButton.type = 'button';
  detailsButton.dataset.project = project.title;
  detailsButton.setAttribute('aria-haspopup', 'dialog');
  detailsButton.setAttribute('aria-label', 'Details: ' + project.title);
  detailsButton.append('Details', createIcon('arrow-right'));
  links.append(detailsButton);

  body.append(meta, createElement('h3', '', project.title));
  if (project.award) {
    const award = createElement('p', 'award-badge');
    const trophy = createElement('span', '', '🏆');
    trophy.setAttribute('aria-hidden', 'true');
    award.append(trophy, 'Award: ' + project.award);
    body.append(award);
  }
  body.append(createElement('p', 'project-description', project.description), createTechList(project), links);
  card.append(body);
  return card;
}

// Fills the details dialog from one project object
function renderProjectDetails(project) {
  const fragment = document.createDocumentFragment();

  const title = createElement('h2', 'dialog-title', project.title);
  title.id = 'project-dialog-title';
  fragment.append(title, createElement('p', 'dialog-lead', project.description), createTechList(project));

  if (project.award) {
    const award = createElement('p', 'dialog-award');
    const trophy = createElement('span', '', '🏆');
    trophy.setAttribute('aria-hidden', 'true');
    award.append(trophy, project.award);
    fragment.append(award);
  }

  if (project.image) {
    const frame = createElement('div', 'dialog-frame');
    const bar = createElement('div', 'frame-bar');
    bar.setAttribute('aria-hidden', 'true');
    bar.append(createElement('span', 'frame-dot'), createElement('span', 'frame-dot'), createElement('span', 'frame-dot'));
    bar.append(createElement('span', 'frame-url', (project.demoUrl || project.sourceUrl).replace(/^https?:\/\//, '')));
    const shot = document.createElement('img');
    shot.className = 'frame-shot';
    shot.src = project.image;
    shot.alt = project.imageAlt;
    shot.width = 800;
    shot.height = 500;
    frame.append(bar, shot);
    fragment.append(frame);
  } else if (project.visual) {
    const visual = createElement('div', 'dialog-visual');
    visual.append(createVisualPanel(project.visual));
    fragment.append(visual);
  }

  const featureList = createElement('ul', 'feature-grid');
  featureList.setAttribute('aria-label', 'Key features');
  project.features.forEach(function (feature) {
    const item = createElement('li', 'feature-card');
    const icon = createElement('span', 'feature-icon', feature.icon);
    icon.setAttribute('aria-hidden', 'true');
    const text = createElement('div');
    text.append(createElement('h3', '', feature.title), createElement('p', '', feature.text));
    item.append(icon, text);
    featureList.append(item);
  });
  fragment.append(featureList);

  const story = createElement('div', 'story');
  [
    ['The problem', project.story.problem],
    ['What I did', project.story.contribution],
    ['Outcome', project.story.outcome]
  ].forEach(function (part) {
    story.append(createElement('h3', '', part[0]), createElement('p', '', part[1]));
  });
  fragment.append(story);

  const links = createElement('div', 'dialog-links');
  if (project.demoUrl) {
    links.append(createProjectLink(project.demoUrl, 'Live demo', project.title, 'button-primary', 'eye'));
  }
  if (project.sourceUrl) {
    links.append(createProjectLink(project.sourceUrl, 'Source code', project.title, 'button-secondary', 'github'));
  }
  fragment.append(links);

  return fragment;
}

function initProjects() {
  const grid = document.getElementById('project-grid');
  const filterBar = document.getElementById('project-filters');
  const resultsCount = document.getElementById('results-count');
  const dialog = document.getElementById('project-dialog');
  const dialogBody = document.getElementById('project-dialog-body');
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

  // One listener handles every card, including ones created later by the filters
  if (dialog && dialogBody) {
    setupDialog(dialog);
    grid.addEventListener('click', function (event) {
      const trigger = event.target.closest('[data-project]');
      if (!trigger) return;
      const project = projects.find(function (item) { return item.title === trigger.dataset.project; });
      if (!project) return;

      dialogBody.replaceChildren(renderProjectDetails(project));
      dialogBody.scrollTop = 0;
      openDialog(dialog, trigger);
    });
  }

  showCategory(ALL_CATEGORIES);
}

/* ==========================================================================
   5. Certificate viewer (previous / next, Escape to close)
   ========================================================================== */
function initCertificateViewer() {
  const dialog = document.getElementById('lightbox');
  const grid = document.getElementById('cert-grid');
  if (!dialog || !grid) return;

  const image = document.getElementById('lightbox-image');
  const caption = document.getElementById('lightbox-caption');
  const prevButton = document.getElementById('lightbox-prev');
  const nextButton = document.getElementById('lightbox-next');

  let items = [];
  let index = 0;
  let touchStartX = null;

  function show(newIndex) {
    index = (newIndex + items.length) % items.length;
    const item = items[index];
    image.src = item.src;
    image.alt = item.alt;
    caption.textContent = items.length > 1
      ? item.title + ' (' + (index + 1) + ' of ' + items.length + ')'
      : item.title;
  }

  function open(pictureButton) {
    // The pictures of one certificate card form one slideshow
    const group = Array.from(pictureButton.closest('.cert-pictures').querySelectorAll('.cert-picture'));
    items = group.map(function (button) {
      const thumb = button.querySelector('img');
      // data-full holds the full-size file; the card itself only loads a small thumbnail
      return { src: button.dataset.full || thumb.currentSrc || thumb.src, alt: thumb.alt, title: button.dataset.lightboxTitle };
    });
    prevButton.hidden = items.length < 2;
    nextButton.hidden = items.length < 2;
    show(group.indexOf(pictureButton));
    openDialog(dialog, pictureButton);
  }

  setupDialog(dialog);

  grid.addEventListener('click', function (event) {
    const picture = event.target.closest('.cert-picture');
    if (picture) {
      open(picture);
      return;
    }
    // Certificates without an outside page get a button that opens the viewer instead
    const opener = event.target.closest('[data-open-certificate]');
    if (opener) {
      const firstPicture = opener.closest('.cert-card').querySelector('.cert-picture');
      open(firstPicture);
      dialog._opener = opener;
    }
  });

  prevButton.addEventListener('click', function () { show(index - 1); });
  nextButton.addEventListener('click', function () { show(index + 1); });

  dialog.addEventListener('keydown', function (event) {
    if (items.length < 2) return;
    if (event.key === 'ArrowLeft') show(index - 1);
    if (event.key === 'ArrowRight') show(index + 1);
  });

  // Swipe left or right on a phone
  dialog.addEventListener('touchstart', function (event) {
    touchStartX = event.touches[0].clientX;
  }, { passive: true });
  dialog.addEventListener('touchend', function (event) {
    if (touchStartX === null || items.length < 2) return;
    const distance = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(distance) > 50) show(distance > 0 ? index - 1 : index + 1);
    touchStartX = null;
  });
}

/* ==========================================================================
   Start everything
   ========================================================================== */
initMobileMenu();
initActiveNavLink();
initThemeToggle();
initContactForm();
initProjects();
initCertificateViewer();

document.getElementById('year').textContent = new Date().getFullYear();
