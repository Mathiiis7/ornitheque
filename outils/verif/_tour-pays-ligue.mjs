// Tour (2026-11-10) des onglets de la LIGUE pour chaque pays du site, dans la démo locale.
// La démo n'a que des observations françaises : on sert une copie de demo/donnees.js où « Alex »
// (le visiteur) a en plus UNE observation dans chaque pays (l'espèce la plus fréquente du pays,
// sauvage, pas encore sur sa liste, une espèce différente par pays). Puis :
//   - Classement : les trois modes (nombre, rareté ligue, rareté terrain) sans NaN ni undefined ;
//   - Qui a vu quoi, rareté terrain, pays par pays : la ligne de l'espèce du pays et sa pastille
//     (un palier attendu, pas « Sans palier », « Étranger » ni « Exotique ») ;
//   - Fil : chaque observation ajoutée et son mot de rareté ;
//   - Trophées : Magellan doit compter les 7 continents ;
//   - Quiz : il ne dépend d'aucun pays, ouvert une fois.
// Erreurs de la page et fichiers introuvables relevés à chaque étape.
// Usage : node outils/verif/_tour-pays-ligue.mjs [CC,CC,...]
//   -> %TEMP%/essai-monde/tour-pays-ligue.jsonl, résumé à la fin
import { chromium } from 'playwright';
import { readFileSync, appendFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const RACINE = new URL('../../', import.meta.url);
const lire = f => readFileSync(new URL(f, RACINE), 'utf8');
const app = lire('app.js');
function table(decl) {
  const i = app.indexOf(decl); if (i < 0) throw new Error(decl + ' introuvable');
  let d = 0, debut = app.indexOf('{', i), j = debut;
  for (; j < app.length; j++) { if (app[j] === '{') d++; else if (app[j] === '}') { d--; if (!d) { j++; break; } } }
  return JSON.parse(app.substring(debut, j));
}
const monde = JSON.parse(app.match(/^const PAYS_MONDE = (\{.*\});/m)[1]);
const pays = {};
for (const m of app.matchAll(/name: ["']([^"']+)["'], flagCode: '([A-Z]{2})'/g)) pays[m[2]] = m[1];
for (const [cc, v] of Object.entries(monde)) pays[cc] = v[0];
const FR_NAMES = table('const FR_NAMES = ');
const EXO = table('EXOTIQUES_EBIRD_PAR_PAYS = ');
const filtre = (process.argv[2] || '').split(',').filter(Boolean);
const codes = Object.keys(pays).filter(cc => cc !== 'FR' && (!filtre.length || filtre.includes(cc)));

// Liste actuelle d'Alex, pour ne pas lui ajouter une espèce qu'il a déjà.
const demo = lire('demo/donnees.js');
const deja = new Set([...demo.matchAll(/"k":"([^"]+)"/g)].map(m => m[1]));
const UID = 'leagues/merlin-bird/members/demo-visiteur';

// L'espèce de chaque pays : la plus fréquente de ses quinzaines, sauvage, nommée, pas encore prise.
const prises = new Set(deja), ajout = [], sansEspece = [];
for (const cc of codes) {
  const f = join(new URL('data/countries/' + cc.toLowerCase() + '/freq_48.json', RACINE).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
  if (!existsSync(f)) { sansEspece.push(cc + ' (pas de freq_48)'); continue; }
  const freq = JSON.parse(readFileSync(f, 'utf8'));
  const tri = Object.entries(freq).map(([s, a]) => [s, a.reduce((x, y) => x + (y || 0), 0)])
    .filter(([s, v]) => v > 0 && FR_NAMES[s] && !(EXO[cc] || {})[s] && !prises.has(s)).sort((a, b) => b[1] - a[1]);
  if (!tri.length) { sansEspece.push(cc + ' (aucune espèce libre)'); continue; }
  const s = tri[0][0]; prises.add(s);
  ajout.push({ cc, nom: pays[cc], sci: s, fr: FR_NAMES[s] });
}
const T0 = Date.UTC(2026, 8, 27, 8);   // la démo est figée au 2026-09-28
const especes = ajout.map((e, i) => ({ k: e.sci, c: e.fr, s: e.sci, d: '2026-09-27', l: e.nom, o: 1, f: 1, co: e.cc, la: 0, lo: 0, a: T0 + i * 1000 }));
const suite = `\nDONNEES[${JSON.stringify(UID)}].species.push(...${JSON.stringify(especes)});\n`;

const d = join(tmpdir(), 'essai-monde'); mkdirSync(d, { recursive: true });
const sortie = join(d, 'tour-pays-ligue.jsonl'); writeFileSync(sortie, '');
const note = o => appendFileSync(sortie, JSON.stringify(o) + '\n');

// Magellan compte les continents par CONTINENT_7_DE : un pays du site absent de CONTINENTS_7
// ne compterait pour aucun continent, sans erreur.
const c7 = app.match(/const CONTINENTS_7 = \{([\s\S]*?)\};/)[1];
const dansC7 = new Set([...c7.matchAll(/'([A-Z ]+)'/g)].flatMap(m => m[1].split(' ')));
const horsContinent = Object.keys(pays).filter(cc => !dansC7.has(cc));

const navigateur = await chromium.launch({ channel: 'chrome' });
// Les lignes d'Alex au Classement, sans puis avec les observations ajoutées : le nombre d'espèces
// doit monter d'autant, et les raretés ne doivent pas baisser.
async function ligneAlex(avecAjout){
  const c = await navigateur.newContext({ viewport: { width: 1300, height: 900 }, serviceWorkers: 'block' });
  if (avecAjout) await c.route('**/demo/donnees.js*', async r => { const rep = await r.fetch(); r.fulfill({ response: rep, body: (await rep.text()) + suite }); });
  const p = await c.newPage();
  await p.goto('http://localhost:8765/demo/', { waitUntil: 'networkidle' }); await p.waitForTimeout(2000); await p.keyboard.press('Escape');
  await p.evaluate(() => document.querySelector('[data-view="ranking"]')?.click()); await p.waitForTimeout(1500);
  const res = {};
  for (const mode of ['count', 'league', 'real']) {
    await p.locator(`#boardModes [data-mode="${mode}"]`).click(); await p.waitForTimeout(4000);
    res[mode] = await p.evaluate(() => {
      const tr = [...document.querySelectorAll('#boardList tr, #boardList [role="row"], #boardList > *')].filter(e => /Alex/.test(e.innerText)).pop();
      const t = tr ? tr.innerText.replace(/\s+/g, ' ') : '';
      const m = t.match(/Alex\s+(?:TOI\s+)?(\d[\d\s ]*?)(?=\s[^\d\s ])/);
      return { texte: t.slice(0, 100), nombre: m ? Number(m[1].replace(/[\s ]/g, '')) : null };
    });
  }
  await c.close();
  return res;
}
const avant = await ligneAlex(false), apres = await ligneAlex(true);

const ctx = await navigateur.newContext({ viewport: { width: 1300, height: 900 }, serviceWorkers: 'block' });
await ctx.route('**/demo/donnees.js*', async r => { const rep = await r.fetch(); r.fulfill({ response: rep, body: (await rep.text()) + suite }); });
const page = await ctx.newPage();
let erreurs = [], manquants = [];
page.on('pageerror', e => erreurs.push(e.message.slice(0, 160)));
page.on('console', m => { if (m.type() === 'error' && !/xeno-canto|Failed to load resource/.test(m.text())) erreurs.push('console: ' + m.text().slice(0, 160)); });
page.on('response', r => { if (r.status() >= 400 && !/flagcdn|wikimedia|xeno|inaturalist|gstatic|google/.test(r.url())) manquants.push(r.status() + ' ' + r.url().replace(/^https?:\/\/[^/]+/, '')); });
const releve = () => { const o = { erreurs: [...new Set(erreurs)], manquants: [...new Set(manquants)] }; erreurs = []; manquants = []; return o; };
const vue = async v => { await page.evaluate(v => document.querySelector(`[data-view="${v}"]`)?.click(), v); await page.waitForTimeout(1500); };

await page.goto('http://localhost:8765/demo/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000); await page.keyboard.press('Escape');
const bilan = { ajoutes: ajout.length, sansEspece, horsContinent, alex: { avant, apres }, alertes: [] };
const alerte = (ou, quoi) => { bilan.alertes.push(`${ou} : ${quoi}`); };
if (horsContinent.length) alerte('Magellan', 'pays sans continent : ' + horsContinent.join(' '));
for (const mode of ['count', 'league', 'real']) {
  const a = avant[mode].nombre, b = apres[mode].nombre;
  if (a == null || b == null) alerte('Classement ' + mode, `nombre d'Alex illisible (${avant[mode].texte} / ${apres[mode].texte})`);
  else if (mode === 'count' && b - a !== ajout.length) alerte('Classement nombre', `Alex ${a} -> ${b}, attendu +${ajout.length}`);
  else if (b < a) alerte('Classement ' + mode, `Alex baisse : ${a} -> ${b}`);
}
note({ etape: 'chargement', ...releve() });

// 1. Classement, trois modes.
await vue('ranking');
for (const mode of ['count', 'league', 'real']) {
  await page.locator(`#boardModes [data-mode="${mode}"]`).click(); await page.waitForTimeout(1500);
  const r = await page.evaluate(() => {
    const t = document.querySelector('#board')?.innerText || '';
    const alex = [...document.querySelectorAll('#boardList > *')].find(e => /Alex/.test(e.innerText));
    return { nan: /NaN|undefined|null/.test(t), alex: alex ? alex.innerText.replace(/\s+/g, ' ').slice(0, 120) : null };
  });
  const o = { etape: 'classement-' + mode, ...r, ...releve() };
  note(o);
  if (r.nan) alerte('Classement ' + mode, 'NaN / undefined / null à l\'écran');
  if (!r.alex) alerte('Classement ' + mode, 'Alex absent');
  if (o.erreurs.length) alerte('Classement ' + mode, o.erreurs.join(' | '));
}

// 2. Qui a vu quoi en rareté terrain, pays par pays.
const parPays = [];
const t0 = Date.now();
for (const [i, e] of ajout.entries()) {
  let r = {};
  try {
    await page.locator('#paysBtn').click({ timeout: 5000 }); await page.waitForTimeout(400);
    await page.locator('input.cp-search:visible').fill(e.nom); await page.waitForTimeout(400);
    const items = page.locator('.cp-item:visible').filter({ hasText: e.nom });
    const exact = items.filter({ has: page.locator(`text="${e.nom}"`) });
    await ((await exact.count()) ? exact.first() : items.first()).click({ timeout: 5000 });
    await page.waitForTimeout(2500);
    r = await page.evaluate(sci => {
      const note = document.querySelector('#rarPaysNote');
      const lien = [...document.querySelectorAll('#matrix .sp-link')].find(x => x.dataset.sci === sci);
      const tr = lien?.closest('tr');
      const rar = tr?.children[1];
      const lignes = document.querySelectorAll('#matrix tbody tr').length;
      return { note: note && !note.hidden ? note.innerText.replace(/\s+/g, ' ').slice(0, 120) : null,
        ligne: !!tr, palier: rar ? (rar.innerText.trim() || rar.querySelector('[title]')?.title || '').replace(/\s+/g, ' ').slice(0, 60) : null,
        titre: rar?.querySelector('[title]')?.title?.slice(0, 80) || null, lignes,
        nan: /NaN|undefined/.test(document.querySelector('#matrix')?.innerText || '') };
    }, e.sci);
  } catch (err) { r.echec = err.message.split('\n')[0].slice(0, 160); await page.keyboard.press('Escape').catch(() => {}); }
  const o = { etape: 'qui-a-vu-quoi', cc: e.cc, nom: e.nom, sci: e.sci, fr: e.fr, ...r, ...releve() };
  note(o); parPays.push(o);
  const mauvais = o.echec || !o.ligne || o.nan || /Sans palier|Étranger|Exotique|pas de rareté/.test((o.palier || '') + ' ' + (o.titre || '') + ' ' + (o.note || '')) || o.erreurs.length || o.manquants.length;
  if (mauvais) alerte('Qui a vu quoi ' + e.cc + ' ' + e.nom, `${o.echec || ''} ligne=${o.ligne} palier=${o.palier} titre=${o.titre} note=${o.note} ${o.erreurs.join(' | ')} ${o.manquants.join(' | ')}`);
  console.log(`${String(i + 1).padStart(3)}/${ajout.length} ${e.cc} ${e.nom.padEnd(26)} ${(o.palier || '-').padEnd(20)} ${mauvais ? '<- A VOIR' : ''} (${Math.round((Date.now() - t0) / 1000)} s)`);
}
// Remettre « Tous les pays ».
try { await page.locator('#paysBtn').click(); await page.waitForTimeout(400); await page.locator('.cp-item:visible').filter({ hasText: 'Tous les pays' }).first().click(); await page.waitForTimeout(1500); } catch {}

// 3. Fil.
await vue('feed'); await page.waitForTimeout(4000);
const fil = await page.evaluate(noms => {
  const t = document.querySelector('#feedList')?.innerText || '';
  return { vus: noms.filter(n => t.includes(n)).length, nan: /NaN|undefined/.test(t), extrait: t.replace(/\s+/g, ' ').slice(0, 300) };
}, ajout.map(e => e.fr));
note({ etape: 'fil', ...fil, ...releve() });
if (fil.nan) alerte('Fil', 'NaN / undefined à l\'écran');

// 4. Trophées.
await vue('trophies'); await page.waitForTimeout(3000);
const tro = await page.evaluate(() => {
  const t = document.body.innerText;
  const m = t.match(/(\d)\s*\/\s*7 continents/);
  return { magellan: m ? m[0] : null, nan: /NaN|undefined/.test(document.querySelector('#viewTrophies, [id*="rophies"]')?.innerText || '') };
});
const oTro = { etape: 'trophees', ...tro, ...releve() }; note(oTro);
if (tro.nan) alerte('Trophées', 'NaN / undefined');
if (oTro.erreurs.length) alerte('Trophées', oTro.erreurs.join(' | '));

// 5. Quiz.
await vue('quiz'); await page.waitForTimeout(2500);
const oQuiz = { etape: 'quiz', texte: (await page.evaluate(() => document.querySelector('#viewQuiz, [id*="uiz"]')?.innerText || '')).replace(/\s+/g, ' ').slice(0, 160), ...releve() };
note(oQuiz);
if (oQuiz.erreurs.length) alerte('Quiz', oQuiz.erreurs.join(' | '));

await navigateur.close();
const continentsCouverts = new Set(ajout.map(e => monde[e.cc]?.[2]).filter(Boolean));
bilan.fil = fil; bilan.trophees = tro; bilan.quiz = oQuiz.texte;
bilan.paliers = parPays.reduce((a, o) => { const k = (o.palier || '-').slice(0, 25); a[k] = (a[k] || 0) + 1; return a; }, {});
console.log('\nPays essayés :', ajout.length, '| sans espèce :', sansEspece.join(', ') || 'aucun');
console.log('Continents des pays du monde :', [...continentsCouverts].join(', '));
console.log('Fil :', fil.vus, '/', ajout.length, 'observations ajoutées visibles');
console.log('Trophées, pays sans continent pour Magellan :', horsContinent.join(' ') || 'aucun');
console.log('Classement, Alex avant -> après :', ['count', 'league', 'real'].map(m => `${m} ${avant[m].nombre} -> ${apres[m].nombre}`).join(' ; '));
console.log('Quiz :', oQuiz.texte.slice(0, 80));
console.log('Paliers lus :', JSON.stringify(bilan.paliers));
console.log(`\n${bilan.alertes.length} alerte(s)`); for (const a of bilan.alertes.slice(0, 60)) console.log(' - ' + a);
writeFileSync(join(d, 'tour-pays-ligue-bilan.json'), JSON.stringify(bilan, null, 1));
console.log('détail :', sortie);
