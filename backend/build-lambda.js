const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

// Clean dist folder
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}
fs.mkdirSync('dist', { recursive: true });
fs.mkdirSync('dist/handlers', { recursive: true });

// Bundle createNote handler
esbuild.buildSync({
  entryPoints: ['src/handlers/createNote.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: 'dist/handlers/createNote.js',
  external: ['@aws-sdk/*'], // AWS SDK is available in Lambda runtime
  sourcemap: false,
  minify: true,
});

// Bundle getNotes handler
esbuild.buildSync({
  entryPoints: ['src/handlers/getNotes.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: 'dist/handlers/getNotes.js',
  external: ['@aws-sdk/*'], // AWS SDK is available in Lambda runtime
  sourcemap: false,
  minify: true,
});

// Bundle updateNote handler
esbuild.buildSync({
  entryPoints: ['src/handlers/updateNote.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: 'dist/handlers/updateNote.js',
  external: ['@aws-sdk/*'], // AWS SDK is available in Lambda runtime
  sourcemap: false,
  minify: true,
});

console.log('Lambda functions bundled successfully!');
