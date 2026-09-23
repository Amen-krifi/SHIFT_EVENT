import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'shift-website');
const destDir = path.join(__dirname, 'public');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (path.basename(src) === 'supabase') return; // skip supabase folder
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const files = fs.readdirSync(src);
    for (const file of files) {
      copyRecursive(path.join(src, file), path.join(dest, file));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

copyRecursive(srcDir, destDir);

// Also copy into public/shift-website for backwards compatibility with any /shift-website/* paths
const shiftSubdir = path.join(destDir, 'shift-website');
if (!fs.existsSync(shiftSubdir)) {
  fs.mkdirSync(shiftSubdir, { recursive: true });
}
copyRecursive(srcDir, shiftSubdir);

console.log('Build completed: Static assets synchronized to "public" directory.');
