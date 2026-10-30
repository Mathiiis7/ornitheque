// Essai ponctuel (2026-10-30) : le N gris de l'aperçu au survol est-il centré dans son rond ? Se juge sur les PIXELS
// (voir CLAUDE.md : le calcul par les métriques disait tout centré quand les chiffres étaient 1,5 px trop haut).
// Écart mesuré en pixels d'écran : centre de l'encre moins centre du rond ; positif = trop bas / trop à droite.
// node outils/verif/_essai-n-survol.mjs [dossier des captures]
import { chromium } from 'playwright';
const SORTIE = process.argv[2] || '.';
const nav = await chromium.launch();
// Décode une capture dans une page vierge : pas de bibliothèque d'images dans le projet.
const vierge = await nav.newPage();
const decode = buf => vierge.evaluate(async b64 => {
  const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
  const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
  const g = c.getContext('2d'); g.drawImage(im, 0, 0);
  return { width:im.width, height:im.height, data:[...g.getImageData(0, 0, im.width, im.height).data] };
}, buf.toString('base64'));
let pire = 0;
for(const zoom of [1, 1.25, 1.5, 1.75, 2]){
  const ctx = await nav.newContext({ viewport:{ width:1300, height:900 }, deviceScaleFactor:zoom, locale:'fr-FR', serviceWorkers:'block' });
  const p = await ctx.newPage();
  await p.goto('http://localhost:8765/demo/', { waitUntil:'load' }); await p.waitForTimeout(1500);
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  if(process.env.CSS) await p.addStyleTag({ content:process.env.CSS });
  // Le vrai contexte : une ligne d'aperçu au survol, posée à plusieurs positions (l'arrondi dépend de la position).
  const res = [];
  for(const decale of [0, 0.3, 0.6]){
    const boite = await p.evaluate(decale => {
      document.getElementById('__t')?.remove();
      const t = document.createElement('div'); t.id = '__t'; t.className = 'leaflet-tooltip ct-sv';
      t.style.cssText = `position:fixed;left:40px;top:${40 + decale}px;z-index:99999;opacity:1`;
      t.innerHTML = '<span class="ct-sv-l"><span class="pkdx-exo">N</span><b>Oie à tête barrée</b></span>';
      document.body.appendChild(t);
      const r = t.querySelector('.pkdx-exo').getBoundingClientRect();
      return { x:r.x, y:r.y, width:r.width, height:r.height };
    }, decale);
    const marge = 3;
    const png = await decode(await p.screenshot({ clip:{ x:boite.x - marge, y:boite.y - marge, width:boite.width + 2 * marge, height:boite.height + 2 * marge } }));
    const px = (x, y) => { const i = (y * png.width + x) * 4; return [png.data[i], png.data[i + 1], png.data[i + 2]]; };
    const lum = c => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
    // Le rond : ce qui s'écarte nettement du fond de l'aperçu (coin de l'image). L'encre : le blanc dans le rond.
    const fond = lum(px(0, 0));
    let rx0 = 1e9, rx1 = -1, ry0 = 1e9, ry1 = -1;
    for(let y = 0; y < png.height; y++) for(let x = 0; x < png.width; x++) if(Math.abs(lum(px(x, y)) - fond) > 40){ rx0 = Math.min(rx0, x); rx1 = Math.max(rx1, x); ry0 = Math.min(ry0, y); ry1 = Math.max(ry1, y); }
    const cx = (rx0 + rx1) / 2, cy = (ry0 + ry1) / 2, R = (rx1 - rx0) / 2;
    const disque = lum(px(Math.round(rx0 + R * 0.25), Math.round(cy)));
    // Encre pondérée dans le disque intérieur, pour ne pas compter le bord antialiasé.
    let s = 0, sx = 0, sy = 0, ix0 = 1e9, ix1 = -1, iy0 = 1e9, iy1 = -1;
    for(let y = 0; y < png.height; y++) for(let x = 0; x < png.width; x++){
      if(Math.hypot(x - cx, y - cy) > R * 0.82) continue;
      const v = lum(px(x, y)) - disque;
      if(v > 45){ s += v; sx += v * x; sy += v * y; ix0 = Math.min(ix0, x); ix1 = Math.max(ix1, x); iy0 = Math.min(iy0, y); iy1 = Math.max(iy1, y); }
    }
    res.push({ decale, rond:`${rx1 - rx0 + 1}x${ry1 - ry0 + 1}`, dx:+(((ix0 + ix1) / 2 - cx) / zoom).toFixed(2), dy:+(((iy0 + iy1) / 2 - cy) / zoom).toFixed(2), centreEncre:[+(sx / s - cx).toFixed(2), +(sy / s - cy).toFixed(2)] });
    pire = Math.max(pire, Math.abs(res.at(-1).dy), Math.abs(res.at(-1).dx));
    if(decale === 0) await p.screenshot({ path:`${SORTIE}/n-survol-${zoom * 100}.png`, clip:{ x:boite.x - 6, y:boite.y - 6, width:150, height:boite.height + 12 } });
  }
  console.log(`zoom ${zoom * 100} % :`, JSON.stringify(res));
  await ctx.close();
}
console.log('pire écart (px CSS d\'écran) :', pire);
console.log(pire > 0.5 ? 'DÉFAUT' : 'CONFORME');
await nav.close();
