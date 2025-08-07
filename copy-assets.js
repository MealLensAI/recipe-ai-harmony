const fs = require('fs');
const path = require('path');

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

// Copy assets if they don't exist
const assetsDir = path.join(__dirname, 'assets');
const publicAssetsDir = path.join(__dirname, 'public', 'assets');

if (fs.existsSync(assetsDir) && !fs.existsSync(publicAssetsDir)) {
    console.log('Copying assets to public directory...');
    copyDir(assetsDir, publicAssetsDir);
    console.log('Assets copied successfully!');
} else {
    console.log('Assets already exist in public directory or source not found.');
} 