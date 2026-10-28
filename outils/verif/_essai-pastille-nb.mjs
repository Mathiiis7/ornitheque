// Essai ponctuel (2026-10-28) : le petit nombre d'une pastille du Récent, à 1 et 2 chiffres.
// Pose de vraies pastilles sur la carte de la démo et mesure la place du nombre par rapport au point.
// node outils/verif/_essai-pastille-nb.mjs [dossier des captures]
import { chromium } from 'playwright';
const SORTIE = process.argv[2] || '.';
const nav = await chromium.launch();
const ctx = await nav.newContext({ locale:'fr-FR', viewport:{ width:1280, height:800 }, deviceScaleFactor:3 });
await ctx.addInitScript(() => {
  const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); };
  att();
});
const p = await ctx.newPage();
await p.goto((process.env.BASE || 'http://localhost:8765') + '/demo/', { waitUntil:'load' });
await p.waitForTimeout(1500);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click());
await p.waitForTimeout(2500);
// Le même HTML qu'_ctPastille, à 2, 21 et 128 observations, posé au centre de la carte.
const mesures = await p.evaluate(() => {
  const c = window.__carte, centre = c.getCenter(), res = [];
  const oeil = document.querySelector('.ct-pt') ? '' : '';
  [2, 21, 128].forEach((nb, i) => {
    const m = L.marker([centre.lat, centre.lng + (i - 1) * 1.2], { icon:L.divIcon({ html:`<span class="ct-pt ct-pt-oeil" style="background:#3a9a3a">${oeil}<span class="ct-pt-nb">${nb}</span></span>`, className:'ct-pt-ico essai-nb', iconSize:[22, 22] }) }).addTo(c);
  });
  return [...document.querySelectorAll('.essai-nb')].map(ico => {
    const pt = ico.querySelector('.ct-pt').getBoundingClientRect(), nb = ico.querySelector('.ct-pt-nb').getBoundingClientRect();
    return { texte:ico.querySelector('.ct-pt-nb').textContent, point:[pt.left, pt.top, pt.width, pt.height].map(Math.round), nombre:[nb.left, nb.top, nb.width, nb.height].map(Math.round),
      decalBas:Math.round(nb.top - pt.bottom), decalDroite:Math.round(nb.right - pt.right) };
  });
});
console.log(JSON.stringify(mesures, null, 1));
const b = mesures[1];
await p.screenshot({ path:`${SORTIE}/pastille-nb.png`, clip:{ x:mesures[0].point[0] - 30, y:mesures[0].point[1] - 30, width:mesures[2].point[0] - mesures[0].point[0] + 90, height:80 } });
await nav.close();
