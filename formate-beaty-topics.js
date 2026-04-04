#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { html: beautifyHtml } = require('js-beautify');

const rootDir = process.argv[2] || process.cwd();

function walk(dir) {
  const result = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      result.push(...walk(fullPath));
    } else if (entry.isFile() && /\.(html?|php)$/i.test(entry.name)) {
      result.push(fullPath);
    }
  }

  return result;
}

function normalizePath(p) {
  return p.split(path.sep).join('/');
}

function isTopicFile(filePath) {
  const p = normalizePath(filePath);
  return p.includes('/topic/') || p.includes('/ru/topic/');
}

function formatBodyOnly(content) {
  const bodyOpenMatch = content.match(/<body\b[^>]*>/i);
  const bodyCloseMatch = content.match(/<\/body>/i);

  if (!bodyOpenMatch || !bodyCloseMatch) {
    return { changed: false, content };
  }

  const bodyStart = bodyOpenMatch.index + bodyOpenMatch[0].length;
  const bodyEnd = bodyCloseMatch.index;

  const before = content.slice(0, bodyStart);
  const bodyInner = content.slice(bodyStart, bodyEnd);
  const after = content.slice(bodyEnd);

  const formattedBody = '\n' + beautifyHtml(bodyInner, {
    indent_size: 2,
    indent_char: ' ',
    preserve_newlines: true,
    max_preserve_newlines: 2,
    end_with_newline: true,
    wrap_line_length: 0,
    extra_liners: [],
    unformatted: ['code', 'pre', 'em', 'strong', 'span', 'a', 'i', 'b'],
    content_unformatted: ['script', 'style'],
    indent_inner_html: true
  }).trimEnd() + '\n';

  const result = before + formattedBody + after;
  return { changed: result !== content, content: result };
}

function main() {
  const files = walk(rootDir).filter(isTopicFile);
  let changedCount = 0;

  for (const file of files) {
    const original = fs.readFileSync(file, 'utf8');
    const { changed, content } = formatBodyOnly(original);

    if (changed) {
      fs.writeFileSync(file, content, 'utf8');
      changedCount++;
      console.log(`Formatted: ${file}`);
    }
  }

  console.log(`Done. Changed files: ${changedCount}`);
}

main();