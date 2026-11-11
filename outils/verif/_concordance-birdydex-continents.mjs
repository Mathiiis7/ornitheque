// Le Birdydex d'un continent et la fiche disent-ils le meme palier quand les pays du monde sont DEJA lus ?
// (2026-11-11) Le fichier data/birdydex-continents/ est calcule dans une session neuve, ou ces pays se lisent
// dans le morceau de l'espece (arrondi a 2 chiffres) ; une vraie session lit leur pays.json (Fil, Carte,
// survol du selecteur), et la fiche calcule alors sur la frequence complete. Compte les paliers differents.
// Usage : node outils/verif/_concordance-birdydex-continents.mjs [port]
import { chromium } from 'playwright';
import fs from 'node:fs';
const port = process.argv[2] || '8765';
const EXPORTS = `
;window.__bdx = { FR_NAMES, COUNTRIES_REG, CARTES_CONTINENTS, _isSciAliasSource, _rareteEtendue, _chargerDonneesPays,
  _chargerAiresPays, _chargerEspeceMonde, _chargerPaysMondes, annualFreqToTier };
`;
const fichiers = {};
for(const f of fs.readdirSync('data/birdydex-continents')) fichiers[f.slice(0, -5)] = JSON.parse(fs.readFileSync('data/birdydex-continents/' + f, 'utf8'));
const prefixes = fs.readdirSync('data/especes-monde').filter(f => f.endsWith('.json')).map(f => f.slice(0, -5));
const nav = await chromium.launch();
const ctx = await nav.newContext({ serviceWorkers: 'block' });
await ctx.route(/\/app\.js(\?.*)?$/, async route => {
  const rep = await route.fetch();
  route.fulfill({ response: rep, body: (await rep.text()) + EXPORTS,
    headers: { ...rep.headers(), 'content-type': 'application/javascript; charset=utf-8' } });
});
const p = await ctx.newPage();
await p.goto(`http://localhost:${port}/demo/`, { waitUntil: 'load' });
await p.waitForFunction(() => window.__bdx, null, { timeout: 30000 });
const r = await p.evaluate(async ({ fichiers, prefixes }) => {
  const B = window.__bdx;
  const monde = Object.keys(B.COUNTRIES_REG).filter(cc => B.COUNTRIES_REG[cc].monde);
  await Promise.all([B._chargerDonneesPays(), B._chargerAiresPays(), B._chargerPaysMondes(monde), ...prefixes.map(k => B._chargerEspeceMonde(k))]);
  const especes = Object.keys(B.FR_NAMES).filter(s => !B._isSciAliasSource(s));
  const pas = Math.max(1, Math.floor(especes.length / 600));
  let n = 0; const ecarts = [];
  for(let i = 0; i < especes.length; i += pas){
    const sci = especes[i];
    for(const [nom, slug] of Object.entries(B.CARTES_CONTINENTS)){
      const e = fichiers[slug][sci];
      if(!e) continue;   // pas de case : rien a comparer
      const v = B._rareteEtendue(sci, nom, true);
      const fiche = v && v.an > 0 ? B.annualFreqToTier(v.an) : 0;
      const caseP = B.annualFreqToTier(e[0]);
      n++;
      if(fiche !== caseP) ecarts.push([sci, nom, 'case ' + caseP, 'fiche ' + fiche]);
    }
  }
  return { n, ecarts, mondeLus: monde.length };
}, { fichiers, prefixes });
console.log(`${r.mondeLus} pays du monde lus ; ${r.n} cases comparees, ${r.ecarts.length} palier(s) different(s)`);
for(const e of r.ecarts.slice(0, 30)) console.log('  ', e.join(' | '));
console.log(r.ecarts.length ? 'DÉFAUT' : 'CONFORME');
await nav.close();
