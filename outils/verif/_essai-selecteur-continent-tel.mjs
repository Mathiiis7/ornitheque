// Le sélecteur de la fiche au téléphone (390 px, au doigt) : les titres de continent tiennent-ils sur une
// ligne avec « voir la carte » et leurs trois colonnes ? Capture dans notes-privees/rarete-continent/.
// Usage : node outils/verif/_essai-selecteur-continent-tel.mjs [port]
import { chromium } from 'playwright';
const port = process.argv[2] || '8766';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:390, height:844 }, isMobile:true, hasTouch:true, locale:'fr-FR' });
const p = await ctx.newPage();
await p.goto(`http://localhost:${port}/demo/`, { waitUntil:'load' });
await p.waitForTimeout(3500);
await p.evaluate(() => document.querySelector('#guide .ml-dialog-close')?.click());
await p.evaluate(() => [...document.querySelectorAll('[data-sci]')].find(x => /upupa epops/i.test(x.dataset.sci)).click());
await p.waitForTimeout(2500);
await p.evaluate(() => document.getElementById('smRarityCountrySel').click());
await p.waitForTimeout(1500);
const mesures = await p.evaluate(() => [...document.querySelectorAll('.cp-cont')].map(b => {
  const r = b.getBoundingClientRect(), enfants = [...b.children].map(e => e.getBoundingClientRect());
  return { nom: b.dataset.cont, haut: Math.round(r.height), deborde: b.scrollWidth > b.clientWidth + 1,
    uneLigne: enfants.every(e => Math.abs(e.top + e.height / 2 - (r.top + r.height / 2)) < 12) };
}));
for(const m of mesures) console.log(m.nom.padEnd(18), 'hauteur', m.haut, m.deborde ? 'DÉBORDE' : '', m.uneLigne ? 'une ligne' : 'SUR DEUX LIGNES');
await p.evaluate(() => document.querySelector('[data-cont="Amérique du Nord"]').scrollIntoView({ block:'center' }));
await p.waitForTimeout(300);
await p.screenshot({ path:'notes-privees/rarete-continent/selecteur-tel.png' });
await nav.close();
