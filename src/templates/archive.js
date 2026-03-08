'use strict';

const layout = require('./layout');

const PAGE_SIZE = 20;

/**
 * Build all archive pages (pagination).
 * Returns an array of { filePath, html } objects.
 *
 * @param {Array} posts - all posts sorted by date descending
 */
function archivePages(posts) {
  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const pages = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const start = (pageNum - 1) * PAGE_SIZE;
    const slice = posts.slice(start, start + PAGE_SIZE);
    const rootPath = pageNum === 1 ? '../' : '../../../';

    const items = slice
      .map(
        (p) => `
      <li class="archive-item">
        <span class="archive-item__date">${p.date}${p.readingTimeLabel ? ` &bull; ${p.readingTimeLabel}` : ''}</span>
        <div class="archive-item__content">
          <a href="${pageNum === 1 ? '' : '../'}../posts/${p.slug}/index.html" class="archive-item__title title-with-chip">${p.displayTitle}${p.isBookReview ? '<span class="review-chip">BOOK REVIEW</span>' : ''}</a>
          ${p.tags.length
            ? `<div class="tag-list">${p.tags
                .map(
                  (tag) => `<a class="tag-link" href="${rootPath}tags/${tag.slug}/index.html">${tag.name}</a>`
                )
                .join('')}</div>`
            : ''}
        </div>
      </li>`
      )
      .join('\n');

    // Pagination controls
    const prevLink =
      pageNum > 1
        ? `<a href="${pageNum === 2 ? '../index.html' : `../page/${pageNum - 1}/index.html`}" class="pagination__link pagination__link--prev">&larr; Newer</a>`
        : `<span class="pagination__link pagination__link--disabled">&larr; Newer</span>`;

    const nextLink =
      pageNum < totalPages
        ? `<a href="../page/${pageNum + 1}/index.html" class="pagination__link pagination__link--next">Older &rarr;</a>`
        : `<span class="pagination__link pagination__link--disabled">Older &rarr;</span>`;

    const content = `
      <div class="page-header">
        <h1 class="page-header__title">Archive</h1>
        <span class="page-header__sub">Page ${pageNum} of ${totalPages} &mdash; ${posts.length} post${posts.length !== 1 ? 's' : ''}</span>
      </div>
      <ul class="archive-list">
        ${items.length ? items : '<li class="empty">No posts yet.</li>'}
      </ul>
      <nav class="pagination">
        ${prevLink}
        <span class="pagination__info">${pageNum} / ${totalPages}</span>
        ${nextLink}
      </nav>`;

    // Page 1 → archive/index.html, page N → archive/page/N/index.html
    const filePath =
      pageNum === 1
        ? 'docs/archive/index.html'
        : `docs/archive/page/${pageNum}/index.html`;

    pages.push({
      filePath,
      html: layout({ title: 'Archive', content, activePage: 'archive', rootPath }),
    });
  }

  return pages;
}

module.exports = archivePages;
