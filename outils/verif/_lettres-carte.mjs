// Centrage des initiales de la ligue sur la VRAIE carte (démo), sur beaucoup de points : la carte est
// attrapée à sa création (L.Map.addInitHook), puis promenée à fort zoom sur chaque point de la ligue,
// pour mesurer les points seuls (sans grappe, sans chiffre). Même mesure que essai-lettre-carte.mjs :
// centre du disque de couleur contre centre de l'encre blanche, en pixels d'appareil.
import { chromium } from 'playwright';
const nav = await chromium.launch();
const dprs = (process.argv[3] || '1,1.25,1.5').split(',').map(Number);
for(const dpr of dprs){
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
  // Les positions des points de la ligue, prises dans la carte elle-même.
  const lieux = await p.evaluate(() => {
    const out = []; const m = window.__carte; if(!m) return out;
    m.eachLayer(l => { if(l.getAllChildMarkers) l.getAllChildMarkers().forEach(x => { if(x._ligue) out.push(x.getLatLng()); }); });
    const vus = new Set(); return out.filter(ll => { const k = ll.lat.toFixed(2) + ',' + ll.lng.toFixed(2); if(vus.has(k)) return false; vus.add(k); return true; });
  });
  const res = [], dejaMesure = new Set();
  for(const ll of lieux.slice(0, +(process.argv[2] || 25))){
    await p.evaluate(ll => window.__carte.setView([ll.lat, ll.lng], 15, { animate:false }), ll);
    await p.waitForTimeout(700);
    const png = await p.screenshot();
    const r = await p.evaluate(async b64 => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
      const g = cv.getContext('2d', { willReadFrequently:true }); g.drawImage(img, 0, 0);
      const dpr = devicePixelRatio, out = [];
      const marq = []; window.__carte.eachLayer(l => { if(l._ligue && l._icon) marq.push(l); });
      for(const mk of marq){
        const el = mk._icon.querySelector('.ct-pt-lettre'); if(!el) continue;
        // La pastille du chiffre, à masquer : son blanc et son fond fausseraient les deux centres.
        const nbEl = mk._icon.querySelector('.ct-pt-nb'), nb = nbEl ? nbEl.getBoundingClientRect() : null;
        const b = el.getBoundingClientRect();
        if(b.top < 4 || b.left < 4 || b.bottom > innerHeight - 4 || b.right > innerWidth - 4) continue;
        const fond = getComputedStyle(el).backgroundColor.match(/\d+/g).map(Number);
        const x0 = Math.floor(b.left * dpr), y0 = Math.floor(b.top * dpr), W = Math.ceil(b.width * dpr), H = Math.ceil(b.height * dpr);
        const d = g.getImageData(x0, y0, W, H).data;
        const masque = (x, y) => nb && (x0 + x) / dpr >= nb.left - 1 && (x0 + x) / dpr <= nb.right + 1 && (y0 + y) / dpr >= nb.top - 1 && (y0 + y) / dpr <= nb.bottom + 1;
        let sw = 0, cx = 0, cy = 0;
        for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
          if(masque(x, y)) continue;
          const o = (y * W + x) * 4;
          const e = Math.abs(d[o] - fond[0]) + Math.abs(d[o + 1] - fond[1]) + Math.abs(d[o + 2] - fond[2]);
          if(e < 40){ sw++; cx += x; cy += y; }
        }
        if(sw < 20) continue;
        cx /= sw; cy /= sw;
        const r = 7 * 0.85 * dpr;
        let ix0 = 1e9, ix1 = -1, iy0 = 1e9, iy1 = -1;
        for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
          if(Math.hypot(x - cx, y - cy) > r || masque(x, y)) continue;
          const o = (y * W + x) * 4;
          if(d[o] > 235 && d[o + 1] > 235 && d[o + 2] > 235){ if(x < ix0) ix0 = x; if(x > ix1) ix1 = x; if(y < iy0) iy0 = y; if(y > iy1) iy1 = y; }
        }
        if(ix1 < 0) continue;
        out.push({ avecNb:!!nb, cle:mk.getLatLng().lat.toFixed(5) + ',' + mk.getLatLng().lng.toFixed(5), t:el.textContent.trim(), dx:(ix0 + ix1) / 2 - cx, dy:(iy0 + iy1) / 2 - cy });
      }
      return out;
    }, png.toString('base64'));
    // Un point mesuré une fois (par sa position) n'est plus recompté depuis une autre vue.
    for(const x of r){ if(!dejaMesure.has(x.cle)){ dejaMesure.add(x.cle); res.push(x); } }
  }
  const par = {};
  for(const x of res) (par[x.t + (x.avecNb ? ' (avec chiffre)' : ' (seul)')] ||= []).push(x);
  console.log('== écran ' + dpr * 100 + ' %, ' + res.length + ' mesures sur ' + lieux.length + ' lieux');
  for(const [t, xs] of Object.entries(par)){
    const moy = k => xs.reduce((a, x) => a + x[k], 0) / xs.length;
    const et = k => { const m = moy(k); return Math.sqrt(xs.reduce((a, x) => a + (x[k] - m) ** 2, 0) / xs.length); };
    const dys = xs.map(x => x.dy).sort((a, b) => a - b);
    console.log(`  ${t}  n=${xs.length}  dx ${moy('dx').toFixed(2)} (±${et('dx').toFixed(2)})  dy ${moy('dy').toFixed(2)} (±${et('dy').toFixed(2)})  dy min ${dys[0].toFixed(2)} max ${dys[dys.length - 1].toFixed(2)}`);
  }
  await ctx.close();
}
await nav.close();
