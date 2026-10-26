// Essai ponctuel (2026-10-26), démo locale : dans le Récent d'un pays entier, toutes les espèces
// (pas seulement ce qui manque), lesquelles sont au palier 10 ? Pour repérer un oiseau commun
// qu'un nom mal reconnu ferait passer pour exceptionnel.
// node outils/verif/_essai-paliers10.mjs FR,ES,IT
import { chromium } from 'playwright';
const pays = (process.argv[2] || 'FR,ES').split(',');
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:1440, height:900 }, locale:'fr-FR' });
await ctx.addInitScript(() => {
  const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); };
  att();
});
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
await p.waitForTimeout(1500);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click());
await p.waitForTimeout(2500);
await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="recent"]').click());
await p.waitForTimeout(1000);
for(const cc of pays){
  await p.evaluate(cc => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr.cc === cc && l.fire && !f) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); }, cc);
  await p.waitForTimeout(1500);
  await p.evaluate(() => { const c = document.getElementById('ctRecManque'); if(c && c.checked) c.click(); });
  for(let i = 0; i < 40; i++){ await p.waitForTimeout(1000); if(await p.evaluate(() => document.querySelectorAll('#ctListeRecent .ct-rang').length && !(document.getElementById('ctRecEtat')?.textContent || '').includes('…'))) break; }
  await p.waitForTimeout(1500);
  // Tout déplier : « Voir les N autres ».
  for(let i = 0; i < 10; i++){ const ok = await p.evaluate(() => { const b = [...document.querySelectorAll('#ctListeRecent button')].find(x => /^Voir les \d+ autres/.test(x.textContent.trim())); if(b){ b.click(); return true; } return false; }); if(!ok) break; await p.waitForTimeout(300); }
  const r = await p.evaluate(() => { const rs = [...document.querySelectorAll('#ctListeRecent .ct-rang')]; return { n:rs.length, dix:rs.filter(x => x.querySelector('.tier-rond')?.textContent.trim() === '10').map(x => x.querySelector('.nom')?.textContent + ' (' + x.dataset.sci + ')'), gris:rs.filter(x => x.querySelector('.tier-rond')?.textContent.trim() === '?').map(x => x.querySelector('.nom')?.textContent) }; });
  console.log(`${cc} : ${r.n} espèces, palier 10 : ${r.dix.length}\n  ${r.dix.join('\n  ')}\n  « ? » : ${r.gris.join(', ') || 'aucune'}`);
}
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
await nav.close();
