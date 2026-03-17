const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const ROOT = path.join(__dirname, '..');
const manifestPath = path.join(ROOT, 'extension', 'manifest.json');
const extensionDir = path.join(ROOT, 'extension');
const distDir = path.join(ROOT, 'dist');
const zipPath = path.join(distDir, 'TaskDown-offline.zip');

// --- Bump patch version in manifest.json ---
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const [major, minor, patch] = manifest.version.split('.').map(Number);
manifest.version = `${major}.${minor}.${patch + 1}`;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`manifest.json version → ${manifest.version}`);

// --- Create zip of extension/ ---
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

const output = fs.createWriteStream(zipPath);
const archive = archiver('zip', { zlib: { level: 9 } });

archive.on('error', (err) => { throw err; });

output.on('close', () => {
  console.log(`Extension zipped → dist/TaskDown-offline.zip (${archive.pointer()} bytes)`);
});

archive.pipe(output);
archive.directory(extensionDir, false);
archive.finalize();
