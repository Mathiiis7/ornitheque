// Essai ponctuel (2026-10-28), démo locale : le choix du membre (Carte, Ligue) dit le nombre
// d'observations de chacun, et le total de « Tout le monde » égale leur somme.
// node outils/verif/_essai-membres-nb.mjs [dossier des captures]
import { chromium, devices } from 'playwright';
const SORTIE = process.argv[2] || '.';
const nav = await chromium.launch();
for(const [nom, opts] of [['ordinateur', { viewport:{ width:1280, height:800 } }], ['telephone', { ...devices['iPhone 13'] }]]){
  const ctx = await nav.newContext({ locale:'fr-FR', ...opts });
  const p = await ctx.newPage();
  const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
  await p.goto((process.env.BASE || 'http://localhost:8765') + '/demo/', { waitUntil:'load' });
  await p.waitForTimeout(1500);
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click());
  await p.waitForTimeout(2500);
  await p.keyboard.press('Escape');
  await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="ligue"]').click());
  await p.evaluate(() => { const b = document.querySelector('#ctCouches [data-couche="ligue"]'); if(b.getAttribute('aria-pressed') !== 'true') b.click(); });
  await p.waitForTimeout(1500);
  await p.evaluate(() => { document.getElementById('ctPliLigue').open = true; document.querySelector('[data-ct-choix="mapPlayerSel"]').click(); });
  await p.waitForTimeout(800);
  const lignes = await p.evaluate(() => [...document.querySelectorAll('.cp-modal-backdrop .cp-item')].map(i => i.innerText.replace(/\s+/g, ' ').trim()));
  const nb = s => +(s.match(/(\d+) obs\./) || [])[1];
  const total = nb(lignes[0]), somme = lignes.slice(1).reduce((t, l) => t + nb(l), 0);
  console.log(nom, '·', lignes.length, 'lignes ;', JSON.stringify(lignes), '; total', total, 'somme', somme, '; erreurs', erreurs.length);
  await p.screenshot({ path:`${SORTIE}/membres-${nom}.png` });
  await ctx.close();
}
await nav.close();
