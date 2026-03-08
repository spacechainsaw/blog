'use strict';

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const ROOT = path.join(__dirname, '..');

function collectMarkdownFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];

  return fs.readdirSync(dirPath, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) return collectMarkdownFiles(fullPath);
    return entry.isFile() && entry.name.endsWith('.md') ? [fullPath] : [];
  });
}

function toAbsolute(inputPath) {
  return path.isAbsolute(inputPath) ? inputPath : path.join(ROOT, inputPath);
}

function resolveInputToFiles(inputPath) {
  const candidates = [];
  const raw = inputPath.trim();
  const withExt = raw.endsWith('.md') ? raw : `${raw}.md`;

  candidates.push(toAbsolute(raw));
  candidates.push(toAbsolute(withExt));
  candidates.push(path.join(ROOT, 'posts', raw));
  candidates.push(path.join(ROOT, 'posts', withExt));
  candidates.push(path.join(ROOT, 'posts', 'book-reviews', raw));
  candidates.push(path.join(ROOT, 'posts', 'book-reviews', withExt));

  const files = [];

  candidates.forEach((candidate) => {
    if (!fs.existsSync(candidate)) return;
    if (fs.statSync(candidate).isDirectory()) {
      files.push(...collectMarkdownFiles(candidate));
      return;
    }
    if (candidate.endsWith('.md')) files.push(candidate);
  });

  return files;
}

function getCliArgs() {
  return process.argv.slice(2).filter(Boolean);
}

function getTargetFiles(inputs) {
  if (!inputs.length) {
    return collectMarkdownFiles(path.join(ROOT, 'posts', 'book-reviews'));
  }

  return inputs
    .flatMap((inputPath) => resolveInputToFiles(inputPath))
    .filter((filePath, index, arr) => arr.indexOf(filePath) === index);
}

function normalizeFrontmatter(data) {
  const next = { ...data };

  if (next.date instanceof Date && !Number.isNaN(next.date.getTime())) {
    next.date = next.date.toISOString().slice(0, 10);
  }

  return next;
}

function normalizeInlineText(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function toStandaloneQuoteBlock(line) {
  const trimmed = line.trim();
  const match = trimmed.match(/^"(.+?)"(?:\s+.+)?$/);
  if (!match) return '';

  const quote = match[1].trim();
  if (!quote) return '';

  return `> ${quote}`;
}

function parseSections(content) {
  const lines = content.split(/\r?\n/);
  const sections = [];
  let current = { title: '', lines: [] };

  lines.forEach((line) => {
    const headingMatch = line.match(/^##+\s+(.+)$/);
    if (headingMatch) {
      sections.push(current);
      current = { title: headingMatch[1].trim().toLowerCase(), lines: [] };
      return;
    }

    current.lines.push(line);
  });

  sections.push(current);
  return sections;
}

function collapseBulletsToSentence(lines, lead) {
  const items = lines
    .map((line) => line.replace(/^\s*[-*]\s+/, '').trim())
    .filter(Boolean);

  if (!items.length) return '';
  return `${lead} ${items.join('; ')}.`;
}

function normalizeSection(section) {
  const title = section.title;
  const rawLines = section.lines.map((line) => line.trimEnd());

  const blocks = [];
  let paragraphBuffer = [];
  let bulletBuffer = [];

  function flushParagraph() {
    if (!paragraphBuffer.length) return;
    const text = normalizeInlineText(paragraphBuffer.join(' '));
    if (text) blocks.push(text);
    paragraphBuffer = [];
  }

  function flushBullets() {
    if (!bulletBuffer.length) return;

    const titleMap = {
      'what worked': 'What worked for me:',
      'what didn’t work for me': 'What did not work as well for me:',
      "what didn't work for me": 'What did not work as well for me:',
      'who should read this': 'This book is likely to resonate with:',
      'content notes': 'Content notes:',
    };

    const lead = titleMap[title] || 'Key points:';
    const sentence = collapseBulletsToSentence(bulletBuffer, lead);
    if (sentence) blocks.push(sentence);
    bulletBuffer = [];
  }

  rawLines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushBullets();
      return;
    }

    if (/^\s*[-*]\s+/.test(trimmed)) {
      flushParagraph();
      bulletBuffer.push(trimmed);
      return;
    }

    if (trimmed.startsWith('>')) {
      flushParagraph();
      flushBullets();
      blocks.push(trimmed);
      return;
    }

    const maybeQuote = toStandaloneQuoteBlock(trimmed);
    if (maybeQuote && maybeQuote.length > 45) {
      flushParagraph();
      flushBullets();
      blocks.push(maybeQuote);
      return;
    }

    paragraphBuffer.push(trimmed);
  });

  flushParagraph();
  flushBullets();

  if (!title) return blocks;

  if (title === 'favorite quote' && blocks.length && !blocks[0].startsWith('>')) {
    return [`> ${blocks.join(' ')}`];
  }

  return blocks;
}

function formatNarrative(content) {
  const sections = parseSections(content);

  const blocks = sections
    .flatMap((section) => normalizeSection(section))
    .filter(Boolean)
    .map((block) => block.trim());

  return blocks.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}

function main() {
  const files = getTargetFiles(getCliArgs());

  if (!files.length) {
    console.error('No markdown files found.');
    process.exit(1);
  }

  files.forEach((filePath) => {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = matter(raw);

    const nextData = normalizeFrontmatter(parsed.data);
    const nextContent = formatNarrative(parsed.content);

    const nextRaw = matter.stringify(nextContent, nextData);
    fs.writeFileSync(filePath, nextRaw, 'utf8');

    console.log(`Formatted flow: ${path.relative(ROOT, filePath)}`);
  });
}

main();
