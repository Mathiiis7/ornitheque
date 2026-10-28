// Essai ponctuel (2026-10-28), démo locale : un onglet du panneau Carte n'allume plus sa couche ; couche
// éteinte, il propose de l'afficher ; allumée sans zone, il dit de choisir un pays ou une région.
// node outils/verif/_essai-onglets-couches.mjs [dossier des captures]
import { chromium, devices } from 'playwright';
const SORTIE = process.argv[2] || '.';
const nav = await chromium.launch();
async function essai(nom, opts){
  const ctx = await nav.newContext({ locale:'fr-FR', ...opts });
  const p = await ctx.newPage();
  const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
  await p.goto((process.env.BASE || 'http://localhost:8765') + '/demo/', { waitUntil:'load' });
  await p.waitForTimeout(1500);
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click());
  await p.waitForTimeout(2500);
  await p.keyboard.press('Escape');
  const etat = () => p.evaluate(() => {
    const allumees = [...document.querySelectorAll('#ctCouches [data-couche]')].filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.dataset.couche);
    const v = document.querySelector('#ctContenu [data-volet]:not([hidden])');
    return { onglet:v && v.dataset.volet, classe:v && v.className, visibles:v ? [...v.children].filter(c => getComputedStyle(c).display !== 'none').map(c => c.id || c.className).join(' | ') : '', allumees:allumees.join(',') || 'aucune', texte:v ? v.innerText.replace(/\s+/g, ' ').trim().slice(0, 140) : '' };
  });
  console.log(nom, '· départ', JSON.stringify(await etat()));
  const pan = await p.$('#ctZone'); if(pan) await pan.screenshot({ path:`${SORTIE}/onglets-${nom}-eteinte.png` });
  for(const o of ['recent', 'hot', 'ligue', 'recent']){
    await p.evaluate(o => document.querySelector(`#ctOnglets [data-onglet="${o}"]`).click(), o);
    await p.waitForTimeout(1200);
    console.log('   onglet', o, JSON.stringify(await etat()));
  }
  // « Afficher la couche » dans le Récent, puis dans les Hotspots.
  for(const o of ['recent', 'hot']){
    await p.evaluate(o => document.querySelector(`#ctOnglets [data-onglet="${o}"]`).click(), o);
    await p.waitForTimeout(800);
    const b = await p.evaluate(() => { const b = document.querySelector('#ctContenu [data-volet]:not([hidden]) [data-ct-allume]'); if(!b || !b.offsetParent) return false; b.click(); return true; });
    await p.waitForTimeout(2500);
    console.log('   bouton Afficher (' + o + ')', b, JSON.stringify(await etat()));
    await p.screenshot({ path:`${SORTIE}/onglets-${nom}-${o}.png` });
  }
  console.log('   erreurs', erreurs.length, erreurs.slice(0, 3));
  await ctx.close();
}
await essai('ordinateur', { viewport:{ width:1280, height:800 } });
await essai('telephone', { ...devices['iPhone 13'] });
await nav.close();
