// Monte les trois numeros de version avant un commit qui touche app.js, styles.css ou index.html
// (CLAUDE.md, « Deployer »). Usage : node outils/build/_monter-version.mjs <num ?v=> <CACHE_VERSION>
import fs from 'node:fs';
const [num, cache] = process.argv.slice(2);
if(!/^\d+$/.test(num || '') || !cache){ console.error('usage : <num> <cache>'); process.exit(1); }
let html = fs.readFileSync('index.html', 'utf8');
let n = 0;
html = html.replace(/(app\.js|styles\.css)\?v=\d+/g, (m, f) => { n++; return f + '?v=' + num; });
if(n !== 4){ console.error('attendu 4 occurrences, trouve ' + n); process.exit(1); }
fs.writeFileSync('index.html', html);
let sw = fs.readFileSync('service-worker.js', 'utf8');
const avant = sw;
sw = sw.replace(/const CACHE_VERSION = '[^']*'/, "const CACHE_VERSION = '" + cache + "'");
if(sw === avant){ console.error('CACHE_VERSION introuvable'); process.exit(1); }
fs.writeFileSync('service-worker.js', sw);
console.log('index.html : 4 remplacements ->', num, '; CACHE_VERSION ->', cache);
