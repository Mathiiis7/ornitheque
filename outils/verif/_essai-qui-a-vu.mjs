// Essai ponctuel (2026-10-28), démo locale : la liste d'une grappe de la ligue dit un seul nom, ou
// « N personnes », et le nom de l'oiseau n'est plus coupé.
// node outils/verif/_essai-qui-a-vu.mjs [dossier des captures]
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
  await p.waitForTimeout(3000);
  await p.keyboard.press('Escape');
  await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="ligue"]').click());
  // Depuis le 2026-10-28, l'onglet n'allume plus sa couche : c'est la pastille qui le fait.
  await p.evaluate(() => { const b = document.querySelector('#ctCouches [data-couche="ligue"]'); if(b && b.getAttribute('aria-pressed') !== 'true') b.click(); });
  await p.waitForTimeout(2500);
  // La plus grosse grappe : celle qui a le plus de chances d'avoir des espèces vues par plusieurs.
  const ok = await p.evaluate(() => {
    const g = [...document.querySelectorAll('.ct-carte .leaflet-marker-pane .ct-gr-ico')]
      .sort((a, b) => (parseInt(b.textContent) || 0) - (parseInt(a.textContent) || 0))[0];
    if(!g) return false; g.click(); return true;
  });
  await p.waitForTimeout(1000);
  const lignes = await p.evaluate(() => [...document.querySelectorAll('.ct-gl-l')].map(b => {
    const n = b.querySelector('.ct-gl-nom'), q = b.querySelector('.ct-gl-qui');
    const lh = parseFloat(getComputedStyle(n).lineHeight) || 20;
    return { nom:n.textContent, lignesNom:Math.round(n.getBoundingClientRect().height / (lh * 0.85)),
      qui:q ? q.textContent : '', coupe:q ? q.scrollWidth > q.clientWidth : false };
  }));
  console.log(nom, '· grappe ouverte', ok, '; lignes', lignes.length, '; erreurs', erreurs.length);
  const plusieurs = lignes.filter(l => / personnes$/.test(l.qui)).length, seul = lignes.filter(l => l.qui && !/ personnes$/.test(l.qui)).length;
  console.log('   un nom :', seul, '; « N personnes » :', plusieurs, '; noms d\'oiseau sur 3 lignes ou plus :', lignes.filter(l => l.lignesNom >= 3).length);
  console.log('   exemples :', JSON.stringify(lignes.slice(0, 8)));
  console.log('   « ×N » affichés en ligue :', await p.evaluate(() => [...document.querySelectorAll('.ct-gl-n')].filter(b => /×/.test(b.textContent)).length));
  console.log('   restes « et N autres » :', lignes.filter(l => /autres|,/.test(l.qui)).length);
  await p.screenshot({ path:`${SORTIE}/qui-a-vu-${nom}.png` });
  await ctx.close();
}
await essai('ordinateur', { viewport:{ width:1280, height:800 } });
await essai('telephone', { ...devices['iPhone 13'] });
await nav.close();
