const { collect } = require('./seo-content-template');

(async function main() {
  const keywords = (process.argv[2] || '').split(',').map(k => k.trim().split('+').join(' '));
  await collect(keywords);
}());
