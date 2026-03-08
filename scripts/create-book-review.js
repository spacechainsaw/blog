'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TEMPLATE_PATH = path.join(ROOT, 'content', 'book-review-template.md');
const REVIEWS_DIR = path.join(ROOT, 'posts', 'book-reviews');

function getCliArgs() {
  const direct = process.argv.slice(2).filter(Boolean);
  if (direct.length) return direct;

  if (process.env.npm_config_argv) {
    try {
      const parsed = JSON.parse(process.env.npm_config_argv);
      const original = Array.isArray(parsed.original) ? parsed.original : [];
      const scriptIndex = original.indexOf('book-review');
      if (scriptIndex >= 0) {
        return original.slice(scriptIndex + 1).filter((arg) => arg && arg !== '--');
      }
    } catch {
      return [];
    }
  }

  return [];
}

function toTitleFromSlug(slug) {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function main() {
  const [inputName] = getCliArgs();

  if (!inputName) {
    console.error('Usage: npm run book-review -- <book-title.md>');
    process.exit(1);
  }

  const fileName = inputName.endsWith('.md') ? inputName : `${inputName}.md`;
  const slug = fileName.replace(/\.md$/i, '');

  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error('Missing template file: content/book-review-template.md');
    process.exit(1);
  }

  const destination = path.join(REVIEWS_DIR, fileName);

  if (fs.existsSync(destination)) {
    console.error(`File already exists: posts/book-reviews/${fileName}`);
    process.exit(1);
  }

  fs.mkdirSync(REVIEWS_DIR, { recursive: true });

  const today = new Date().toISOString().slice(0, 10);
  const title = toTitleFromSlug(slug);

  let content = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  content = content
    .replace('title: "Book Review: [Book Title]"', `title: "${title}"`)
    .replace('title: "[Book Title]"', `title: "${title}"`)
    .replace('date: YYYY-MM-DD', `date: ${today}`)
    .replace('# Book Review: [Book Title]', `# ${title}`)
    .replace('# [Book Title]', `# ${title}`)
    .replace('draft: true', 'draft: true');

  fs.writeFileSync(destination, content, 'utf8');
  console.log(`Created posts/book-reviews/${fileName}`);
}

main();
