// Essai ponctuel (2026-11-17), démo locale : filme image par image ce que montre le Birdydex juste après
// un clic sur un palier (Mathis voit « des lignes entre deux cases »). Enregistre les images dans DOS.
// node outils/verif/_essai-filtre-images.mjs [largeur]
import { chromium } from 'playwright';
import fs from 'fs';
const largeur = +(process.argv[2] || 1300), mobile = largeur < 700;
const DOS = process.env.DOS || 'C:/Users/mathi/AppData/Local/Temp/claude/7b8b53a5505b044a/baff42b5-821a-4c89-9b7c-f62cada247e4/scratchpad/images';
fs.mkdirSync(DOS, { recursive:true });
for(const f of fs.readdirSync(DOS)) fs.unlinkSync(DOS + '/' + f);
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:largeur, height:mobile ? 812 : +(process.env.HAUT || 950) }, isMobile:mobile, hasTouch:mobile, locale:'fr-FR' });
const p = await ctx.newPage();
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
await p.waitForTimeout(1500);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="pokedex"]').click());
await p.waitForTimeout(2500);
await p.keyboard.press('Escape');
// CASE : la case observée amenée au centre avant le clic (12 = haut de la grille, 190 = loin dessous).
await p.evaluate(k => { const c = document.querySelectorAll('#pkdxGrid .pkdx-card:not(.missing)')[k]; c.scrollIntoView({ block:'center' }); }, +(process.env.CASE || 12));
await p.waitForTimeout(4000);
const cdp = await ctx.newCDPSession(p);
let n = 0; const t0 = Date.now();
cdp.on('Page.screencastFrame', async f => {
  fs.writeFileSync(`${DOS}/f${String(n++).padStart(3, '0')}-${Date.now() - t0}ms.jpg`, Buffer.from(f.data, 'base64'));
  await cdp.send('Page.screencastFrameAck', { sessionId:f.sessionId }).catch(() => {});
});
await cdp.send('Page.startScreencast', { format:'jpeg', quality:80, everyNthFrame:1 });
await p.waitForTimeout(400);
console.log('clic à', Date.now() - t0, 'ms');
const palier = process.argv[3] || '4';
await p.evaluate(t => document.querySelector('#pkdxFiltres .rar-chip[data-tier="' + t + '"]').click(), palier);
await p.waitForTimeout(1200);
await cdp.send('Page.stopScreencast');
await p.waitForTimeout(300);
console.log(n, 'images dans', DOS);
// Comparaison image a image dans une page vierge : la zone qui change entre deux images successives.
const fichiers = fs.readdirSync(DOS).filter(f => f.endsWith('.jpg')).sort();
const q = await ctx.newPage();
const donnees = fichiers.map(f => 'data:image/jpeg;base64,' + fs.readFileSync(DOS + '/' + f).toString('base64'));
const res = await q.evaluate(async srcs => {
  const lire = s => new Promise(r => { const i = new Image(); i.onload = () => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); r(x.getImageData(0, 0, i.width, i.height)); }; i.src = s; });
  const out = []; let prec = await lire(srcs[0]);
  for(let k = 1; k < srcs.length; k++){
    const d = await lire(srcs[k]); let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for(let y = 0; y < d.height; y++) for(let x = 0; x < d.width; x++){
      const i = (y * d.width + x) * 4;
      if(Math.abs(d.data[i] - prec.data[i]) + Math.abs(d.data[i+1] - prec.data[i+1]) + Math.abs(d.data[i+2] - prec.data[i+2]) > 60){ n++; if(x < x0) x0 = x; if(y < y0) y0 = y; if(x > x1) x1 = x; if(y > y1) y1 = y; }
    }
    if(n) out.push(k + ': ' + n + ' px, zone ' + x0 + ',' + y0 + ' -> ' + x1 + ',' + y1);
    prec = d;
  }
  return out;
}, donnees);
console.log(fichiers.map((f, k) => k + '=' + f).filter((_, k) => res.some(r => r.startsWith(k + ':') || r.startsWith((k + 1) + ':'))).join(' '));
console.log(res.join('\n'));
await nav.close();
