'use strict';

const layout = require('./layout');

/**
 * About Me page.
 * @param {string} htmlContent - rendered HTML from about.md
 */
function aboutPage(htmlContent) {
  const content = `
    <article class="post">
      <header class="post__header">
        <h1 class="post__title">About Me</h1>
      </header>
      <div class="post__body">
        ${htmlContent}
      </div>
    </article>`;

  return layout({ title: 'About', content, activePage: 'about', rootPath: '../' });
}

module.exports = aboutPage;
