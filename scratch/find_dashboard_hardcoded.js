const fs = require('fs');
const path = require('path');

// More precise hardcoded string finder
const dashDir = 'src/components/dashboard';
const files = fs.readdirSync(dashDir).filter(f => f.endsWith('.tsx'));

files.forEach(f => {
  const content = fs.readFileSync(path.join(dashDir, f), 'utf8');
  const lines = content.split('\n');
  const hits = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    // Skip clearly non-UI lines
    if (
      trimmed.startsWith('//') ||
      trimmed.startsWith('*') ||
      trimmed.startsWith('import') ||
      trimmed.startsWith('const ') ||
      trimmed.startsWith('let ') ||
      trimmed.startsWith('type ') ||
      trimmed.startsWith('interface ') ||
      trimmed.startsWith('export') ||
      trimmed.includes('=>') ||
      trimmed.includes('console.') ||
      trimmed.includes('className=') ||
      trimmed.includes('supabase') ||
      trimmed.includes('router.') ||
      trimmed.includes('localStorage') ||
      trimmed.includes('t(') ||
      trimmed.includes('{t(')
    ) return;

    // Look for JSX text: >English text< (between JSX tags)
    const matches = line.matchAll(/>\s*([A-Z][a-zA-Z\s]{5,}[a-z])\s*</g);
    for (const m of matches) {
      const text = m[1].trim();
      if (!text.includes('{') && !text.includes('(') && text.length > 5) {
        hits.push({ line: i + 1, text });
      }
    }
  });

  if (hits.length > 0) {
    console.log(`\n=== ${f} (${hits.length} hardcoded strings) ===`);
    hits.forEach(h => console.log(`  Line ${h.line}: "${h.text}"`));
  }
});
