// Capture d'une planche de maquettes, ordinateur et téléphone, avec les erreurs de la page.
// node outils/verif/_capture-planche.mjs <adresse> <dossier de sortie> <nom>
import { chromium } from 'playwright';
const [, , adresse, sortie, nom] = process.argv;
const nav = await chromium.launch();
for(const [cas, opts] of [['ordi', { viewport:{ width:1440, height:900 } }], ['tel', { viewport:{ width:375, height:812 }, isMobile:true, hasTouch:true, deviceScaleFactor:2 }]]){
  const ctx = await nav.newContext({ locale:'fr-FR', ...opts });
  const p = await ctx.newPage();
  const erreurs = []; p.on('pageerror', e => erreurs.push(e.message)); p.on('console', m => { if(m.type() === 'error') erreurs.push(m.text()); });
  await p.goto(adresse, { waitUntil:'networkidle' });
  await p.waitForTimeout(1500);
  const deborde = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  await p.screenshot({ path:`${sortie}/${nom}-${cas}.png`, fullPage:cas === 'ordi' });
  console.log(cas, ': défilement de côté', deborde, '; erreurs', erreurs.length ? erreurs : 'aucune');
  await ctx.close();
}
await nav.close();
