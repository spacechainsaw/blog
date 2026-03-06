'use strict';

const layout = require('./layout');

function tagsIndexPage(tags) {
  const items = tags
    .map(
      (tag) => `
      <li class="archive-item">
        <a href="${tag.slug}/index.html" class="archive-item__title">${tag.name}</a>
        <span class="archive-item__count">${tag.posts.length} post${tag.posts.length !== 1 ? 's' : ''}</span>
      </li>`
    )
    .join('\n');

  const content = `
    <div class="page-header">
      <h1 class="page-header__title">Categories</h1>
      <span class="page-header__sub">Browse posts by category</span>
    </div>
    <ul class="archive-list">
      ${items.length ? items : '<li class="empty">No categories yet.</li>'}
    </ul>`;

  return layout({
    title: 'Categories',
    content,
    activePage: 'tags',
    rootPath: '../',
  });
}

function tagPage(tag) {
  const items = tag.posts
    .map(
      (post) => `
      <li class="archive-item">
        <span class="archive-item__date">${post.date}${post.readingTimeLabel ? ` &bull; ${post.readingTimeLabel}` : ''}</span>
        <a href="../../posts/${post.slug}/index.html" class="archive-item__title">${post.title}</a>
      </li>`
    )
    .join('\n');

  const content = `
    <div class="page-header">
      <h1 class="page-header__title">Category: ${tag.name}</h1>
      <span class="page-header__sub">${tag.posts.length} post${tag.posts.length !== 1 ? 's' : ''}</span>
    </div>
    <ul class="archive-list">
      ${items.length ? items : '<li class="empty">No posts in this category yet.</li>'}
    </ul>`;

  return layout({
    title: `Category: ${tag.name}`,
    content,
    activePage: 'tags',
    rootPath: '../../',
  });
}

module.exports = {
  tagsIndexPage,
  tagPage,
};
