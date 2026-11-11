// Essai du Birdydex d'un continent et du monde (2026-11-11) : la grille se remplit, et le palier de chaque case
// essayee est celui que la fiche, ouverte depuis la case, montre sur le meme continent. Puis retour a un pays,
// et le meme parcours au telephone. Captures dans notes-privees/essai-birdydex-continent/.
// Usage : node outils/verif/_essai-birdydex-continent.mjs [port]
import { chromium } from 'playwright';
import fs from 'node:fs';
const port = process.argv[2] || '8765';
const DOSSIER = 'notes-privees/essai-birdydex-continent';
fs.mkdirSync(DOSSIER, { recursive: true });
const nav = await chromium.launch();
let ok = true;
const dire = (bon, ...m) => { if(!bon) ok = false; console.log(bon ? 'OK    ' : 'DEFAUT', ...m); };

async function parcours(nomEcran, ctxOpts){
  const ctx = await nav.newContext({ serviceWorkers: 'block', ...ctxOpts });
  const p = await ctx.newPage();
  const erreurs = [];
  p.on('pageerror', e => erreurs.push(e.message));
  await p.goto(`http://localhost:${port}/demo/`, { waitUntil: 'load' });
  await p.waitForTimeout(3500);
  await p.evaluate(() => document.querySelector('#guide .ml-dialog-close')?.click());
  await p.evaluate(() => document.querySelector('.tab[data-view="pokedex"]')?.click());
  await p.waitForTimeout(1500);
  const lireGrille = () => p.evaluate(() => ({
    bouton: document.querySelector('#pkdxCountry .cp-btn-label')?.textContent.trim(),
    compteur: document.getElementById('pkdxCounter')?.textContent.trim(),
    cases: document.querySelectorAll('#pkdxGrid .pkdx-card').length }));
  const avant = await lireGrille();
  console.log(`[${nomEcran}] pays :`, JSON.stringify(avant));
  for(const cont of ['Europe', 'Monde']){
    await p.evaluate(() => document.getElementById('pkdxCountry').click());
    await p.waitForTimeout(800);
    await p.evaluate(c => document.querySelector(`.cp-group-title[data-cont="${c}"]`).click(), cont);
    await p.waitForTimeout(400);
    await p.evaluate(() => document.querySelector('.cp-modal-close')?.click());
    await p.waitForFunction(() => document.querySelectorAll('#pkdxGrid .pkdx-card').length > 0, null, { timeout: 15000 }).catch(() => {});
    await p.waitForTimeout(800);
    const g = await lireGrille();
    dire(g.bouton === cont && g.cases > 300, `[${nomEcran}] ${cont} : bouton « ${g.bouton} », ${g.cases} cases, compteur « ${g.compteur} »`);
    await p.screenshot({ path: `${DOSSIER}/${nomEcran}-${cont.toLowerCase()}.png` });
    // Des cases reparties dans la grille, hors cases « a decouvrir » (leur clic joue une animation).
    const essais = await p.evaluate(() => {
      const cs = [...document.querySelectorAll('#pkdxGrid .pkdx-card:not(.a-decouvrir)')];
      const pas = Math.max(1, Math.floor(cs.length / 8));
      return cs.filter((_, i) => i % pas === 0).slice(0, 8).map(c => ({ sci: c.dataset.sci, palier: c.querySelector('.pkdx-tier')?.textContent.trim() }));
    });
    for(const e of essais){
      await p.evaluate(s => document.querySelector(`#pkdxGrid .pkdx-card[data-sci="${CSS.escape(s)}"]`).click(), e.sci);
      await p.waitForFunction(() => document.querySelector('#smContinentMois [data-mois="an"]'), null, { timeout: 15000 }).catch(() => {});
      await p.waitForTimeout(1200);
      const f = await p.evaluate(() => ({
        bouton: document.querySelector('#smRarityCountrySel .cp-btn-label')?.textContent.trim(),
        annee: document.querySelector('#smContinentMois [data-mois="an"]')?.textContent.trim() || '' }));
      const palierFiche = (f.annee.match(/(\d+)\s*$/) || [])[1];
      dire(f.bouton === cont && palierFiche === e.palier, `[${nomEcran}] ${cont} ${e.sci.padEnd(28)} case ${e.palier}  fiche « ${f.bouton} » ${f.annee}`);
      await p.keyboard.press('Escape');
      await p.waitForTimeout(500);
    }
  }
  // Retour a un pays : la France, son drapeau et sa grille.
  await p.evaluate(() => document.getElementById('pkdxCountry').click());
  await p.waitForTimeout(800);
  await p.evaluate(() => document.querySelector('.cp-item[data-cc="FR"]').click());
  await p.waitForTimeout(800);
  await p.evaluate(() => document.querySelector('.cp-modal-close')?.click());
  await p.waitForTimeout(1200);
  const apres = await lireGrille();
  const drapeau = await p.evaluate(() => !!document.querySelector('#pkdxCountry .cp-btn-flag img'));
  dire(apres.bouton === 'France' && drapeau && apres.cases === avant.cases || avant.bouton !== 'France',
    `[${nomEcran}] retour : ${JSON.stringify(apres)}, drapeau ${drapeau}`);
  dire(!erreurs.length, `[${nomEcran}] erreurs de la page :`, erreurs.join(' | ') || 'aucune');
  await ctx.close();
}

await parcours('ordi', { viewport: { width: 1280, height: 900 } });
await parcours('tel', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
console.log(ok ? 'CONFORME' : 'DÉFAUT');
await nav.close();
