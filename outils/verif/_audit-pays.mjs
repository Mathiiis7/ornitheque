// Audit (2026-11-10) : les données de chaque pays du site, à la recherche d'incohérences.
// Lit app.js (PAYS_MONDE, EFFORT_MENSUEL_PAR_PAYS, FR_NAMES) et data/. N'écrit que le rapport.
// Usage : node outils/verif/_audit-pays.mjs  -> %TEMP%/essai-monde/audit-pays.txt (+ résumé à l'écran)
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const R = new URL('../../', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
const app = readFileSync(R + 'app.js', 'utf8');
const lit = f => JSON.parse(readFileSync(R + f, 'utf8'));
const table = nom => JSON.parse(app.match(new RegExp(`^const ${nom} = (\\{.*\\}|\\[.*\\]);`, 'm'))[1]);
const MONDE = table('PAYS_MONDE'), SANS = new Set(table('PAYS_MONDE_SANS_ZONES'));
const EFFORT = table('EFFORT_MENSUEL_PAR_PAYS'), FR0 = table('FR_NAMES');
// SCI_ALIAS (app.js) : eBird écrit ses nouveaux noms latins, nos tables les anciens ; frName() passe par lui.
const blocAlias = app.slice(app.indexOf('const SCI_ALIAS = {'), app.indexOf('\n};', app.indexOf('const SCI_ALIAS = {')));
const ALIAS = Object.fromEntries([...blocAlias.matchAll(/^\s*['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/gm)].map(m => [m[1], m[2]]));
const FR = new Proxy(FR0, { get: (t, s) => t[s] || t[ALIAS[s]] });
const cartePays = new Set(lit('data/carte-pays.json').features.map(f => f.properties.cc));
const RARE = lit('data/rarity_pays.json'), FREQ = lit('data/freq_monthly_pays.json');
const morceaux = {};
const especeMonde = sp => { const k = sp.slice(0, 2); if (!(k in morceaux)) morceaux[k] = existsSync(R + `data/especes-monde/${k}.json`) ? lit(`data/especes-monde/${k}.json`) : {}; return morceaux[k][sp]; };

const lignes = [], comptes = {};
const defaut = (cc, type, detail) => { lignes.push(`${cc} ${(MONDE[cc] || [cc])[0]} | ${type} | ${detail}`); comptes[type] = (comptes[type] || 0) + 1; };

// Les fréquences et paliers communs à tous les pays.
function controleTables(cc, freq, rarete) {
  const sp = Object.keys(freq), rs = Object.keys(rarete);
  const sansPalier = sp.filter(s => !(s in rarete)), sansFreq = rs.filter(s => !(s in freq));
  if (sansPalier.length) defaut(cc, 'espèce avec fréquences mais sans palier', `${sansPalier.length} : ${sansPalier.slice(0, 4).join(', ')}`);
  if (sansFreq.length) defaut(cc, 'espèce avec palier mais sans fréquences', `${sansFreq.length} : ${sansFreq.slice(0, 4).join(', ')}`);
  const horsBornes = sp.filter(s => freq[s].some(v => typeof v !== 'number' || !isFinite(v) || v < 0 || v > 1));
  if (horsBornes.length) defaut(cc, 'fréquence hors de 0 à 1', `${horsBornes.length} : ${horsBornes.slice(0, 3).map(s => s + ' ' + JSON.stringify(freq[s])).join(' ; ')}`);
  const mauvaisMois = sp.filter(s => freq[s].length !== 12);
  if (mauvaisMois.length) defaut(cc, 'pas 12 mois', `${mauvaisMois.length}`);
  const zeros = sp.filter(s => freq[s].every(v => !v));
  if (zeros.length) defaut(cc, 'espèce à 0 tous les mois', `${zeros.length} : ${zeros.slice(0, 4).join(', ')}`);
  const paliers = new Set(Object.values(rarete));
  const bizarres = [...paliers].filter(p => !(Number.isInteger(p) && p >= 1 && p <= 10));
  if (bizarres.length) defaut(cc, 'palier inattendu', bizarres.join(', '));
  const sansNom = sp.filter(s => !FR[s]);
  if (sansNom.length) defaut(cc, 'espèce sans nom français', `${sansNom.length}/${sp.length} : ${sansNom.slice(0, 4).join(', ')}`);
  if (!EFFORT[cc]) defaut(cc, 'pas d\'effort mensuel', '');
  else if (EFFORT[cc].length !== 12 || EFFORT[cc].some(v => !(v >= 0))) defaut(cc, 'effort mensuel invalide', JSON.stringify(EFFORT[cc]));
  return sp.length;
}

// Les 48 pays d'avant (tables communes ; la France est en dur dans app.js).
for (const cc of Object.keys(RARE)) {
  if (!FREQ[cc]) { defaut(cc, 'pas de fréquences mensuelles', ''); continue; }
  controleTables(cc, FREQ[cc], RARE[cc]);
}

// Les 193 pays du monde.
for (const [cc, [nom, prep, continent, nbEsp]] of Object.entries(MONDE)) {
  const f = `data/countries/${cc.toLowerCase()}/pays.json`;
  if (!existsSync(R + f)) { defaut(cc, 'pays.json absent', f); continue; }
  const p = lit(f);
  const n = controleTables(cc, p.freq, p.rarete);
  if (Object.keys(p.rarete).length !== nbEsp) defaut(cc, 'nombre d\'espèces annoncé différent', `annoncé ${nbEsp}, fichier ${Object.keys(p.rarete).length} (fréquences ${n})`);
  if (!['en', 'au', 'aux', 'à'].includes(prep)) defaut(cc, 'préposition inattendue', prep);
  if (!cartePays.has(cc)) defaut(cc, 'pas de contour du pays (carte-pays.json)', '');
  // Le sélecteur de la fiche : chaque espèce du pays doit être dans son morceau, avec le bon palier.
  const absMorceau = Object.keys(p.freq).filter(s => !especeMonde(s)?.[cc]);
  if (absMorceau.length) defaut(cc, 'espèce absente des morceaux du sélecteur', `${absMorceau.length} : ${absMorceau.slice(0, 3).join(', ')}`);
  // Zones : noms, contours de la Carte et de la fiche.
  const zones = p.zones || [];
  if (zones.length && SANS.has(cc)) defaut(cc, 'des zones mais rangé « sans zones »', `${zones.length} zones`);
  if (!zones.length && !SANS.has(cc)) defaut(cc, 'sans zones mais pas rangé « sans zones »', '');
  const nonTraduits = zones.filter(z => !z.name || z.name === z.code);
  if (nonTraduits.length) defaut(cc, 'zone sans nom', nonTraduits.map(z => z.code).join(', '));
  const doublons = zones.map(z => z.name).filter((x, i, a) => a.indexOf(x) !== i);
  if (doublons.length) defaut(cc, 'deux zones du même nom', [...new Set(doublons)].join(', '));
  if (zones.length && !SANS.has(cc)) {
    const fc = `data/carte-zones/${cc.toLowerCase()}.json`;
    const carte = existsSync(R + fc) ? new Set(lit(fc).features.map(x => x.properties.ebird)) : null;
    if (!carte) defaut(cc, 'pas de fichier de zones pour la Carte', fc);
    else { const m = zones.filter(z => !carte.has(z.code)); if (m.length) defaut(cc, 'zone sans forme sur la Carte', m.map(z => `${z.code} ${z.name}`).join(', ')); }
    const ff = `data/regions-${cc.toLowerCase()}-simplified.json`;
    const fiche = existsSync(R + ff) ? new Set(Object.keys(lit(ff).regions)) : null;
    if (!fiche) defaut(cc, 'pas de carte de fiche', ff);
    else { const m = zones.filter(z => !fiche.has(z.code)); if (m.length) defaut(cc, 'zone sans forme sur la fiche', m.map(z => `${z.code} ${z.name}`).join(', ')); }
  }
  if (p.exoZones) { const codes = new Set(zones.map(z => z.code)); const m = Object.keys(p.exoZones).filter(z => !codes.has(z)); if (m.length) defaut(cc, 'exotiques d\'une zone inconnue', m.join(', ')); }
}

const d = join(tmpdir(), 'essai-monde'); mkdirSync(d, { recursive: true });
const f = join(d, 'audit-pays.txt');
writeFileSync(f, lignes.join('\n'));
console.log(lignes.length, 'remarques, par type :');
for (const [t, n] of Object.entries(comptes).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${t}`);
console.log('rapport', f);
