'use strict';

const layout = require('./layout');

/**
 * Single post page.
 * @param {object} post - { title, date, description, slug, htmlContent }
 */
function postPage(post) {
  const content = `
    <article class="post">
      <header class="post__header">
        <div class="post__meta">${post.date}${post.readingTimeLabel ? ` &bull; ${post.readingTimeLabel}` : ''}</div>
        <h1 class="post__title title-with-chip">${post.displayTitle}${post.isBookReview ? '<span class="review-chip">BOOK REVIEW</span>' : ''}</h1>
        ${post.description ? `<p class="post__desc">${post.description}</p>` : ''}
        ${post.ratingLabel ? `<p class="post__rating">${post.ratingStars} <span class="post__rating-value">(${post.ratingLabel})</span></p>` : ''}
        ${post.tags.length
          ? `<div class="tag-list">${post.tags
              .map(
                (tag) => `<a class="tag-link" href="../../tags/${tag.slug}/index.html">${tag.name}</a>`
              )
              .join('')}</div>`
          : ''}
      </header>
      <div class="post__body">
        ${post.htmlContent}
      </div>
      <footer class="post__footer">
        <a href="../../index.html" class="back-link">&larr; Back to Home</a>
      </footer>
    </article>`;

  return layout({
    title: post.displayTitle,
    content,
    activePage: 'home',
    rootPath: '../../',
  });
}

module.exports = postPage;
