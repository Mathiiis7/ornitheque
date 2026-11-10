// Essai (2026-11-10) : le drapeau de chaque pays du site, tel que flagcdn le sert pour son code eBird.
// Liste les codes sans image (404) et fabrique une planche (nom + drapeau) pour juger à l'œil les mauvais.
// Usage : node outils/verif/_drapeaux.mjs   -> planche dans %TEMP%/essai-monde/drapeaux.png
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';
const app = readFileSync(new URL('../../app.js', import.meta.url), 'utf8');
const monde = JSON.parse(app.match(/^const PAYS_MONDE = (\{.*\});/m)[1]);
const pays = {};
for (const m of app.matchAll(/name: ["']([^"']+)["'], flagCode: '([A-Z]{2})'/g)) pays[m[2]] = m[1];
for (const [cc, v] of Object.entries(monde)) pays[cc] = v[0];
const codes = Object.keys(pays).sort((a, b) => pays[a].localeCompare(pays[b], 'fr'));
const absents = [];
// Un par un : 240 requêtes à la fois font couper la connexion (ECONNRESET).
for (const cc of codes) {
  let r = null;
  for (let essai = 0; essai < 3 && !r; essai++) r = await fetch(`https://flagcdn.com/w40/${cc.toLowerCase()}.png`, { method: 'HEAD' }).catch(() => null);
  if (!r || !r.ok) absents.push(`${cc} ${pays[cc]} (${r ? r.status : 'pas de reponse'})`);
}
console.log(codes.length, 'pays ;', absents.length, 'sans drapeau chez flagcdn :');
for (const a of absents.sort()) console.log('  ' + a);
const dossier = join(tmpdir(), 'essai-monde'); mkdirSync(dossier, { recursive: true });
const html = '<meta charset="utf-8"><style>body{font:13px Segoe UI;margin:8px;display:grid;grid-template-columns:repeat(6,1fr);gap:4px 10px}div{display:flex;gap:6px;align-items:center}img{width:32px;height:22px;object-fit:contain;background:#eee}</style>'
  + codes.map(cc => `<div><img src="https://flagcdn.com/w40/${cc.toLowerCase()}.png"><b>${cc}</b> ${pays[cc]}</div>`).join('');
const f = join(dossier, 'drapeaux.html'); writeFileSync(f, html);
const nav = await chromium.launch({ channel: 'chrome' });
const page = await nav.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto('file:///' + f.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
await page.screenshot({ path: join(dossier, 'drapeaux.png'), fullPage: true });
await nav.close();
console.log('planche', join(dossier, 'drapeaux.png'));
