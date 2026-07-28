const fs = require('fs');
const path = require('path');

// Search for hardcoded English UI strings in TSX/TS files
// Common patterns: JSX text content that looks like English UI copy
function findHardcoded(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.next', '.git', 'out'].includes(entry.name)) {
        findHardcoded(fullPath, results);
      }
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      const lines = fs.readFileSync(fullPath, 'utf8').split('\n');
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        // Skip: comments, imports, t() calls, className, href, console, type definitions
        if (
          trimmed.startsWith('//') ||
          trimmed.startsWith('*') ||
          trimmed.startsWith('import') ||
          trimmed.includes('useTranslations') ||
          trimmed.includes('console.') ||
          trimmed.includes('className=') ||
          trimmed.includes('href=') ||
          trimmed.includes('src=') ||
          trimmed.includes('alt=') ||
          trimmed.includes('type=') ||
          trimmed.includes('placeholder=') ||
          trimmed.includes('aria-') ||
          trimmed.includes('=>') ||
          trimmed.includes('interface ') ||
          trimmed.startsWith('const ') ||
          trimmed.startsWith('let ') ||
          trimmed.includes('supabase') ||
          trimmed.includes('toast.') ||
          trimmed.includes('router.') ||
          trimmed.includes('localStorage') ||
          trimmed.includes('sessionStorage') ||
          trimmed.includes('channel') ||
          trimmed.startsWith('"') && trimmed.endsWith('",') // JSON-like
        ) return;

        // Look for JSX text: >{English Text}< or >{English Text}
        const jsxTextMatch = trimmed.match(/^>\s*([A-Z][a-zA-Z\s!?,.'&()\-:]{6,})\s*(<|$)/);
        if (jsxTextMatch) {
          const text = jsxTextMatch[1].trim();
          // Skip if it's wrapped in t() or contains template literals
          if (!line.includes('t(') && !line.includes('{t(') && !line.includes('${')) {
            results.push({ file: fullPath.replace(process.cwd() + path.sep, ''), line: idx + 1, text });
          }
        }
      });
    }
  }
  return results;
}

const results = findHardcoded(path.join(process.cwd(), 'src'));
console.log(`Found ${results.length} potential hardcoded UI strings:\n`);
results.slice(0, 60).forEach(r => {
  console.log(`  [${r.file}:${r.line}] "${r.text}"`);
});
