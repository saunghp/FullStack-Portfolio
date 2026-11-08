# Saung Hninn Phyu - Portfolio

A one-page personal portfolio built with plain **HTML, CSS and vanilla JavaScript**: no frameworks, libraries, build step or backend of my own. It introduces me, lists the skills I'm using and learning, shows my projects with category filters and a details dialog, and lets visitors message me through a working contact form.

Built for the Let's Tech Club Fullstack Development portfolio project.

| Desktop (1280px) | Mobile, light (360px) | Mobile, dark (360px) |
| --- | --- | --- |
| ![Desktop view of the portfolio hero section](screenshots/desktop.jpg) | ![Mobile view of the portfolio hero section in the light theme](screenshots/mobile.jpg) | ![Mobile view of the portfolio hero section in the dark theme](screenshots/mobile-dark.jpg) |

## How to run it

No installation is needed.

- **Quickest:** open `index.html` in a browser.
- **Recommended** (so the saved theme persists on the same address): serve the folder locally, then open <http://localhost:5500>.

  ```bash
  python -m http.server 5500
  ```

  The VS Code **Live Server** extension also works.

## Project structure

| Path | Purpose |
| --- | --- |
| `index.html` | Page content, semantic structure and the SVG icon sprite |
| `css/style.css` | All styles, light/dark theme tokens and responsive rules |
| `js/theme-init.js` | Tiny script in `<head>` that applies the saved theme before the page paints (prevents a light flash on reload) |
| `js/main.js` | Project data, card rendering, filtering, details dialog, certificate viewer, mobile menu, theme toggle, form validation and sending |
| `assets/` | Images (the hero picture comes as WebP with a PNG fallback), logos, certificate images and thumbnails, project screenshots and my CV (`SaungHninnPhyu-CV.pdf`) |
| `screenshots/` | The desktop and mobile screenshots above, plus `light/` and `dark/` folders with every section of the page in both themes |

## Page sections

Floating header with navigation · Hero (with highlights) · About (with "Outside of coding" and "Why work with me") · Skills (with "Learning" badges) · Projects (coloured band with category filters) · Journey (education, certificates and a reference) · Contact (form, email and profile links) · Footer.

## Screenshots of every section

Taken at 1280px wide in Chrome. The left column is the light theme (the default), the right column is the dark theme.

| Section | Light theme | Dark theme |
| --- | --- | --- |
| Hero | ![Hero in the light theme](screenshots/light/01-hero.jpg) | ![Hero in the dark theme](screenshots/dark/01-hero.jpg) |
| About | ![About in the light theme](screenshots/light/02-about.jpg) | ![About in the dark theme](screenshots/dark/02-about.jpg) |
| Skills | ![Skills in the light theme](screenshots/light/03-skills.jpg) | ![Skills in the dark theme](screenshots/dark/03-skills.jpg) |
| Projects | ![Projects in the light theme](screenshots/light/04-projects.jpg) | ![Projects in the dark theme](screenshots/dark/04-projects.jpg) |
| Project details dialog | ![Project details dialog in the light theme](screenshots/light/07-project-details.jpg) | ![Project details dialog in the dark theme](screenshots/dark/07-project-details.jpg) |
| Journey | ![Journey in the light theme](screenshots/light/05-journey.jpg) | ![Journey in the dark theme](screenshots/dark/05-journey.jpg) |
| Contact and footer | ![Contact and footer in the light theme](screenshots/light/06-contact.jpg) | ![Contact and footer in the dark theme](screenshots/dark/06-contact.jpg) |

## Features

### 1. Mobile navigation
- Below 860px a real `<button>` opens and closes the menu; `aria-expanded` always matches its state. On wider screens the links sit in the header.
- Choosing a link scrolls to that section and closes the menu. Escape or clicking outside also closes it.
- Closed links use `display: none`, so they are out of the keyboard tab order.
- The link of the section you are reading is highlighted with `aria-current`.
- If JavaScript is off, the links simply stay visible.

### 2. Contact form validation and sending
- Name of at least 2 characters, a valid email format, and a message of 20 to 500 characters, all checked **after trimming spaces**.
- Each invalid field shows an error beside it (warning symbol + text + thicker red border, so it isn't colour alone) and `aria-invalid`. Focus moves to the first invalid field.
- Errors clear as soon as a field becomes valid, entered values are kept, and a live counter shows message length.
- Only a fully valid form is sent. It's posted with `fetch()` to [Web3Forms](https://web3forms.com/), which emails it to me, so the page never reloads and no backend of my own is needed.
- While sending, the button shows "Sending..." and is disabled to prevent double submissions. The result appears in an accessible status message under the form:
  - **Success:** "Thanks! Your message has been sent." The form then clears and the counter resets.
  - **Failure:** an error message pointing to my email address, with the visitor's text kept.
- The Web3Forms `access_key` is a hidden field in the form. It's designed to be public: it only lets the form deliver messages to my inbox.

> **Coursework note:** the brief asks for a demo-only form that never contacts a server. The first submitted version did that, showing "Demo only. Your message has not been sent." Sending was added afterwards on the `feature/contact-form` branch.

### 3. Project cards, filters and details
- Projects are stored in the `projects` array of objects in `js/main.js` (title, description, category, technologies, demo and/or source URL, plus feature cards and a short story for the dialog).
- Cards **and** filter buttons are generated from that data, so adding a project, or even a new category, needs no HTML changes. Card numbers come from a CSS counter, so they always match the cards shown.
- Filters: **All (7)**, **Web Apps (3)**, **AI Apps (2)**, **Machine Learning (2)**. The selected button uses `aria-pressed="true"` and a filled style, and the visible result count is announced.
- Filtering uses `Array.filter()` (a new array) and `replaceChildren()`, so the original data is never changed and switching filters never duplicates cards.
- **Details** opens a native `<dialog>` with the project's features, the problem, what I did and the outcome. Escape or the close button closes it, the page behind can't be scrolled, and focus returns to the button that opened it.
- An odd number of cards leaves the last one centred.

### 4. Light and dark theme
- The moon/sun button is named "Dark theme" and uses `aria-pressed` for its state.
- Both themes are built from CSS custom properties, so the whole page (cards, nav, form fields, buttons, dialogs and messages) changes together.
- The choice is saved in `localStorage` and restored on reload; light is the default.
- All storage access is wrapped in `try/catch`, so if storage is blocked the toggle still works for the current visit.

### Extras
- **Certificate viewer:** clicking a certificate picture opens it large, with previous and next buttons (also the arrow keys and swiping), Escape to close and focus returning to the picture.
- **Accessibility:** semantic landmarks (`header`, `nav`, `main`, `section`, `footer`), one `h1` with a logical heading order, a skip link, visible labels, descriptive alt text (decorative logos are described by their links), a high-contrast focus ring in both themes, links that say when they open in a new tab, and reduced-motion support.

## Testing done

| Test | Result |
| --- | --- |
| Widths of 360, 768 and 1280px | No horizontal overflow; cards stack to 1, 2 or 3 columns; menu button below 860px, full navigation above |
| Navigation | All section links work; mobile menu opens, closes, and closes after choosing a link |
| Keyboard | Tab order: skip link, logo, menu button, theme toggle, then page content (menu links are skipped while the menu is closed) |
| Invalid form | A 1-character name, an invalid email and a message under 20 characters are rejected with focus on the first invalid field; errors clear when fixed |
| Filters | All 7 → Web Apps 3 → AI Apps 2 → Machine Learning 2 → All 7; exactly one filter is selected at a time; 10 rounds of switching leave 7 cards and no duplicate titles |
| Project data | Pushing a temporary project object adds a card without editing the HTML; removing it restores 7 |
| Details dialog | Opens from the card, Escape closes it, and focus returns to the Details button |
| Certificate viewer | Next and previous move between the two award certificates; Escape closes it and focus returns |
| Theme | Dark persists after reload; light persists after reload; works with storage blocked |
| Structure | One `h1`, no skipped heading levels, no duplicate ids, every image has an `alt`, every field has a label, every internal link has a target |
| Console | No errors |

A real message was not sent during testing, so the Web3Forms delivery was not re-checked after the redesign.

## Performance

Measured with Lighthouse (mobile settings, served locally) before and after tuning:

| | Before | After |
| --- | --- | --- |
| Performance score | 78 | 98 |
| Largest Contentful Paint | 5.9 s | about 2.2 s |
| Page weight on first load | 1,114 KB | 308 KB |
| Accessibility / Best Practices / SEO | 96 / 100 / 100 | 100 / 100 / 100 |

What changed:
- **Hero picture:** the 741 KB PNG now has a 92 KB WebP version (the PNG stays as a fallback inside `<picture>`). It is preloaded and marked `fetchpriority="high"`, because it is the largest thing on the page.
- **Fonts:** only the weights the page uses, loaded without blocking the first paint, and the handwriting font is limited to the letters of "Hello, I'm".
- **Certificate pictures:** cards load small WebP thumbnails; the viewer loads the full-size file only when opened (`data-full`).
- **Below-the-fold images** (school logos, project screenshots) use `loading="lazy"` and `decoding="async"`. The two logo SVGs were optimised with SVGO.
- **Painting:** the blur behind cards was removed because it is invisible on a flat background; only the floating navigation keeps it.
- **Contrast:** the faint skill numbers were darkened, which took Accessibility to 100.

Scores vary a little from run to run and depend on the machine and hosting.

## Git workflow

- Commits were made at each milestone: HTML structure, styles, the menu/theme/form JavaScript, project cards and filters, and the README.
- Project cards and filters were built on `feature/project-filters`, reviewed and merged into `main` through [pull request #1](https://github.com/saunghp/FullStack-Portfolio/pull/1).
- The working contact form was built on `feature/contact-form` and merged through [pull request #2](https://github.com/saunghp/FullStack-Portfolio/pull/2).
- The redesign (new look, project details dialog, certificate viewer and performance work) is built on its own feature branch and merged into `main` through a pull request.

## Known limitations

- The contact form depends on Web3Forms. The free plan allows 250 messages a month, and if the service is down the form asks visitors to email me directly.
- If you replace the CV, keep the filename `SaungHninnPhyu-CV.pdf` (or update the link in `index.html`), or the download link breaks.
- Project screenshots are static images captured from each live demo, so they may not match the latest version of those sites.
- Two machine-learning projects have no live demo, so they link to their source code only.
- The AWS badge and the AgentCamp badge are loaded from the Credly and Global AI Community websites, so they only appear while those sites are reachable.
- Fonts come from Google Fonts; offline, the page falls back to the system font.
- The screenshots show the site as it looked when they were taken; retake them if the design changes.

## Credits

- All text, project content, the hero illustration, CV and certificate images are my own.
- University logos belong to the University of Wollongong and the Singapore Institute of Management, and are used only to identify my education.
- Fonts via Google Fonts: [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque), [Inter](https://fonts.google.com/specimen/Inter) and [Caveat](https://fonts.google.com/specimen/Caveat) (all SIL Open Font License).
- Icons are inline SVGs in a sprite at the top of `index.html`. Several follow the outlines of [Feather](https://feathericons.com/) icons (MIT licence).
- The AWS Certified Cloud Practitioner badge image is loaded from Credly and the AgentCamp badge from the Global AI Community; both are my own credentials.
- Project screenshots were captured once with [Microlink](https://microlink.io/) and saved locally.
- Contact form delivery by [Web3Forms](https://web3forms.com/).
