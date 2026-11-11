// Essai de la rareté par continent (2026-11-11) : la fiche affiche-t-elle la valeur de la comparaison
// (notes-privees/rarete-continent/comparer.mjs avec DETAIL=1, « surface plafonnée »), à 10 % près ? Les deux
// partent de valeurs de pays un peu différentes : les quinzaines brutes là-bas, la moyenne mensuelle du site
// ici. Le monde aussi (monde.mjs, LARGEUR_COTE=10 : l'Antarctique réduite à sa côte). Capture du sélecteur.
// Usage : node outils/verif/_essai-rarete-continent.mjs [port]
import { chromium } from 'playwright';
const port = process.argv[2] || '8766';
const CAS = [['Europe', 0.03054], ['Afrique', 0.07567], ['Asie', 0.07497], ['Monde', 0.039]];
const nav = await chromium.launch();
const p = await nav.newPage({ viewport:{ width:1280, height:900 } });
const erreurs = [];
p.on('pageerror', e => erreurs.push(e.message));
await p.goto(`http://localhost:${port}/demo/`, { waitUntil:'load' });
await p.waitForTimeout(3500);
await p.evaluate(() => document.querySelector('#guide .ml-dialog-close')?.click());
await p.evaluate(() => [...document.querySelectorAll('[data-sci]')].find(x => /upupa epops/i.test(x.dataset.sci)).click());
await p.waitForTimeout(2500);
let ok = true;
for(const [cont, attendu] of CAS){
  await p.evaluate(() => document.getElementById('smRarityCountrySel').click());
  await p.waitForTimeout(700);
  await p.evaluate(c => document.querySelector(`[data-cont="${c}"]`).click(), cont);
  await p.waitForTimeout(1500);
  await p.evaluate(() => document.querySelector('.cp-modal-close').click());
  await p.waitForTimeout(400);
  if(cont === 'Monde'){
    await p.evaluate(() => document.getElementById('smRarityCountrySel').click());
    await p.waitForTimeout(1200);
    await p.locator('.cp-modal-inner').screenshot({ path:'notes-privees/rarete-continent/selecteur.png' });
    await p.evaluate(() => document.querySelector('.cp-modal-close').click());
    await p.waitForTimeout(300);
  }
  const lu = await p.evaluate(() => ({
    entete: document.getElementById('smOqZone').textContent.trim(),
    annee: document.querySelector('#smContinentMois [data-mois="an"]').textContent.trim(),
    note: document.querySelector('#smOuQuandLegende .sm-oq-note')?.textContent.slice(0, 90) }));
  const palier = (lu.annee.match(/(\d+)$/) || [])[1];
  const pct = (lu.entete.match(/([\d,]+)\s*%/) || [])[1];
  const v = pct ? +pct.replace(',', '.') / 100 : null;
  const bon = attendu == null ? (!palier && v == null) : (v != null && Math.abs(v - attendu) / attendu < 0.10);
  if(!bon) ok = false;
  console.log(bon ? 'OK    ' : 'ECART ', cont.padEnd(10), 'attendu', attendu, '| entête :', lu.entete, '| année :', lu.annee, '|', lu.note);
  if(cont === 'Europe'){
    await p.evaluate(() => document.querySelector('#speciesModal .sm-oq-bloc').scrollIntoView({ block:'start' }));
    await p.waitForTimeout(300);
    await p.locator('#speciesModal .sm-oq-bloc').screenshot({ path:'notes-privees/rarete-continent/europe-huppe.png' });
  }
}
console.log(ok ? 'CONFORME' : 'DÉFAUT', erreurs.length ? 'ERREURS ' + erreurs.join(' | ') : 'sans erreur');
await nav.close();
