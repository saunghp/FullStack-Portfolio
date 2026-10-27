# Saung Hninn Phyu – Portfolio

A one-page personal portfolio built with plain **HTML, CSS and vanilla JavaScript**: no frameworks, libraries, build step or backend of my own. It introduces me, lists the skills I'm using and learning, shows my projects with category filters, and lets visitors message me through a working contact form.

Built for the Let's Tech Club Fullstack Development portfolio project.

| Desktop (1280px) | Mobile (360px) |
| --- | --- |
| ![Desktop view of the portfolio hero section](screenshots/desktop.png) | ![Mobile view of the portfolio hero section](screenshots/mobile.png) |

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
| `index.html` | Page content and semantic structure |
| `css/style.css` | All styles, light/dark theme tokens and responsive rules |
| `js/theme-init.js` | Tiny script in `<head>` that applies the saved theme before the page paints (prevents a light flash on reload) |
| `js/main.js` | Project data, card rendering, filtering, mobile menu, theme toggle, form validation and sending |
| `assets/` | Images, logos, certificate images and my CV (`SaungHninnPhyu-CV.pdf`) |
| `screenshots/` | Desktop and mobile screenshots for submission |

## Features

### Page sections
Header with navigation · Hero · About · Skills (with "Learning" badges) · Projects · Journey (education and certificates) · Contact form, email and profile links · Footer.

### 1. Mobile navigation
- Below 860px a real `<button>` opens and closes the menu; `aria-expanded` always matches its state.
- Choosing a link scrolls to that section and closes the menu. Escape or clicking outside also closes it.
- Closed links use `display: none`, so they are out of the keyboard tab order.
- If JavaScript is off, the links simply stay visible.

### 2. Contact form validation and sending
- Name of at least 2 characters, a valid email format, and a message of 20 to 500 characters, all checked **after trimming spaces**.
- Each invalid field shows an error beside it (icon + text + red border, so it isn't colour alone) and `aria-invalid`. Focus moves to the first invalid field.
- Errors clear as soon as a field becomes valid, entered values are kept, and a live counter shows message length.
- Only a fully valid form is sent. It's posted with `fetch()` to [Web3Forms](https://web3forms.com/), which emails it to me, so the page never reloads and no backend of my own is needed.
- While sending, the button shows "Sending..." and is disabled to prevent double submissions. The result appears in an accessible status message under the form:
  - **Success:** "Thanks! Your message has been sent." The form then clears and the counter resets.
  - **Failure:** an error message pointing to my email address, with the visitor's text kept.
- The Web3Forms `access_key` is a hidden field in the form. It's designed to be public: it only lets the form deliver messages to my inbox.

> **Coursework note:** the brief asks for a demo-only form that never contacts a server. The submitted version did that, showing "Demo only. Your message has not been sent." Sending was added afterwards on the `feature/contact-form` branch.

### 3. Project cards and category filters
- Projects are stored in the `projects` array of objects in `js/main.js` (title, description, category, technologies, demo and/or source URL).
- Cards **and** filter buttons are generated from that data, so adding a project, or even a new category, needs no HTML changes.
- Filters: **All (7)**, **Web Apps (3)**, **AI Apps (2)**, **Machine Learning (2)**. The selected button uses `aria-pressed="true"`, a filled style and a check mark, and the visible result count is announced.
- Filtering uses `Array.filter()` (a new array) and `replaceChildren()`, so the original data is never changed and switching filters never duplicates cards.

### 4. Light and dark theme
- The moon/sun button is named "Dark theme" and uses `aria-pressed` for its state.
- Both themes are built from CSS custom properties, so the whole page (cards, nav, form fields, buttons and messages) changes together.
- The choice is saved in `localStorage` and restored on reload; light is the default.
- All storage access is wrapped in `try/catch`, so if storage is blocked the toggle still works for the current visit.

### Accessibility
Semantic landmarks (`header`, `nav`, `main`, `section`, `footer`), one `h1` with a logical heading order, a skip link, visible labels, descriptive alt text (decorative logos use `alt=""`), a high-contrast focus ring in both themes, links that say when they open in a new tab, and reduced-motion support.

## Testing done

| Test | Result |
| --- | --- |
| Widths of 360, 768 and 1280px | No horizontal overflow; cards stack to 1, 2 or 3 columns |
| Navigation | All section links work; mobile menu opens, closes, and closes after choosing a link |
| Keyboard | Tab order: skip link, logo, menu, links (only when open), theme toggle, then page content; Enter opens the menu |
| Invalid form | Empty, 1-character name, `bad@x` email, 9-character and 501-character messages are rejected with focus on the first invalid field |
| Valid form | Sends name, email, message and access key to Web3Forms with no reload, shows the thank-you message, then clears the form (checked with a simulated response) |
| Failed send | Shows the error message with my email address and keeps what the visitor typed (checked with a simulated failure) |
| CV link | "Download my CV" downloads `assets/SaungHninnPhyu-CV.pdf` |
| Filters | All 7 → Web Apps 3 → AI Apps 2 → Machine Learning 2 → All 7, with repeated switching and no duplicates |
| Theme | Dark persists after reload; light persists after reload; works with storage blocked |
| Links and console | All 18 external links return 200; no console errors |

**Project data test:** add a temporary object to the `projects` array in `js/main.js` and reload. A new card appears, and its category's count updates. Remove it afterwards.

## Git workflow

- Commits were made at each milestone: HTML structure, styles, the menu/theme/form JavaScript, project cards and filters, and the README.
- Project cards and filters were built on `feature/project-filters`, reviewed and merged into `main` through [pull request #1](https://github.com/saunghp/FullStack-Portfolio/pull/1).
- The working contact form is on `feature/contact-form`.

## Known limitations

- The contact form depends on Web3Forms. The free plan allows 250 messages a month, and if the service is down the form asks visitors to email me directly.
- If you replace the CV, keep the filename `SaungHninnPhyu-CV.pdf` (or update the link in `index.html`), or the download link breaks.

- Project screenshots are static images captured from each live demo, so they may not match the latest version of those sites.
- Two machine-learning projects have no live demo, so they link to their source code only.
- Fonts come from Google Fonts; offline, the page falls back to the system font.

## Credits

- All text, project content, the hero illustration, CV and certificate images are my own, reused from my previous portfolio.
- University logos belong to the University of Wollongong and the Singapore Institute of Management, and are used only to identify my education.
- Font: [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) (SIL Open Font License) via Google Fonts.
- Icons are simple inline SVGs drawn for this site.
- Project screenshots were captured once with [Microlink](https://microlink.io/) and saved locally.
- Contact form delivery by [Web3Forms](https://web3forms.com/).
