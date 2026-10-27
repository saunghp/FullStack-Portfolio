/*
 * Runs in <head> before the page is drawn.
 * - Marks that JavaScript is available (CSS only collapses the mobile menu when it is).
 * - Applies a saved theme early so a dark-mode reload does not flash light first.
 * The theme button itself is wired up in main.js.
 */
(function () {
  var root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');

  var savedTheme = null;
  try {
    savedTheme = window.localStorage.getItem('portfolio-theme');
  } catch (error) {
    // Storage can be blocked (private mode, strict settings). Fall back to light.
  }

  root.setAttribute('data-theme', savedTheme === 'dark' ? 'dark' : 'light');
})();
