// Réglage de la hauteur de l'initiale dessinée (app.js, _ctLettreDessinee) : pour chaque point seul de
// la ligue, sur la vraie carte de la démo, on essaie plusieurs lignes de base (attribut y du texte SVG)
// et on mesure l'écart entre le centre du disque et le centre de l'encre blanche, en pixels d'appareil,
// à 100, 125 et 150 %. Même mesure que lettres-carte.mjs.
// node outils/verif/_lettres-balayage.mjs [lieux] [y1,y2,...]
import { chromium } from 'playwright';
const nbLieux = +(process.argv[2] || 25);
const ys = (process.argv[3] || '13.2,13.6,14,14.4').split(',').map(Number);
const nav = await chromium.launch();
for(const dpr of [1, 1.25, 1.5]){
  const ctx = await nav.newContext({ viewport:{ width:1300, height:850 }, deviceScaleFactor:dpr, locale:'fr-FR' });
  await ctx.addInitScript(() => {
    const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); };
    att();
  });
  const p = await ctx.newPage();
  await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
  await p.waitForTimeout(1500);
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click());
  await p.waitForTimeout(2000);
  await p.keyboard.press('Escape');
  await p.evaluate(() => document.querySelector('[data-couche="ligue"]').click());
  await p.waitForTimeout(1500);
  const lieux = await p.evaluate(() => {
    const out = []; const m = window.__carte; if(!m) return out;
    m.eachLayer(l => { if(l.getAllChildMarkers) l.getAllChildMarkers().forEach(x => { if(x._ligue) out.push(x.getLatLng()); }); });
    const vus = new Set(); return out.filter(ll => { const k = ll.lat.toFixed(2) + ',' + ll.lng.toFixed(2); if(vus.has(k)) return false; vus.add(k); return true; });
  });
  const res = {}, dejaMesure = new Set();
  for(const ll of lieux.slice(0, nbLieux)){
    await p.evaluate(ll => window.__carte.setView([ll.lat, ll.lng], 15, { animate:false }), ll);
    await p.waitForTimeout(700);
    const vus = [];
    for(const y of ys){
      await p.evaluate(y => document.querySelectorAll('.ct-pt-dessin text').forEach(t => t.setAttribute('y', y)), y);
      await p.waitForTimeout(80);
      const png = await p.screenshot();
      const r = await p.evaluate(async b64 => {
        const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
        const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
        const g = cv.getContext('2d', { willReadFrequently:true }); g.drawImage(img, 0, 0);
        const dpr = devicePixelRatio, out = [];
        const marq = []; window.__carte.eachLayer(l => { if(l._ligue && l._icon) marq.push(l); });
        for(const mk of marq){
          const el = mk._icon.querySelector('.ct-pt-lettre'); if(!el || mk._icon.querySelector('.ct-pt-nb')) continue;
          const b = el.getBoundingClientRect();
          if(b.top < 4 || b.left < 4 || b.bottom > innerHeight - 4 || b.right > innerWidth - 4) continue;
          const fond = getComputedStyle(el).backgroundColor.match(/\d+/g).map(Number);
          const x0 = Math.floor(b.left * dpr), y0 = Math.floor(b.top * dpr), W = Math.ceil(b.width * dpr), H = Math.ceil(b.height * dpr);
          const d = g.getImageData(x0, y0, W, H).data;
          let sw = 0, cx = 0, cy = 0;
          for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
            const o = (y * W + x) * 4;
            const e = Math.abs(d[o] - fond[0]) + Math.abs(d[o + 1] - fond[1]) + Math.abs(d[o + 2] - fond[2]);
            if(e < 40){ sw++; cx += x; cy += y; }
          }
          if(sw < 20) continue;
          cx /= sw; cy /= sw;
          const r = 7 * 0.85 * dpr;
          let ix0 = 1e9, ix1 = -1, iy0 = 1e9, iy1 = -1;
          for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
            if(Math.hypot(x - cx, y - cy) > r) continue;
            const o = (y * W + x) * 4;
            if(d[o] > 235 && d[o + 1] > 235 && d[o + 2] > 235){ if(x < ix0) ix0 = x; if(x > ix1) ix1 = x; if(y < iy0) iy0 = y; if(y > iy1) iy1 = y; }
          }
          if(ix1 < 0) continue;
          out.push({ cle:mk.getLatLng().lat.toFixed(5) + ',' + mk.getLatLng().lng.toFixed(5), dx:(ix0 + ix1) / 2 - cx, dy:(iy0 + iy1) / 2 - cy });
        }
        return out;
      }, png.toString('base64'));
      for(const x of r) if(!dejaMesure.has(x.cle)){ (res[y] ||= []).push(x); vus.push(x.cle); }
    }
    for(const k of vus) dejaMesure.add(k);
  }
  console.log('== écran ' + dpr * 100 + ' %');
  for(const y of ys){
    const xs = res[y] || []; if(!xs.length){ console.log('  y=' + y + '  aucune mesure'); continue; }
    const moy = k => xs.reduce((a, x) => a + x[k], 0) / xs.length;
    const dys = xs.map(x => x.dy).sort((a, b) => a - b);
    console.log(`  y=${y}  n=${xs.length}  dx ${moy('dx').toFixed(2)}  dy ${moy('dy').toFixed(2)}  (min ${dys[0].toFixed(2)}, max ${dys[dys.length - 1].toFixed(2)})`);
  }
  await ctx.close();
}
await nav.close();
