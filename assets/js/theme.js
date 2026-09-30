// Nav behavior: light/dark toggle, the mobile menu, and the scroll highlight
// that tracks which homepage section you are in. Loaded with `defer`, so the
// DOM is already parsed.

// --- Light/dark toggle ---
// By default the theme follows the OS (matched pre-paint by the inline script in
// _includes/head.html, and tracked live below). Flipping the switch stores an
// explicit choice that overrides the OS from then on. The knob's position is
// driven by data-theme in CSS; here we sync the checkbox to it and react to input.
(function () {
  var box = document.getElementById('theme-switch');
  if (!box) return;

  var root = document.documentElement;

  function stored() {
    try {
      var t = localStorage.getItem('theme');
      return t === 'dark' || t === 'light' ? t : null;
    } catch (e) {
      return null;
    }
  }

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    box.checked = theme === 'dark'; // checked = dark (knob toward the moon)
  }

  apply(root.getAttribute('data-theme') || 'light');

  // Flip: remember the choice as an explicit override.
  box.addEventListener('change', function () {
    var next = box.checked ? 'dark' : 'light';
    try { localStorage.setItem('theme', next); } catch (e) {}
    apply(next);
  });

  // Follow the OS live — but only while the user hasn't made an explicit choice.
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', function (e) {
    if (stored()) return;
    apply(e.matches ? 'dark' : 'light');
  });
})();

// --- Mobile menu ---
// The menu is hidden by CSS below the nav's breakpoint; the button toggles a
// class rather than inline styles so the breakpoint stays the CSS's business.
(function () {
  var button = document.getElementById('nav-toggle');
  var menu = document.getElementById('nav-menu');
  if (!button || !menu) return;

  function setOpen(open) {
    menu.classList.toggle('open', open);
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    button.querySelector('.visually-hidden').textContent =
      open ? 'Hide navigation' : 'Show navigation';
  }

  button.addEventListener('click', function () {
    setOpen(!menu.classList.contains('open'));
  });

  // Tapping a tab navigates; close behind it so the destination is visible.
  menu.addEventListener('click', function (e) {
    if (e.target.closest('.nav-link')) setOpen(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      setOpen(false);
      button.focus();
    }
  });
})();

// --- Scroll highlight ---
// Five of the seven tabs point at sections of the homepage, so `nav:` front
// matter can only ever mark one of them active. On the homepage we take over
// and mark whichever section is currently in view. Other pages keep the
// server-rendered active tab and skip this entirely.
(function () {
  var tabs = Array.prototype.slice.call(
    document.querySelectorAll('.nav-link[data-section]')
  );
  if (!tabs.length) return;

  var sections = tabs
    .map(function (tab) { return document.getElementById(tab.dataset.section); })
    .filter(Boolean);
  if (!sections.length) return; // not the homepage

  function activate(id) {
    tabs.forEach(function (tab) {
      tab.classList.toggle('active', tab.dataset.section === id);
    });
  }

  // Track how much of each section is on screen and light up the largest. The
  // top margin discounts the strip behind the sticky nav, which is covered.
  var ratios = {};
  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        ratios[entry.target.id] = entry.isIntersecting ? entry.intersectionRatio : 0;
      });
      var best = null;
      Object.keys(ratios).forEach(function (id) {
        if (ratios[id] > 0 && (!best || ratios[id] > ratios[best])) best = id;
      });
      if (best) activate(best);
    },
    {
      rootMargin: '-' + (document.getElementById('top-nav') || { offsetHeight: 60 }).offsetHeight + 'px 0px 0px 0px',
      threshold: [0, 0.1, 0.25, 0.5, 0.75, 1]
    }
  );

  sections.forEach(function (section) { observer.observe(section); });
})();
