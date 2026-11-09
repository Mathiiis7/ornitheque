// Image d'attente d'un trophee dont l'image n'existe pas encore : un « ? » couleur papier, fond transparent
// (Ecologue 200, Mathis 10/11 : son t-shirt n'est pas encore decide entre amis).
//   node outils/build/_point-interrogation.mjs
// Police du site (Source Serif 4 gras), ton creme des plaques, une ombre portee legere comme le papier decoupe.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
const police = readFileSync('assets/fonts/SourceSerif4-Bold.woff2').toString('base64');
const SORTIE = 'assets/trophies/themes/attente/point-interrogation.png';
const nav = await chromium.launch();
const page = await nav.newPage({ viewport: { width: 600, height: 800 } });
await page.setContent(`<!doctype html><style>@font-face{font-family:S;src:url(data:font/woff2;base64,${police})}
  html,body{margin:0;background:transparent}</style><canvas id="c" width="600" height="800"></canvas>`);
await page.evaluate(() => document.fonts.ready);
const b64 = await page.evaluate(async () => {
  await document.fonts.load('700 600px S');
  const c = document.getElementById('c'), x = c.getContext('2d');
  x.font = '700 640px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'alphabetic';   // le « ? » de Source Serif avait une forme etrange (essai du 10/11)
  x.shadowColor = 'rgba(40,25,10,.55)'; x.shadowOffsetX = 6; x.shadowOffsetY = 8; x.shadowBlur = 6;
  const g = x.createLinearGradient(0, 120, 0, 720); g.addColorStop(0, '#eee2bf'); g.addColorStop(1, '#c9b27f');
  x.fillStyle = g; x.fillText('?', 300, 700);
  return c.toDataURL('image/png').split(',')[1];
});
mkdirSync('assets/trophies/themes/attente', { recursive: true });
writeFileSync(SORTIE, Buffer.from(b64, 'base64'));
console.log('ecrit', SORTIE);
await nav.close();
