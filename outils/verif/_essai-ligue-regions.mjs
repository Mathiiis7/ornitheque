// Essai ponctuel (2026-10-28), démo locale : le pays de la Ligue a un onglet Régions. Chaque région dit
// combien d'observations de la ligue elle contient ; en choisir une la choisit sur la carte et la liste
// de la Ligue la suit.
// node outils/verif/_essai-ligue-regions.mjs [dossier des captures]
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
  await p.evaluate(() => { document.getElementById('ctPliLigue').open = true; document.getElementById('ctLigPaysBtn').click(); });
  await p.waitForTimeout(800);
  // France, puis l'onglet Régions.
  await p.evaluate(() => [...document.querySelectorAll('.cp-modal-backdrop .cp-item')].find(i => /France/.test(i.textContent)).click());
  await p.waitForTimeout(1500);
  const onglets = await p.evaluate(() => [...document.querySelectorAll('.cp-modal-backdrop .cp-tab')].map(t => t.textContent));
  await p.evaluate(() => document.querySelector('.cp-modal-backdrop .cp-tab[data-onglet="zones"]').click());
  await p.waitForTimeout(500);
  const lignes = await p.evaluate(() => [...document.querySelectorAll('.cp-modal-backdrop .reg-picker-item')].map(i => i.innerText.replace(/\s+/g, ' ').trim()));
  const somme = lignes.slice(1).reduce((t, l) => t + (+(l.match(/(\d+) obs\./) || [0, 0])[1]), 0);
  console.log(nom, '· onglets', JSON.stringify(onglets), '; lignes', lignes.length, JSON.stringify(lignes.slice(0, 6)), '; somme', somme);
  await p.screenshot({ path:`${SORTIE}/ligue-regions-${nom}.png` });
  // Choisir la Bretagne.
  await p.evaluate(() => [...document.querySelectorAll('.cp-modal-backdrop .reg-picker-item')].find(i => /Bretagne/.test(i.textContent)).click());
  await p.waitForTimeout(2500);
  console.log('   après Bretagne :', JSON.stringify(await p.evaluate(() => ({ titre:document.getElementById('ctZoneNom')?.textContent, liste:document.querySelector('#ctListeLigue .ct-compte, #ctListeLigue')?.innerText.slice(0, 90), modal:!!document.querySelector('.cp-modal-backdrop') }))));
  console.log('   erreurs', erreurs.length, erreurs.slice(0, 3));
  await ctx.close();
}
await nav.close();
