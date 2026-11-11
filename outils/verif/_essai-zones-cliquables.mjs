// Zones cliquables sur la carte de la fiche espèce (2026-11-11, « au Soudan je n'arrive pas à sélectionner une
// région depuis la carte ») : pour chaque pays demandé, combien de zones de la carte sont cliquables, et un clic
// sur l'une d'elles la sélectionne-t-il ? Un pays d'une seule pièce (Malte, les Féroé...) n'a rien à cliquer.
// Usage : node outils/verif/_essai-zones-cliquables.mjs [port] [codes séparés par des virgules | tous] [reprendre après ce code]
import { chromium } from 'playwright';
const port = process.argv[2] || '8766';
const apres = process.argv[4] || '';
const nav = await chromium.launch();
const p = await nav.newPage({ viewport:{ width:1280, height:900 } });
const erreurs = [];
p.on('pageerror', e => erreurs.push(e.message));
await p.goto(`http://localhost:${port}/demo/`, { waitUntil:'load' });
await p.waitForTimeout(3500);
await p.evaluate(() => document.querySelector('#guide .ml-dialog-close')?.click());
// Le Moineau domestique : présent presque partout, la carte a des couleurs dans la plupart des pays.
await p.evaluate(() => [...document.querySelectorAll('[data-sci]')].find(x => /passer domesticus/i.test(x.dataset.sci)).click());
await p.waitForTimeout(2500);
let codes = (process.argv[3] || 'SD').split(',');
if(codes[0] === 'tous'){
  await p.evaluate(() => document.getElementById('smRarityCountrySel').click());
  await p.waitForTimeout(1500);
  codes = await p.evaluate(() => [...document.querySelectorAll('.cp-item[data-cc]')].map(e => e.dataset.cc));
  await p.evaluate(() => document.querySelector('.cp-modal-close').click());
}
if(apres) codes = codes.slice(codes.indexOf(apres) + 1);
const soucis = [], partiels = [];
const cliquer = z => p.evaluate(z => document.querySelector(`#smRarityMap [data-zone="${z}"]`)?.dispatchEvent(new MouseEvent('click', { bubbles:true })), z).catch(() => {});
for(const cc of codes){
  await p.evaluate(() => document.getElementById('smRarityCountrySel').click());
  await p.waitForTimeout(400);
  const ok = await p.evaluate(c => { const e = document.querySelector(`.cp-item[data-cc="${c}"]`); if(!e) return false; e.click(); return true; }, cc);
  await p.waitForTimeout(ok ? 1800 : 100);
  await p.evaluate(() => document.querySelector('.cp-modal-close')?.click());
  await p.waitForTimeout(300);
  const r = await p.evaluate(() => {
    const svg = document.querySelector('#smRarityMap svg[role="img"]');
    if(!svg) return { carte: false };
    const zones = svg.querySelectorAll('path[aria-label]').length, cliquables = svg.querySelectorAll('[data-zone]').length;
    const muettes = [...svg.querySelectorAll('path[aria-label]:not([data-zone])')].map(x => x.getAttribute('aria-label').split(' - ')[0]);
    return { carte: true, zones, cliquables, premiere: svg.querySelector('[data-zone]')?.dataset.zone || null, muettes };
  });
  let selection = '';
  if(r.premiere){
    await cliquer(r.premiere);
    await p.waitForTimeout(900);
    selection = await p.evaluate(() => document.getElementById('smRegPickerLabel')?.textContent.trim() || '');
    await cliquer(r.premiere);   // retour au pays entier
    await p.waitForTimeout(600);
  }
  const unePiece = r.carte && r.zones === 1 && r.cliquables === 0;
  const partiel = r.carte && r.cliquables > 0 && r.cliquables < r.zones;
  const bon = unePiece || (r.carte && r.cliquables > 0 && !/^Toutes/.test(selection));
  if(!bon) soucis.push(cc);
  if(partiel) partiels.push(`${cc} ${r.cliquables}/${r.zones} (muettes : ${r.muettes.join(', ')})`);
  console.log((bon ? (unePiece ? 'pièce  ' : partiel ? 'partiel' : 'ok     ') : 'SOUCI  ') + cc, ok ? '' : '(pas dans le sélecteur)',
    r.carte ? `${r.cliquables}/${r.zones}` : 'pas de carte', '| après clic :', selection);
}
console.log('\nZones en partie cliquables :\n  ' + (partiels.join('\n  ') || 'aucune'));
console.log(`\n${codes.length} pays, ${soucis.length} avec souci : ${soucis.join(' ')}`);
if(erreurs.length) console.log('ERREURS ' + [...new Set(erreurs)].join(' | '));
await nav.close();
