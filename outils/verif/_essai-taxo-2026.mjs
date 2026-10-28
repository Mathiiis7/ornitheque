// Essai ponctuel (2026-10-28), démo locale, eBird en direct : après la taxonomie eBird d'octobre 2026,
// le Récent de la France montre le Troglodyte mignon et les bruants renommés en français, avec leur palier.
// node outils/verif/_essai-taxo-2026.mjs [dossier des captures]
import { chromium } from 'playwright';
const SORTIE = process.argv[2] || '.';
const nav = await chromium.launch();
const ctx = await nav.newContext({ locale:'fr-FR', viewport:{ width:1280, height:900 } });
await ctx.addInitScript(() => {
  const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); };
  att();
});
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
await p.goto((process.env.BASE || 'http://localhost:8765') + '/demo/', { waitUntil:'load' });
await p.waitForTimeout(1500);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click());
await p.waitForTimeout(2500);
await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="recent"]').click());
await p.waitForTimeout(500);
// « Seulement ce qui me manque » cacherait les espèces communes : on le décoche.
await p.evaluate(() => { const c = [...document.querySelectorAll('#ctContenu input[type=checkbox]')].find(i => /manque/.test(i.closest('label')?.textContent || '')); if(c && c.checked) c.click(); });
await p.evaluate(() => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr.cc === 'FR' && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); });
for(let i = 0; i < 40; i++){ await p.waitForTimeout(1000); const t = await p.evaluate(() => document.getElementById('ctRecEtat')?.textContent || ''); if(!t.includes('…') && i > 3) break; }
await p.waitForTimeout(1500);
// La liste s'affiche par tranches : on la déroule tant qu'un bouton « plus » existe.
for(let i = 0; i < 20; i++){
  const ok = await p.evaluate(() => { const b = [...document.querySelectorAll('#ctListeRecent button, #ctContenu button')].find(x => /plus|suivant|voir les|afficher/i.test(x.textContent) && !x.classList.contains('ct-rang') && !x.classList.contains('ct-rang-n')); if(b){ b.click(); return b.textContent.trim(); } return ''; });
  if(!ok) break; if(i === 0) console.log('bouton de suite :', ok); await p.waitForTimeout(400);
}
const rangs = await p.evaluate(() => [...document.querySelectorAll('#ctListeRecent .ct-rang')].map(b => ({ sci:b.dataset.sci, txt:b.textContent.replace(/\s+/g, ' ').trim() })));
console.log('lignes', rangs.length, '; erreurs', erreurs.length, erreurs.slice(0, 3));
const vises = rangs.filter(r => /^(nannus|schoeniclus|fringillaria|melophus|emberiza|troglodytes)/i.test(r.sci));
console.log('espèces concernées :', JSON.stringify(vises, null, 1));
// Un nom anglais restant : une ligne dont le texte contient un mot anglais courant d'oiseau.
console.log('noms anglais restants :', JSON.stringify(rangs.filter(r => /\b(Wren|Bunting|Warbler|Gull|Duck|Robin|Wheatear|Thrush|Finch|Tit|Owl)\b/.test(r.txt))));
// Ouvrir la fiche du Troglodyte depuis la liste.
const tro = vises.find(r => /troglodytes/i.test(r.sci));
if(tro){
  await p.evaluate(sci => document.querySelector(`#ctListeRecent .ct-rang[data-sci="${sci}"]`).click(), tro.sci);
  await p.waitForTimeout(2000);
  console.log('fiche :', await p.evaluate(() => [document.querySelector('#smName, .sm-name, #speciesModal h2')?.textContent, document.querySelector('#smSci')?.textContent]));
}
await p.screenshot({ path:`${SORTIE}/taxo-recent.png` });
await nav.close();
