'use strict';

const layout = require('./layout');

/**
 * Homepage — list of latest 10 posts.
 * @param {Array} posts - array of post metadata objects
 */
function homePage(posts) {
  const items = posts
    .slice(0, 10)
    .map(
      (p) => `
    <article class="post-card">
      <div class="post-card__meta">${p.date}${p.readingTimeLabel ? ` &bull; ${p.readingTimeLabel}` : ''}</div>
      <h2 class="post-card__title">
        <a href="posts/${p.slug}/index.html">${p.title}</a>
      </h2>
      ${p.description ? `<p class="post-card__desc">${p.description}</p>` : ''}
      ${p.tags.length
        ? `<div class="tag-list">${p.tags
            .map(
              (tag) => `<a class="tag-link" href="tags/${tag.slug}/index.html">${tag.name}</a>`
            )
            .join('')}</div>`
        : ''}
    </article>`
    )
    .join('\n');

  const content = `
    <div class="page-header">
      <h1 class="page-header__title">Latest Posts</h1>
    </div>
    <div class="post-list">
      ${items.length ? items : '<p class="empty">No posts yet. Add a <code>.md</code> file to the <code>posts/</code> folder.</p>'}
    </div>`;

  return layout({ title: 'Home', content, activePage: 'home', rootPath: '' });
}

module.exports = homePage;
