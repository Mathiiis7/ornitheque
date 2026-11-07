// Essai ponctuel (2026-11-07) : au téléphone, où tombe le bouton Légende sur la carte, et voit-on le panneau ?
// ANCIEN_CSS=chemin : sert ce styles.css à la place du vrai, pour rejouer un téléphone qui a gardé l'ancienne
// feuille de style en cache avec le nouvel app.js. node outils/verif/_essai-legende-tel.mjs [largeur] [hauteur]
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
const DOS = process.env.DOS || 'C:/Users/mathi/AppData/Local/Temp/claude/ce1f935b4263329c/73f9877c-7c1c-4304-af22-0f97053bf457/scratchpad';
const L = +(process.argv[2] || 390), H = +(process.argv[3] || 664);
const nav = await chromium.launch();
const p = await (await nav.newContext({ viewport:{ width:L, height:H }, isMobile:true, hasTouch:true, deviceScaleFactor:3, locale:'fr-FR', serviceWorkers:'block' })).newPage();
if(process.env.ANCIEN_CSS){
  const css = readFileSync(process.env.ANCIEN_CSS);
  await p.route(/\/styles\.css(\?|$)/, r => r.fulfill({ status:200, contentType:'text/css', body:css }));
}
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
await p.waitForTimeout(2000);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click());
await p.waitForTimeout(2500);
await p.evaluate(() => document.getElementById('ctCarte').scrollIntoView({ block:'end' })); await p.waitForTimeout(400);
console.log(JSON.stringify(await p.evaluate(() => {
  const c = document.getElementById('ctCarte').getBoundingClientRect(), b = document.getElementById('ctBtnLegende').getBoundingClientRect(), z = document.getElementById('ctZone');
  return { legendeAuDessusDuBas:Math.round(c.bottom - b.bottom), panneauVisible:!!z.offsetHeight, hauteurPanneau:Math.round(z.getBoundingClientRect().height) };
})));
await p.screenshot({ path:`${DOS}/legende-${process.env.ANCIEN_CSS ? 'ancien-css' : 'actuel'}.png` });
await nav.close();
