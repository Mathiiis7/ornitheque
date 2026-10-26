// Essai ponctuel (2026-10-26), démo locale : la Carte s'ouvre-t-elle sur le Récent, sa couche éteinte ?
// Puis la Ligue : plus de chiffres entre parenthèses, plus de message « sans coordonnées », la nouvelle aide.
// node outils/verif/_essai-ouverture-carte.mjs [largeur]
import { chromium } from 'playwright';
const largeur = +(process.argv[2] || 1440), mobile = largeur < 700;
const DOS = 'C:/Users/mathi/AppData/Local/Temp/claude/C--Users-mathi-Documents-0-Claude-1-App-ornitheque/758021a1-dbe9-4f01-a281-98ef248c4ecc/scratchpad';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:largeur, height:mobile ? 812 : 900 }, isMobile:mobile, hasTouch:mobile, locale:'fr-FR' });
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
await p.goto(process.env.BASE || 'http://localhost:8765/demo/', { waitUntil:'load' });
await p.waitForTimeout(1500); await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click());
await p.waitForTimeout(2500); await p.keyboard.press('Escape');
const etat = () => p.evaluate(() => ({
  onglet:document.querySelector('#ctOnglets [aria-selected="true"]')?.dataset.onglet,
  couches:[...document.querySelectorAll('#ctCouches [data-couche]')].filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.dataset.couche).join(',') || 'aucune',
  panneau:(document.querySelector('#ctZone .ct-vide b')?.textContent || '').trim(),
}));
console.log('à l\'ouverture :', JSON.stringify(await etat()));
await p.screenshot({ path:`${DOS}/ouverture-carte-${largeur}.png` });
await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="ligue"]').click());
await p.waitForTimeout(1500);
console.log('Ligue :', JSON.stringify(await p.evaluate(() => ({
  phrase:document.querySelector('#ctListeLigue .ct-compte')?.innerText,
  noteSansCoord:getComputedStyle(document.getElementById('mapNote')).display,
  aide:document.querySelector('.ct-aide p')?.textContent.trim(),
}))));
await p.evaluate(() => { const d = document.querySelector('.ct-aide'); d.open = true; d.scrollIntoView({ block:'center' }); });
await p.screenshot({ path:`${DOS}/ligue-aide-${largeur}.png` });
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
await nav.close();
