'use strict';

/**
 * Base HTML shell for every page.
 * @param {object} opts
 * @param {string} opts.title       - <title> tag content
 * @param {string} opts.content     - inner HTML for <main>
 * @param {string} opts.activePage  - 'home' | 'about' | 'archive' | 'tags'
 * @param {string} [opts.rootPath]  - path prefix to reach root, e.g. '../../' for nested pages
 */
function layout({ title, content, activePage, rootPath = '' }) {
  const nav = [
    { id: 'home',    label: 'Home',    href: `${rootPath}index.html` },
    { id: 'about',   label: 'About',   href: `${rootPath}about/index.html` },
    { id: 'archive', label: 'Archive', href: `${rootPath}archive/index.html` },
    { id: 'tags',    label: 'Categories', href: `${rootPath}tags/index.html` },
  ];

  const navLinks = nav
    .map(
      ({ id, label, href }) =>
        `<a href="${href}" class="nav-link${activePage === id ? ' nav-link--active' : ''}">${label}</a>`
    )
    .join('\n        ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} — space chainsaw</title>
  <link rel="stylesheet" href="${rootPath}css/style.css">
</head>
<body>

  <!-- Mobile top bar (hidden on desktop) -->
  <header class="topbar">
    <span class="topbar__title"><a href="${rootPath}index.html">space chainsaw</a></span>
    <button class="hamburger" id="hamburger" aria-label="Toggle navigation" aria-expanded="false">
      <span class="hamburger__line"></span>
      <span class="hamburger__line"></span>
      <span class="hamburger__line"></span>
    </button>
  </header>

  <!-- Overlay backdrop (mobile) -->
  <div class="nav-backdrop" id="navBackdrop"></div>

  <!-- Site wrapper: CSS grid on desktop, normal flow on mobile -->
  <div class="site-wrapper">

    <!-- Sidebar -->
    <aside class="sidebar" id="sidebar">
      <div class="sidebar__brand">
        <a href="${rootPath}index.html" class="sidebar__title">space chainsaw</a>
      </div>
      <nav class="sidebar__nav">
        ${navLinks}
      </nav>
    </aside>

    <!-- Main content -->
    <div class="layout">
      <main class="main-content">
        ${content}
      </main>
      <footer class="footer">
        <span>&copy; <span id="year"></span> space chainsaw</span>
        <span> &bull; <a href="${rootPath}rss.xml">RSS</a></span>
      </footer>
    </div>

  </div><!-- /.site-wrapper -->

  <script src="${rootPath}js/nav.js"></script>
  <script>document.getElementById('year').textContent = new Date().getFullYear();</script>
</body>
</html>`;
}

module.exports = layout;
