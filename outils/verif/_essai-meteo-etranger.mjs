// Essai ponctuel (2026-11-13) : la météo d'une région étrangère dans le panneau de la Carte, choisie par le
// « Où » de la Ligue (pays, puis onglet Régions), comme _essai-ligue-regions.mjs.
// node outils/verif/_essai-meteo-etranger.mjs [pays] [région]   ex. Espagne Andalousie, Kenya Nairobi
import { chromium } from 'playwright';
const PAYS = process.argv[2] || 'Espagne', REG = process.argv[3] || 'Andalousie';
const nav = await chromium.launch();
const p = await (await nav.newContext({ viewport:{ width:1400, height:900 }, locale:'fr-FR', serviceWorkers:'block' })).newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
const demandes = []; p.on('request', r => { if(r.url().includes('open-meteo')) demandes.push(r.url().match(/latitude=[^&]+&longitude=[^&]+/)[0]); });
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
await p.waitForTimeout(1500);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click());
await p.waitForTimeout(2500); await p.keyboard.press('Escape');
// Le pays : la forme dont l'infobulle porte son nom, cliquée à la souris en son centre.
const cherche = async nom => {
  const n = await p.evaluate(() => document.querySelectorAll('#mapEl path.leaflet-interactive').length);
  for(let i = 0; i < n; i++){
    const r = await p.evaluate(i => { const el = document.querySelectorAll('#mapEl path.leaflet-interactive')[i]; const b = el.getBoundingClientRect(); return { x:b.left + b.width / 2, y:b.top + b.height / 2, w:b.width }; }, i);
    if(r.w < 8) continue;
    await p.mouse.move(r.x, r.y); await p.waitForTimeout(60);
    const t = await p.evaluate(() => [...document.querySelectorAll('.leaflet-tooltip')].map(e => e.textContent).join('|'));
    if(t.includes(nom)){ await p.mouse.click(r.x, r.y); return t; }
  }
  return null;
};
const trouve = await cherche(PAYS);
await p.waitForTimeout(5000);
const etat = () => p.evaluate(() => { const m = document.getElementById('ctMeteo'); return { zone:document.getElementById('ctZoneNom').textContent, cache:m.hidden, texte:m.innerText.replace(/\s+/g, ' ').slice(0, 80) }; });
console.log('PAYS', PAYS, trouve ? '' : '(introuvable)', JSON.stringify(await etat()));
const reg = await cherche(REG);
await p.waitForTimeout(5000);
console.log('RÉGION', reg || '(introuvable)', JSON.stringify(await etat()));
console.log('demandes :', demandes.join(' | ') || 'aucune', '- erreurs :', erreurs.length ? erreurs : 'aucune');
await nav.close();
