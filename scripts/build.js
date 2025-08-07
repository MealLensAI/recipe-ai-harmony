import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to copy directory recursively
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy landing page and assets to dist folder
console.log('Copying landing page and assets to dist folder...');

// Copy landing page
if (fs.existsSync('public/landing.html')) {
  fs.copyFileSync('public/landing.html', 'dist/landing.html');
  console.log('✓ Copied landing.html');
}

// Copy assets folder
if (fs.existsSync('public/assets')) {
  copyDir('public/assets', 'dist/assets');
  console.log('✓ Copied assets folder');
}

console.log('Build script completed!'); 