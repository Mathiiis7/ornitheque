// Les pays trop peu observes pour avoir une rarete (Mathis, 2026-11-11) : moins de 200 listes eBird depuis 2019,
// SAUF s'ils abritent une espece qu'on ne trouve que la, ou presque : sauvage dans le pays, et dans tous les
// autres pays absente ou au palier 8 ou au-dela (« tres rare »). Un tel pays garde sa rarete : sans lui, cette
// espece n'en aurait nulle part.
// Sortie : la ligne PAYS_SANS_RARETE a recopier dans app.js (une seule source, lue partout sans attendre de
// fichier). Le script dit aussi quels pays ont ete gardes, et pour quelle espece. Puis relancer
// outils/build/birdydex-continents.mjs : ces pays ne comptent plus dans les continents.
// Usage : le site servi sur localhost, puis node outils/build/pays-sans-rarete.mjs [port]
import { chromium } from 'playwright';
import fs from 'node:fs';

const port = process.argv[2] || '8765';
const SEUIL_LISTES = 200;
const PALIER_RARE_AILLEURS = 8;
const listes = JSON.parse(fs.readFileSync('data/listes-pays.json', 'utf8'));
const total = cc => listes[cc].reduce((a, b) => a + b, 0);
const candidats = Object.keys(listes).filter(cc => total(cc) < SEUIL_LISTES);
const EXPORTS = `
;window.__bdx = { FR_NAMES, COUNTRIES_REG, _isSciAliasSource, _verdictPaysEspece, _chargerDonneesPays, _chargerEspeceMonde };
`;
const prefixes = fs.readdirSync('data/especes-monde').filter(f => f.endsWith('.json')).map(f => f.slice(0, -5));
const nav = await chromium.launch();
const ctx = await nav.newContext({ serviceWorkers: 'block' });
await ctx.route(u => u.pathname.endsWith('/app.js'), async route => {
  const rep = await route.fetch();
  route.fulfill({ response: rep, body: (await rep.text()) + EXPORTS, headers: { ...rep.headers(), 'content-type': 'application/javascript; charset=utf-8' } });
});
const p = await ctx.newPage();
await p.goto(`http://localhost:${port}/demo/`, { waitUntil: 'load' });
await p.waitForFunction(() => window.__bdx, null, { timeout: 30000 });
const res = await p.evaluate(async ({ candidats, prefixes, rare }) => {
  const B = window.__bdx;
  await Promise.all([B._chargerDonneesPays(), ...prefixes.map(k => B._chargerEspeceMonde(k))]);
  const tous = Object.keys(B.COUNTRIES_REG);
  const especes = Object.keys(B.FR_NAMES).filter(s => !B._isSciAliasSource(s));
  const out = {};
  for(const cc of candidats){
    if(!B.COUNTRIES_REG[cc]){ out[cc] = { absent: true, propres: [] }; continue; }
    const propres = [];
    for(const sci of especes){
      const v = B._verdictPaysEspece(sci, cc, null, true, true);
      if(!v || !(v.tier > 0) || v.isExoLocal) continue;
      let ailleurs = true;
      for(const c2 of tous){
        if(c2 === cc) continue;
        const w = B._verdictPaysEspece(sci, c2, null, true, true);
        if(w && w.tier > 0 && w.tier < rare){ ailleurs = false; break; }
      }
      if(ailleurs) propres.push([B.FR_NAMES[sci] || sci, v.tier]);
    }
    out[cc] = { propres };
  }
  return out;
}, { candidats, prefixes, rare: PALIER_RARE_AILLEURS });
await nav.close();
const sansRarete = {};
for(const cc of candidats.sort((a, b) => total(a) - total(b))){
  const r = res[cc];
  if(r.propres.length) console.log('GARDE   ', cc, total(cc), 'listes :', r.propres.map(([n, t]) => `${n} (palier ${t})`).join(', '));
  else { sansRarete[cc] = total(cc); console.log('SANS    ', cc, total(cc), 'listes', r.absent ? '(pays absent du site)' : ''); }
}
console.log(Object.keys(sansRarete).length, 'pays sans rarete. A recopier dans app.js :');
console.log('const PAYS_SANS_RARETE = ' + JSON.stringify(sansRarete) + ';');
