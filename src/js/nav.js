(function () {
  'use strict';

  var hamburger = document.getElementById('hamburger');
  var backdrop  = document.getElementById('navBackdrop');
  var sidebar   = document.getElementById('sidebar');

  function openNav() {
    document.body.classList.add('nav-open');
    hamburger.setAttribute('aria-expanded', 'true');
  }

  function closeNav() {
    document.body.classList.remove('nav-open');
    hamburger.setAttribute('aria-expanded', 'false');
  }

  function toggleNav() {
    if (document.body.classList.contains('nav-open')) {
      closeNav();
    } else {
      openNav();
    }
  }

  if (hamburger) {
    hamburger.addEventListener('click', toggleNav);
  }

  // Close when tapping the backdrop
  if (backdrop) {
    backdrop.addEventListener('click', closeNav);
  }

  // Close when a nav link is tapped (smooth UX on mobile)
  if (sidebar) {
    var links = sidebar.querySelectorAll('.nav-link');
    links.forEach(function (link) {
      link.addEventListener('click', closeNav);
    });
  }

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });
}());
