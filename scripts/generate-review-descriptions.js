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

function getCliArgs() {
  const args = process.argv.slice(2).filter(Boolean);
  if (args.length) return args;

  if (process.env.npm_config_argv) {
    try {
      const parsed = JSON.parse(process.env.npm_config_argv);
      const original = Array.isArray(parsed.original) ? parsed.original : [];
      const scriptIndex = original.indexOf('describe-reviews');
      if (scriptIndex >= 0) {
        return original.slice(scriptIndex + 1).filter((arg) => arg && arg !== '--');
      }
    } catch {
      return [];
    }
  }

  return [];
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
    if (candidate.endsWith('.md')) {
      files.push(candidate);
    }
  });

  return files;
}

function stripMarkdown(text) {
  return String(text)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, '$1')
    .replace(/[>#*_~\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STOP_WORDS = new Set([
  'about', 'after', 'again', 'against', 'almost', 'also', 'although', 'always',
  'among', 'and', 'another', 'any', 'anyone', 'anything', 'are', 'around',
  'because', 'been', 'before', 'being', 'between', 'book', 'both', 'but', 'can',
  'cannot', 'could', 'did', 'does', 'doing', 'done', 'down', 'each', 'even',
  'every', 'everyone', 'everything', 'felt', 'first', 'for', 'from', 'further',
  'get', 'getting', 'got', 'had', 'has', 'have', 'having', 'her', 'here', 'hers',
  'him', 'his', 'how', 'however', 'into', 'its', 'itself', 'just', 'like', 'main',
  'make', 'many', 'might', 'more', 'most', 'much', 'must', 'my', 'myself', 'never',
  'not', 'now', 'only', 'other', 'our', 'ours', 'out', 'over', 'own', 'really',
  'same', 'she', 'should', 'since', 'some', 'such', 'than', 'that', 'the', 'their',
  'them', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'too',
  'toward', 'under', 'until', 'very', 'want', 'was', 'way', 'well', 'were', 'what',
  'when', 'where', 'which', 'while', 'who', 'why', 'will', 'with', 'within', 'without',
  'would', 'you', 'your'
]);

function extractKeywords(cleanedText, max = 4) {
  const frequencies = new Map();
  const words = cleanedText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 4 && !STOP_WORDS.has(word));

  words.forEach((word) => {
    frequencies.set(word, (frequencies.get(word) || 0) + 1);
  });

  return Array.from(frequencies.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([word]) => word);
}

function splitSentences(cleanedText) {
  return (cleanedText.match(/[^.!?]+[.!?]+["'”]?/g) || [])
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 45);
}

function scoreSentence(sentence, keywords) {
  const normalized = sentence.toLowerCase();
  const keywordScore = keywords.reduce(
    (score, keyword) => score + (normalized.includes(keyword) ? 1 : 0),
    0
  );

  const argumentBonus = /(argues|explores|examines|shows|critiques|discusses|reflects)/.test(normalized) ? 1 : 0;
  const quotePenalty = normalized.startsWith('"') ? -0.3 : 0;

  return keywordScore + argumentBonus + quotePenalty;
}

function compressToLimit(text, limit = 170) {
  const normalized = text
    .replace(/["“”]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit - 3).trimEnd()}...`;
}

function generateDescription(markdownContent, frontmatter = {}) {
  const cleaned = stripMarkdown(markdownContent);
  if (!cleaned) return 'Short review coming soon.';

  const keywords = extractKeywords(cleaned);
  const sentences = splitSentences(cleaned);
  const bestSentence = sentences
    .map((sentence) => ({ sentence, score: scoreSentence(sentence, keywords) }))
    .sort((a, b) => b.score - a.score)[0]?.sentence;

  const title = String(frontmatter.title || '').replace(/^Book Review:\s*/i, '').trim();

  if (bestSentence && keywords.length >= 2) {
    const thematicLead = title
      ? `A review of ${title} that explores ${keywords.slice(0, 3).join(', ')}.`
      : `A review that explores ${keywords.slice(0, 3).join(', ')}.`;
    return compressToLimit(`${thematicLead} ${bestSentence}`);
  }

  if (bestSentence) {
    return compressToLimit(bestSentence);
  }

  return compressToLimit(cleaned, 120) || 'Short review coming soon.';
}

function normalizeFrontmatter(data) {
  const next = { ...data };

  if (next.date instanceof Date && !Number.isNaN(next.date.getTime())) {
    next.date = next.date.toISOString().slice(0, 10);
  }

  return next;
}

function getTargetFiles(inputs) {
  if (!inputs.length) {
    return collectMarkdownFiles(path.join(ROOT, 'posts', 'book-reviews'));
  }

  return inputs
    .flatMap((inputPath) => resolveInputToFiles(inputPath))
    .filter((filePath, index, arr) => arr.indexOf(filePath) === index);
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

    const description = generateDescription(parsed.content, parsed.data);
    const nextData = normalizeFrontmatter(parsed.data);
    nextData.description = description;

    const nextRaw = matter.stringify(parsed.content, nextData);
    fs.writeFileSync(filePath, nextRaw, 'utf8');

    console.log(`${path.relative(ROOT, filePath)} -> ${description}`);
  });
}

main();
