// Post-processes the GitHub Pages export in ../docs:
// - .nojekyll so Pages serves the _expo/ directory
// - 404.html fallback so client-side routes resolve
// - iOS home-screen meta tags for a full-screen feel
const fs = require('fs');
const path = require('path');

const docs = path.join(__dirname, '..', '..', 'docs');
fs.writeFileSync(path.join(docs, '.nojekyll'), '');

const indexPath = path.join(docs, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
if (!html.includes('apple-mobile-web-app-capable')) {
  html = html.replace(
    '</title>',
    `</title>
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="ART EYE" />
    <meta name="theme-color" content="#FFFFFF" />`
  );
  fs.writeFileSync(indexPath, html);
}
fs.copyFileSync(indexPath, path.join(docs, '404.html'));
console.log('docs/ ready for GitHub Pages');
