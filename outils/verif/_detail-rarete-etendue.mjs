// D'ou vient la rarete d'un continent ou du monde pour une espece (2026-11-11) : la part de chaque pays dans la
// moyenne (surface plafonnee a 10 %), sa valeur, et le nombre approche de ses listes eBird (l'effort mensuel est
// stocke en parts : 1 / la plus petite part donne l'ordre de grandeur).
// Usage : node outils/verif/_detail-rarete-etendue.mjs "pycnonotus sinensis" Asie [port]
import { chromium } from 'playwright';
const [sci = 'pycnonotus sinensis', echelle = 'Monde', port = '8765'] = process.argv.slice(2);
const EXPORTS = `
;window.__bdx = { COUNTRIES_REG, _continentDuPays, _verdictPaysEspece, _chargerDonneesPays, _chargerAiresPays, _chargerEspeceMonde,
  EFFORT_MENSUEL_PAR_PAYS, get airesPays(){ return _airesPays; } };
`;
const nav = await chromium.launch();
const ctx = await nav.newContext({ serviceWorkers: 'block' });
await ctx.route(u => u.pathname.endsWith('/app.js'), async route => {
  const rep = await route.fetch();
  route.fulfill({ response: rep, body: (await rep.text()) + EXPORTS, headers: { ...rep.headers(), 'content-type': 'application/javascript; charset=utf-8' } });
});
const p = await ctx.newPage();
await p.goto(`http://localhost:${port}/demo/`, { waitUntil: 'load' });
await p.waitForFunction(() => window.__bdx, null, { timeout: 30000 });
const r = await p.evaluate(async ({ sci, echelle }) => {
  const B = window.__bdx;
  await Promise.all([B._chargerDonneesPays(), B._chargerAiresPays(), B._chargerEspeceMonde(sci)]);
  const A = B.airesPays, lignes = []; let total = 0;
  for(const cc of Object.keys(B.COUNTRIES_REG)){
    if(!(A[cc] > 0) || (echelle !== 'Monde' && B._continentDuPays(cc) !== echelle)) continue;
    const v = B._verdictPaysEspece(sci, cc, null, true, true);
    if(!v || v.sansDonnees) continue;
    total += A[cc];
    const e = B.EFFORT_MENSUEL_PAR_PAYS[cc];
    const mini = e ? Math.min(...e.filter(x => x > 0)) : 0;
    lignes.push({ cc, aire: A[cc], an: v.tier > 0 ? v.vAn : 0, listes: mini ? Math.round(1 / mini) : null });
  }
  const plafond = 0.1 * total; let poids = 0;
  for(const l of lignes){ l.w = Math.min(l.aire, plafond); poids += l.w; }
  let somme = 0;
  for(const l of lignes){ l.part = l.w / poids; l.contrib = l.an * l.part; somme += l.contrib; }
  return { somme, nb: lignes.length, lignes: lignes.filter(l => l.an > 0).sort((a, b) => b.contrib - a.contrib).slice(0, 12) };
}, { sci, echelle });
console.log(`${sci} - ${echelle} : ${(r.somme * 100).toFixed(2)} % (${r.nb} pays comptes)`);
for(const l of r.lignes) console.log(`  ${l.cc}  poids ${(l.part * 100).toFixed(1).padStart(5)} %  valeur ${(l.an * 100).toFixed(1).padStart(5)} %  apport ${(l.contrib * 100).toFixed(2).padStart(5)} pt`);
await nav.close();
