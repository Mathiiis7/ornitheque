// Essai ponctuel (2026-10-26), démo locale : onglet Récent, clic sur un pays entier (France, puis
// Espagne) : combien de requêtes au relais, combien d'espèces dans la liste et de points sur la carte.
// node outils/verif/_essai-pays-entier.mjs [largeur]
import { chromium } from 'playwright';
const largeur = +(process.argv[2] || 1440), mobile = largeur < 700;
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:largeur, height:mobile ? 812 : 900 }, isMobile:mobile, hasTouch:mobile, locale:'fr-FR' });
await ctx.addInitScript(() => {
  const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); };
  att();
});
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message)); p.on('console', m => { if(m.type() === 'error') erreurs.push(m.text()); });
const relais = []; p.on('request', r => { if(/ornitheque-relais|ebird\.org/.test(r.url())) relais.push(r.url().replace(/^https?:\/\/[^/]+/, '')); });
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
await p.waitForTimeout(1500);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click());
await p.waitForTimeout(2500);
await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="recent"]').click());
await p.waitForTimeout(1000);
const etat = () => p.evaluate(() => ({
  onglet:document.querySelector('#ctOnglets [aria-selected="true"]')?.dataset.onglet,
  especes:document.querySelectorAll('#ctListeRecent .ct-rang').length,
  vide:document.querySelector('#ctListeRecent .ct-vide b')?.textContent || '',
  points:(() => { let n = 0; window.__carte.eachLayer(l => { if(l.getAllChildMarkers) return; if(l.getLayers) l.getLayers().forEach(m => { if(m._rec) n++; }); }); return n; })(),
  ligneMax:document.querySelector('#ctListeRecent')?.innerText.slice(-200),
}));
console.log('Récent, à l\'arrivée :', JSON.stringify(await etat()));
for(const cc of ['FR', 'ES']){
  relais.length = 0;
  // Le clic sur le pays, comme un vrai clic sur sa forme.
  const ok = await p.evaluate(cc => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && (pr.cc === cc || pr.code === cc || pr.iso === cc || pr.ISO_A2 === cc) && l.fire && !f) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); return !!f; }, cc);
  for(let i = 0; i < 40; i++){ await p.waitForTimeout(1000); const e = await etat(); if(e.especes && !(await p.evaluate(() => (document.getElementById('ctRecEtat')?.textContent || '').includes('…')))) break; }
  await p.waitForTimeout(1500);
  console.log(cc, 'forme trouvée :', ok, JSON.stringify(await etat()), 'requêtes :', relais.length, JSON.stringify(relais.slice(0, 4)));
  await p.screenshot({ path:`C:/Users/mathi/AppData/Local/Temp/claude/C--Users-mathi-Documents-0-Claude-1-App-ornitheque/758021a1-dbe9-4f01-a281-98ef248c4ecc/scratchpad/pays-${cc}-${largeur}.png` });
}
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
await nav.close();
