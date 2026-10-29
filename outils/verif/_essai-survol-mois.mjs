// Essai ponctuel (2026-10-29), démo locale, faux eBird : janvier choisi (ses espèces inventées sont d'hiver ; en août il n'a plus de hotspot) dans « Quand », l'aperçu d'un hotspot
// écrit « août » en gris après son nom ; sans mois, rien. Contraste du gris, en clair et en sombre.
// node outils/verif/_essai-survol-mois.mjs [dossier des captures]
import { chromium } from 'playwright';
import { bouchonEbird } from './_bouchon-ebird.mjs';
const S = process.argv[2] || '.';
const nav = await chromium.launch();
let defauts = 0;
for(const sombre of [false, true]){
  const ctx = await nav.newContext({ viewport:{ width:1300, height:900 }, locale:'fr-FR', colorScheme:sombre ? 'dark' : 'light' });
  await bouchonEbird(ctx);
  await ctx.addInitScript(() => { const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); }; att(); });
  const p = await ctx.newPage();
  const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
  await p.goto('http://localhost:8765/demo/', { waitUntil:'load' }); await p.waitForTimeout(1500);
  await p.keyboard.press('Escape');
  await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click()); await p.waitForTimeout(2000);
  const clic = (cle, val) => p.evaluate(([cle, val]) => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr[cle] === val && (cle !== 'cc' || !pr.ebird) && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); }, [cle, val]);
  await clic('cc', 'FR'); await p.waitForTimeout(2500);
  await clic('ebird', 'FR-PDL'); await p.waitForTimeout(2500);
  await clic('ebird', 'FR-PDL-44'); await p.waitForTimeout(2500);
  await p.evaluate(() => document.querySelector('#ctCouches [data-couche="hot"]').click()); await p.waitForTimeout(3000);
  const survol = async () => {
    for(let i = 0; i < 20 && !(await p.evaluate(() => document.querySelectorAll('.ct-hs-ico').length)); i++) await p.waitForTimeout(500);
    const c = await p.evaluate(() => { const r = document.querySelector('.ct-hs-ico').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    await p.mouse.move(5, 5); await p.waitForTimeout(200);
    await p.mouse.move(c[0], c[1]); await p.waitForTimeout(600);
    return p.evaluate(() => { const t = document.querySelector('.leaflet-tooltip.ct-sv .ct-sv-t'); if(!t) return null; const m = t.querySelector('.ct-sv-mois');
      // Contraste du mois sur le fond de la bulle (WCAG).
      const lum = c => { const v = c.match(/[\d.]+/g).slice(0, 3).map(Number).map(x => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
      const cv = document.createElement('canvas').getContext('2d');
      const rgb = col => { cv.fillStyle = '#000'; cv.fillStyle = col; cv.fillRect(0, 0, 1, 1); const d = cv.getImageData(0, 0, 1, 1).data; return `rgb(${d[0]},${d[1]},${d[2]})`; };
      let ratio = null;
      if(m){ const a = lum(rgb(getComputedStyle(m).color)), b = lum(rgb(getComputedStyle(t.closest('.leaflet-tooltip')).backgroundColor)); ratio = ((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2); }
      return { titre:t.textContent, mois:m ? m.textContent : '', contraste:ratio }; });
  };
  const sans = await survol();
  await p.evaluate(() => { const s = document.getElementById('mapEbMonth'); s.value = '1'; s.dispatchEvent(new Event('change', { bubbles:true })); });
  await p.waitForTimeout(3500);
  const avec = await survol();
  console.log(sombre ? 'sombre' : 'clair ', '· sans mois :', JSON.stringify(sans), '· janvier :', JSON.stringify(avec));
  if(!sans || sans.mois || !avec || avec.mois !== 'janvier' || +avec.contraste < 3) { console.log('   ÉCART'); defauts++; }
  const bulle = await p.evaluate(() => { const b = document.querySelector('.leaflet-tooltip.ct-sv').getBoundingClientRect(); return { x:b.x - 4, y:b.y - 4, width:b.width + 8, height:Math.min(120, b.height + 8) }; });
  await p.screenshot({ path:`${S}/survol-mois-${sombre ? 'sombre' : 'clair'}.png`, clip:bulle });
  if(erreurs.length){ console.log('erreurs :', erreurs); defauts++; }
  await ctx.close();
}
console.log(defauts ? `DÉFAUT (${defauts})` : 'CONFORME');
await nav.close();
