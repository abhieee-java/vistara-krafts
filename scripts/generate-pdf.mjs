import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const mdPath = path.join(rootDir, 'docs', 'VISTARA-KRAFTS-PROJECT-HANDOVER.md');
const htmlPath = path.join(rootDir, 'docs', 'VISTARA-KRAFTS-PROJECT-HANDOVER.html');
const pdfPath = path.join(rootDir, 'docs', 'VISTARA-KRAFTS-PROJECT-HANDOVER.pdf');
const brainPdfPath = 'C:\\Users\\Dell\\.gemini\\antigravity\\brain\\cf3cbd5b-571f-4053-9cb4-8de76deafdeb\\VISTARA-KRAFTS-PROJECT-HANDOVER.pdf';

const mdContent = fs.readFileSync(mdPath, 'utf-8');

// Basic Markdown parser for headings, lists, tables, code blocks, bold, italic, blockquotes
function parseMarkdownToHtml(md) {
  const lines = md.split('\n');
  let html = '';
  let inCodeBlock = false;
  let codeLang = '';
  let codeBuffer = [];
  let inTable = false;
  let tableHeaderParsed = false;
  let tableBuffer = [];
  let inList = false;

  const flushTable = () => {
    if (!inTable || tableBuffer.length === 0) return;
    let tHtml = '<div class="table-wrapper"><table>\n';
    tableBuffer.forEach((row, idx) => {
      if (idx === 0) {
        tHtml += '<thead><tr>' + row.map(c => `<th>${c}</th>`).join('') + '</tr></thead>\n<tbody>\n';
      } else {
        tHtml += '<tr>' + row.map(c => `<td>${c}</td>`).join('') + '</tr>\n';
      }
    });
    tHtml += '</tbody></table></div>\n';
    html += tHtml;
    tableBuffer = [];
    inTable = false;
    tableHeaderParsed = false;
  };

  const flushList = () => {
    if (inList) {
      html += '</ul>\n';
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Code blocks
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        flushTable();
        flushList();
        inCodeBlock = true;
        codeLang = line.trim().slice(3);
        codeBuffer = [];
      } else {
        inCodeBlock = false;
        const codeText = codeBuffer.join('\n')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        html += `<pre class="code-block language-${codeLang}"><code>${codeText}</code></pre>\n`;
        codeBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Tables
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      flushList();
      const cells = line.trim().split('|').slice(1, -1).map(c => c.trim());
      // Check if separator line
      if (cells.every(c => /^:?-+:?$/.test(c))) {
        tableHeaderParsed = true;
        continue;
      }
      if (!inTable) {
        inTable = true;
      }
      // Process inline bold / code within table cells
      const formattedCells = cells.map(c => formatInline(c));
      tableBuffer.push(formattedCells);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Headings
    if (line.startsWith('# ')) {
      flushList();
      const title = line.replace('# ', '').trim();
      html += `<h1 class="doc-title">${formatInline(title)}</h1>\n`;
      continue;
    }
    if (line.startsWith('## ')) {
      flushList();
      const title = line.replace('## ', '').trim();
      html += `<h2 class="section-title">${formatInline(title)}</h2>\n`;
      continue;
    }
    if (line.startsWith('### ')) {
      flushList();
      const title = line.replace('### ', '').trim();
      html += `<h3 class="subsection-title">${formatInline(title)}</h3>\n`;
      continue;
    }
    if (line.startsWith('#### ')) {
      flushList();
      const title = line.replace('#### ', '').trim();
      html += `<h4 class="sub-subsection-title">${formatInline(title)}</h4>\n`;
      continue;
    }

    // Horizontal Rule
    if (line.trim() === '---') {
      flushList();
      html += '<hr class="section-divider" />\n';
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      flushList();
      const quoteText = line.replace('> ', '').trim();
      html += `<blockquote class="doc-quote">${formatInline(quoteText)}</blockquote>\n`;
      continue;
    }

    // Unordered lists
    if (/^\s*[-*]\s+/.test(line)) {
      if (!inList) {
        html += '<ul>\n';
        inList = true;
      }
      const itemText = line.replace(/^\s*[-*]\s+/, '').trim();
      html += `<li>${formatInline(itemText)}</li>\n`;
      continue;
    } else if (inList && !/^\s*\d+\.\s+/.test(line) && line.trim() === '') {
      flushList();
    }

    // Numbered lists
    if (/^\s*\d+\.\s+/.test(line)) {
      flushList();
      const itemText = line.replace(/^\s*\d+\.\s+/, '').trim();
      html += `<div class="ordered-step"><span class="step-num">${line.match(/^\s*(\d+)\./)[1]}</span><span class="step-content">${formatInline(itemText)}</span></div>\n`;
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      flushList();
      continue;
    }

    // Normal paragraph
    flushList();
    html += `<p>${formatInline(line.trim())}</p>\n`;
  }

  flushTable();
  flushList();
  return html;
}

function formatInline(str) {
  return str
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
}

const bodyHtml = parseMarkdownToHtml(mdContent);

const completeHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Vistāra Krafts — Complete Project Handover Dossier</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 16mm 18mm 16mm;
      @bottom-right {
        content: counter(page);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 8pt;
        color: #888;
      }
    }

    *, *::before, *::after {
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.55;
      color: #1c1b18;
      background: #ffffff;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }

    /* Cover / Header Hero */
    .cover-banner {
      background: linear-gradient(135deg, #0d1726 0%, #152238 60%, #1f2d47 100%);
      color: #FAF9F5;
      padding: 32px 36px;
      border-radius: 12px;
      margin-bottom: 28px;
      border: 1px solid rgba(205, 168, 81, 0.4);
      box-shadow: 0 4px 20px rgba(13, 23, 38, 0.12);
    }
    .cover-crest {
      font-size: 11pt;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #cda851;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .cover-title {
      font-size: 22pt;
      font-weight: 700;
      letter-spacing: -0.02em;
      line-height: 1.15;
      margin: 0 0 10px 0;
      color: #ffffff;
    }
    .cover-sub {
      font-size: 11pt;
      color: rgba(250, 249, 245, 0.85);
      margin: 0 0 18px 0;
      max-width: 90%;
    }
    .cover-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .cover-badge {
      background: rgba(205, 168, 81, 0.15);
      border: 1px solid rgba(205, 168, 81, 0.5);
      color: #e5c368;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 8.5pt;
      font-weight: 500;
    }

    h1.doc-title {
      display: none; /* Already rendered in cover-banner */
    }

    h2.section-title {
      font-size: 13pt;
      font-weight: 700;
      color: #0d1726;
      border-bottom: 2px solid #e6e2d8;
      padding-bottom: 6px;
      margin-top: 32px;
      margin-bottom: 12px;
      letter-spacing: -0.01em;
      page-break-after: avoid;
    }

    h3.subsection-title {
      font-size: 11pt;
      font-weight: 600;
      color: #1c2b42;
      margin-top: 20px;
      margin-bottom: 8px;
      page-break-after: avoid;
    }

    h4.sub-subsection-title {
      font-size: 10pt;
      font-weight: 600;
      color: #3b4b61;
      margin-top: 14px;
      margin-bottom: 6px;
      page-break-after: avoid;
    }

    p {
      margin: 0 0 10px 0;
      color: #2b2a27;
      text-align: justify;
    }

    blockquote.doc-quote {
      margin: 12px 0;
      padding: 10px 16px;
      background: #fbf9f4;
      border-left: 3px solid #cda851;
      border-radius: 0 6px 6px 0;
      color: #4a4843;
      font-size: 9.5pt;
    }

    hr.section-divider {
      border: 0;
      height: 1px;
      background: #e6e2d8;
      margin: 24px 0;
    }

    /* Lists */
    ul {
      margin: 6px 0 12px 18px;
      padding: 0;
    }
    li {
      margin-bottom: 4px;
      color: #2b2a27;
    }

    .ordered-step {
      display: flex;
      gap: 8px;
      margin-bottom: 6px;
    }
    .step-num {
      flex-shrink: 0;
      width: 18px;
      height: 18px;
      background: #0d1726;
      color: #ffffff;
      font-size: 7.5pt;
      font-weight: 700;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-top: 2px;
    }
    .step-content {
      flex: 1;
      color: #2b2a27;
    }

    /* Tables */
    .table-wrapper {
      margin: 14px 0 18px 0;
      overflow-x: auto;
      page-break-inside: avoid;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      border: 1px solid #d9d4c7;
      border-radius: 6px;
    }
    th {
      background: #f4efe4;
      color: #0d1726;
      font-weight: 600;
      text-align: left;
      padding: 7px 10px;
      border: 1px solid #d9d4c7;
    }
    td {
      padding: 6px 10px;
      border: 1px solid #e2ddd0;
      color: #2c2b28;
      vertical-align: top;
    }
    tr:nth-child(even) td {
      background: #faf8f3;
    }

    /* Code Blocks */
    pre.code-block {
      background: #0d1726;
      color: #f0ede6;
      padding: 12px 14px;
      border-radius: 6px;
      font-family: "JetBrains Mono", Consolas, "Courier New", monospace;
      font-size: 8pt;
      line-height: 1.45;
      overflow-x: auto;
      margin: 12px 0 16px 0;
      border: 1px solid #202e45;
      page-break-inside: avoid;
    }
    code.inline-code {
      font-family: Consolas, "Courier New", monospace;
      font-size: 8.5pt;
      background: #f1ede4;
      color: #8c2525;
      padding: 1px 5px;
      border-radius: 4px;
      border: 1px solid #e2ddd2;
    }

    a {
      color: #154580;
      text-decoration: underline;
    }

    /* Print specifics */
    @media print {
      body {
        font-size: 9pt;
      }
      .page-break {
        page-break-before: always;
      }
      .cover-banner {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>

  <div class="cover-banner">
    <div class="cover-crest">VISTĀRA KRAFTS · ATELIER ECOSYSTEM</div>
    <div class="cover-title">Full Project Handover & System Playbook</div>
    <div class="cover-sub">Comprehensive technical dossier, architecture contracts, database security definers, payment tamper resistance, operational runbooks, and test verification report.</div>
    <div class="cover-badges">
      <span class="cover-badge">Version 2.0.0 (Production)</span>
      <span class="cover-badge">Built by Abhijit</span>
      <span class="cover-badge">Official Storefront: vistarakrafts.com</span>
      <span class="cover-badge">Verification: 27/27 Suites Green</span>
    </div>
  </div>

  ${bodyHtml}

</body>
</html>`;

fs.writeFileSync(htmlPath, completeHtml, 'utf-8');
console.log('Generated styled HTML at:', htmlPath);

// Execute Chrome headless to generate PDF
const chromeExe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
console.log('Rendering PDF with headless Chrome...');

const result = spawnSync(chromeExe, [
  '--headless=new',
  '--disable-gpu',
  '--no-pdf-header-footer',
  `--print-to-pdf=${pdfPath}`,
  htmlPath
], { stdio: 'inherit' });

if (result.status === 0) {
  console.log('PDF generated successfully at:', pdfPath);
  // Copy to brain artifact directory as well
  fs.copyFileSync(pdfPath, brainPdfPath);
  console.log('PDF copied to brain artifact directory at:', brainPdfPath);
} else {
  console.error('Chrome execution failed with code:', result.status);
  process.exit(1);
}
