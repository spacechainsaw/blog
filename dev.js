'use strict';

const { execSync } = require('child_process');
const chokidar    = require('chokidar');
const browserSync = require('browser-sync').create();

function build() {
  try {
    execSync('node build.js', { stdio: 'inherit' });
  } catch (e) {
    // build errors are already printed by stdio:'inherit'
  }
}

// Initial build before starting the server
build();

// Serve docs/ with live reload
browserSync.init({
  server: 'docs',
  notify: false,
  open:   true,
  ui:     false,
});

// Watch all source files and content
chokidar
  .watch(['src', 'posts', 'content'], {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 80 },
  })
  .on('all', (event, filePath) => {
    console.log(`\n[watch] ${event}: ${filePath}`);
    build();
    browserSync.reload();
  });

console.log('\n[dev] Watching src/, posts/, content/ for changes…\n');
