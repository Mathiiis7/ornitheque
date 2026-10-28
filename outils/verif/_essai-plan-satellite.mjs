// Essai ponctuel (2026-10-28), démo locale : le choix Plan / Satellite a-t-il une barre de défilement ?
// node outils/verif/_essai-plan-satellite.mjs [dossier des captures]
import { chromium, devices } from 'playwright';
const SORTIE = process.argv[2] || '.';
const nav = await chromium.launch();
async function essai(nom, opts){
  const ctx = await nav.newContext({ locale:'fr-FR', ...opts });
  const p = await ctx.newPage();
  await p.goto((process.env.BASE || 'http://localhost:8765') + '/demo/', { waitUntil:'load' });
  await p.waitForTimeout(1500);
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click());
  await p.waitForTimeout(3000);
  await p.keyboard.press('Escape');
  // Ce que fait Leaflet quand il mesure une carte encore pliée : classe de défilement et hauteur réduite.
  await p.evaluate(() => { const f = document.querySelector('.leaflet-control-layers-list'); f.classList.add('leaflet-control-layers-scrollbar'); f.style.height = '20px'; });
  const etat = await p.evaluate(() => [...document.querySelectorAll('.leaflet-control-layers')].map(c => {
    const f = c.querySelector('.leaflet-control-layers-list'), cs = getComputedStyle(f);
    return { classe:c.className, maxH:f.style.height || cs.maxHeight, overflowY:cs.overflowY,
      contenu:f.scrollHeight, visible:f.clientHeight, barre:f.offsetWidth - f.clientWidth };
  }));
  console.log(nom, JSON.stringify(etat));
  const c = await p.$('.leaflet-control-layers');
  if(c) await c.screenshot({ path:`${SORTIE}/plan-satellite-${nom}.png` });
  await ctx.close();
}
await essai('ordinateur', { viewport:{ width:1280, height:800 } });
await essai('telephone', { ...devices['iPhone 13'] });
await nav.close();
