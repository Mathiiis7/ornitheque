// Essai du generateur de medailles (2026-11-08) : lui donne une image, verifie qu'il rend trois
// metaux sans erreur, et photographie le resultat.
// Usage : node outils/verif/_essai-medailles.mjs <image.png> <capture.png> [--sombre]
import { chromium } from 'playwright';
const [image, capture] = process.argv.slice(2);
const nav = await chromium.launch();
const page = await nav.newPage({ viewport: { width: 1250, height: 900 } });
const erreurs = []; page.on('pageerror', e => erreurs.push(String(e)));
await page.goto('http://localhost:8765/outils/generateur-medailles.html', { waitUntil: 'networkidle' });
await page.setInputFiles('#file', image);
await page.waitForFunction(() => document.querySelectorAll('#tiles canvas').length === 3, null, { timeout: 15000 });
if(process.argv.includes('--sombre')) await page.check('#sombre');
await page.waitForTimeout(500);
// Le rendu est-il vraiment metallise ? Teinte moyenne des pixels opaques de chaque case.
const teintes = await page.evaluate(() => [...document.querySelectorAll('#tiles canvas')].map(c => {
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let r = 0, g = 0, b = 0, n = 0;
  for(let i = 0; i < d.length; i += 16) if(d[i+3] > 200){ r += d[i]; g += d[i+1]; b += d[i+2]; n++; }
  return n ? [r/n|0, g/n|0, b/n|0] : null;
}));
console.log('erreurs :', erreurs.length, erreurs.join(' | '));
console.log('couleur moyenne or / argent / bronze :', JSON.stringify(teintes));
await page.locator('.card').screenshot({ path: capture });
await nav.close();
