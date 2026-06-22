import { readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgDir = join(__dirname, '..', 'public', 'icons', 'svg');
const outFile = join(__dirname, '..', 'public', 'icons', 'icons-manifest.json');

const files = readdirSync(svgDir).filter((f) => f.endsWith('.svg'));

const manifest = files.map((file) => {
  const name = file.replace(/\.svg$/, '');
  const tags = [...new Set(name.split('-').filter(Boolean))];
  return {
    id: name,
    name,
    tags,
    category: '',
    url: `icons/svg/${file}`
  };
});

manifest.sort((a, b) => a.name.localeCompare(b.name));

writeFileSync(outFile, JSON.stringify(manifest));
console.log(`Wrote ${manifest.length} icons to ${outFile}`);
