'use strict';

const fs   = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const homePage    = require('./src/templates/home');
const postPage    = require('./src/templates/post');
const archivePages = require('./src/templates/archive');
const aboutPage   = require('./src/templates/about');
const { tagsIndexPage, tagPage } = require('./src/templates/tags');
const packageJson = require('./package.json');

// ---- Helpers --------------------------------------------------------

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('  wrote  ', path.relative(__dirname, filePath));
}

function copyAsset(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  console.log('  copied ', path.relative(__dirname, dest));
}

function slugifyTag(tag) {
  return String(tag)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeTags(data) {
  const raw =
    data.tags !== undefined
      ? data.tags
      : data.categories !== undefined
        ? data.categories
        : data.category;

  const values = Array.isArray(raw)
    ? raw
    : typeof raw === 'string'
      ? raw.split(',')
      : [];

  const seen = new Set();
  const tags = [];

  values.forEach((value) => {
    const name = String(value).trim();
    if (!name) return;

    const slug = slugifyTag(name);
    if (!slug || seen.has(slug)) return;

    seen.add(slug);
    tags.push({ name, slug });
  });

  return tags;
}

function parseDraftFlag(value) {
  if (value === true) return true;
  if (value === false || value === undefined || value === null) return false;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['true', '1', 'yes', 'y'].includes(normalized);
  }
  return false;
}

function parseRating(value) {
  if (value === undefined || value === null || value === '') return null;

  const numeric = Number(value);
  if (Number.isNaN(numeric)) return null;

  const clamped = Math.max(0, Math.min(5, numeric));
  return Math.round(clamped * 10) / 10;
}

function formatRatingStars(rating) {
  if (rating === null) return '';

  const roundedToHalf = Math.round(rating * 2) / 2;
  const fullStars = Math.floor(roundedToHalf);
  const hasHalfStar = roundedToHalf % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return `${'★'.repeat(fullStars)}${hasHalfStar ? '½' : ''}${'☆'.repeat(emptyStars)}`;
}

function stripMarkdown(markdown) {
  return String(markdown)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, '$1')
    .replace(/[>#*_~\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function estimateReadingTimeMinutes(markdown, wordsPerMinute = 225) {
  const plain = stripMarkdown(markdown);
  if (!plain) return 1;

  const wordCount = plain.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatRfc2822Date(dateString) {
  const parsed = dateString ? new Date(`${dateString}T00:00:00Z`) : new Date();
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  return date.toUTCString();
}

function buildRssXml({ posts, siteUrl, siteTitle, siteDescription }) {
  const now = new Date().toUTCString();

  const items = posts
    .map((post) => {
      const postUrl = `${siteUrl}/posts/${post.slug}/`;
      return `
    <item>
      <title>${xmlEscape(post.title)}</title>
      <link>${xmlEscape(postUrl)}</link>
      <guid>${xmlEscape(postUrl)}</guid>
      <pubDate>${formatRfc2822Date(post.date)}</pubDate>
      <description>${xmlEscape(post.description || `${post.readingTimeMinutes} minute read`)}</description>
    </item>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${xmlEscape(siteTitle)}</title>
    <link>${xmlEscape(siteUrl)}</link>
    <description>${xmlEscape(siteDescription)}</description>
    <lastBuildDate>${now}</lastBuildDate>
    ${items}
  </channel>
</rss>
`;
}

function getHostname(siteUrl) {
  try {
    return new URL(siteUrl).hostname;
  } catch {
    return '';
  }
}

function buildTagIndex(posts) {
  const tagMap = new Map();

  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      if (!tagMap.has(tag.slug)) {
        tagMap.set(tag.slug, {
          name: tag.name,
          slug: tag.slug,
          posts: [],
        });
      }
      tagMap.get(tag.slug).posts.push(post);
    });
  });

  return Array.from(tagMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );
}

// ---- Read & parse posts ---------------------------------------------

function readPosts() {
  const postsDir = path.join(__dirname, 'posts');

  if (!fs.existsSync(postsDir)) return [];

  return fs
    .readdirSync(postsDir)
    .filter((f) => f.endsWith('.md'))
    .map((filename) => {
      const raw = fs.readFileSync(path.join(postsDir, filename), 'utf8');
      const { data, content } = matter(raw);

      // slug: use frontmatter slug, or derive from filename
      const slug = data.slug || filename.replace(/\.md$/, '');

      // date: normalise to YYYY-MM-DD string
      const date = data.date
        ? String(data.date).slice(0, 10)
        : '';

      return {
        title:       data.title       || slug,
        date,
        description: data.description || '',
        slug,
        rating: parseRating(data.rating),
        draft: parseDraftFlag(data.draft),
        tags: normalizeTags(data),
        readingTimeMinutes: estimateReadingTimeMinutes(content),
        htmlContent: marked(content),
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first
}

// ---- Build ----------------------------------------------------------

(function build() {
  const docsDir = path.join(__dirname, 'docs');

  // Always rebuild docs/ from scratch to avoid stale pages lingering
  fs.rmSync(docsDir, { recursive: true, force: true });
  ensureDir(docsDir);

  console.log('\nspace chainsaw — build\n');

  // 1. Static assets
  copyAsset(
    path.join(__dirname, 'src/css/style.css'),
    path.join(docsDir, 'css/style.css')
  );
  copyAsset(
    path.join(__dirname, 'src/js/nav.js'),
    path.join(docsDir, 'js/nav.js')
  );

  // 2. Parse posts
  const allPosts = readPosts();
  const posts = allPosts
    .filter((post) => !post.draft)
    .map((post) => ({
      ...post,
      readingTimeLabel: `${post.readingTimeMinutes} minute read`,
      ratingLabel: post.rating !== null ? `${post.rating}/5` : '',
      ratingStars: formatRatingStars(post.rating),
    }));
  const tags = buildTagIndex(posts);
  const siteTitle = packageJson.name || 'My Blog';
  const siteDescription = packageJson.description || 'Blog RSS feed';
  const siteUrl = String(process.env.SITE_URL || packageJson.homepage || 'https://example.com').replace(/\/$/, '');

  // 3. Homepage
  writeFile(path.join(docsDir, 'index.html'), homePage(posts));

  // 4. Individual post pages
  posts.forEach((post) => {
    writeFile(
      path.join(docsDir, 'posts', post.slug, 'index.html'),
      postPage(post)
    );
  });

  // 5. Archive (may produce multiple paginated pages)
  archivePages(posts).forEach(({ filePath, html }) => {
    // filePath is relative, e.g. "docs/archive/index.html"
    writeFile(path.join(__dirname, filePath), html);
  });

  // 6. Tag index + per-tag pages
  writeFile(path.join(docsDir, 'tags', 'index.html'), tagsIndexPage(tags));
  tags.forEach((tag) => {
    writeFile(
      path.join(docsDir, 'tags', tag.slug, 'index.html'),
      tagPage(tag)
    );
  });

  // 7. RSS feed
  writeFile(
    path.join(docsDir, 'rss.xml'),
    buildRssXml({ posts, siteUrl, siteTitle, siteDescription })
  );

  // 8. Custom domain for GitHub Pages
  const siteHost = getHostname(siteUrl);
  if (siteHost) {
    writeFile(path.join(docsDir, 'CNAME'), `${siteHost}\n`);
  }

  // 9. About page
  const aboutMdPath = path.join(__dirname, 'content', 'about.md');
  const aboutHtml = fs.existsSync(aboutMdPath)
    ? marked(matter(fs.readFileSync(aboutMdPath, 'utf8')).content)
    : '<p>Coming soon.</p>';

  writeFile(path.join(docsDir, 'about', 'index.html'), aboutPage(aboutHtml));

  if (!process.env.SITE_URL && !packageJson.homepage) {
    console.warn('\n[warn] RSS feed uses placeholder site URL (https://example.com). Set SITE_URL or package.json homepage for correct subscribe links.\n');
  }

  console.log(`\nDone — ${posts.length} published post(s) built (${allPosts.length - posts.length} draft(s) skipped).\n`);
}());
