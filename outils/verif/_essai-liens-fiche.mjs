// Essai ponctuel (2026-10-30), démo locale : les liens d'une fiche espèce n'ont plus d'emoji.
// node outils/verif/_essai-liens-fiche.mjs
import { chromium } from 'playwright';
const nav = await chromium.launch();
let defauts = 0;
for(const largeur of [1300, 375]){
  const mobile = largeur < 700;
  const ctx = await nav.newContext({ viewport:{ width:largeur, height:mobile ? 812 : 900 }, isMobile:mobile, hasTouch:mobile, locale:'fr-FR', serviceWorkers:'block' });
  const p = await ctx.newPage();
  const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
  await p.goto('http://localhost:8765/demo/', { waitUntil:'load' }); await p.waitForTimeout(1500);
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  await p.evaluate(() => document.querySelector('.tab[data-view="pokedex"], .tab[data-view="birdydex"], .tab[data-view="dex"]')?.click()); await p.waitForTimeout(2000);
  await p.keyboard.press('Escape');
  await p.evaluate(() => document.querySelector('.pkdx-card')?.click()); await p.waitForTimeout(1500);
  const liens = await p.evaluate(() => [...document.querySelectorAll('a[target="_blank"]')].filter(a => /ebird\.org|wikipedia\.org|xeno-canto\.org/.test(a.href) && a.offsetWidth).map(a => a.textContent.trim()));
  console.log(largeur, JSON.stringify(liens), 'erreurs :', erreurs.length ? erreurs : 'aucune');
  if(!['eBird', 'Wikipédia', 'xeno-canto'].every(t => liens.includes(t)) || erreurs.length) defauts++;
  await ctx.close();
}
console.log(defauts ? `DÉFAUT (${defauts})` : 'CONFORME');
await nav.close();
