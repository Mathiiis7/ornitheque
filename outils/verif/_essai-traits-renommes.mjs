// Essai ponctuel (2026-10-31), démo locale : les oiseaux renommés depuis Avonet ont leur carte Traits et leur radar.
// La table TRAITS_ALIAS pointe vers des noms qui existent, et rend des mesures complètes.
// node outils/verif/_essai-traits-renommes.mjs
import fs from 'node:fs';
import { chromium } from 'playwright';
const av = JSON.parse(fs.readFileSync('data/avonet_traits.json', 'utf8'));
const src = fs.readFileSync('app.js', 'utf8');
const bloc = src.match(/const TRAITS_ALIAS = \{([\s\S]*?)\};/)[1];
const paires = [...bloc.matchAll(/'([a-z ]+)':'([a-z ]+)'/g)].map(m => [m[1], m[2]]);
let defauts = 0;
for(const [de, vers] of paires){ const t = av[vers]; if(!t || !['ma', 'wi', 'bl', 'ta', 'tail'].every(c => t[c] > 0)){ console.log('ÉCART table', de, vers); defauts++; } }
console.log(paires.length, 'renommés contrôlés dans le fichier');
const NOMS = ['Héron garde-bœufs', 'Autour des palombes', 'Choucas des tours', 'Petit Gravelot', 'Blongios nain'];
const nav = await chromium.launch();
for(const largeur of [1300, 375]){
  const mobile = largeur < 700;
  const ctx = await nav.newContext({ viewport:{ width:largeur, height:mobile ? 812 : 900 }, isMobile:mobile, hasTouch:mobile, locale:'fr-FR', serviceWorkers:'block' });
  const p = await ctx.newPage();
  const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
  await p.goto('http://localhost:8765/demo/', { waitUntil:'load' }); await p.waitForTimeout(1500);
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  await p.evaluate(() => document.querySelector('.tab[data-view="pokedex"], .tab[data-view="birdydex"], .tab[data-view="dex"]')?.click()); await p.waitForTimeout(2000);
  await p.keyboard.press('Escape');
  for(const nom of NOMS){
    const ouvert = await p.evaluate(nom => { const c = [...document.querySelectorAll('.pkdx-card')].find(x => x.textContent.includes(nom)); if(c){ c.click(); return true; } return false; }, nom);
    if(!ouvert){ console.log(largeur, 'pas de case', nom); defauts++; continue; }
    await p.waitForFunction(() => document.querySelector('#smTraitsCard .sm-radar'), null, { timeout:8000 }).catch(() => {});
    const m = await p.evaluate(() => ({ phrase:document.querySelector('#smTraitsCard .sm-rd-phrase')?.textContent, vals:[...document.querySelectorAll('#smTraitsCard .sm-rd-val')].map(x => x.textContent).join(' · '), migration:document.getElementById('smTraitsCard').textContent.includes('Migration') }));
    console.log(largeur, nom, JSON.stringify(m));
    if(!m.phrase || !m.migration){ console.log('   ÉCART'); defauts++; }
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  }
  console.log('erreurs', erreurs.length ? erreurs.slice(0, 2) : 'aucune'); if(erreurs.length) defauts++;
  await ctx.close();
}
await nav.close();
console.log(defauts ? `DÉFAUT (${defauts})` : 'CONFORME');
