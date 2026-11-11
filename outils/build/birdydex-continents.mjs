// La rarete de chaque espece par continent et pour le monde, calculee d'avance pour le Birdydex
// (Mathis, 2026-11-11 : « comme un pays »). La fiche la calcule en direct pour UNE espece
// (_rareteEtendue, app.js) ; pour TOUTES, il faudrait les 185 morceaux de data/especes-monde/
// (6,5 Mo). D'ou ce fichier, un par continent.
//
// LE MEME CALCUL QUE LA FICHE, par construction : le script ouvre le site dans un navigateur et
// appelle les fonctions d'app.js elles-memes (_verdictPaysEspece, _continentDuPays, _airesPays),
// rendues visibles par quelques lignes ajoutees a app.js au vol (rien n'est ecrit dans app.js).
// Puis il recoupe son resultat avec le vrai _rareteEtendue sur un echantillon : zero palier
// different, sinon il s'arrete sans rien ecrire.
//
// A RELANCER quand changent les morceaux de data/especes-monde/, data/freq_monthly_pays.json,
// data/rarity_pays.json, data/aires-pays.json ou la regle de _rareteEtendue : sinon le Birdydex
// et la fiche se contredisent sans bruit. Puis monter BIRDYDEX_CONTINENTS_V dans app.js.
//
// Sortie : data/birdydex-continents/<continent>.json = { sci: [valeur annuelle, drapeaux, "NPX"] }
//   valeur annuelle : part des listes, 0..1, arrondie sans changer de palier (annualFreqToTier)
//   drapeaux : 1 = reguliere dans au moins un pays du continent (_estReguliere), 2 = saisonniere
//              (_estSaisonniere sur les 12 mois du continent), 4 = exotique dans TOUS les pays ou
//              elle vit (aucune population sauvage sur le continent)
//   "NPX" : les statuts exotiques qu'elle porte dans au moins un pays du continent (absent si aucun)
// Usage : le site servi sur localhost (npx http-server . -p 8765 -c-1), puis
//   node outils/build/birdydex-continents.mjs [port]
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const port = process.argv[2] || '8765';
const SORTIE = 'data/birdydex-continents';
const EXPORTS = `
;window.__bdx = { FR_NAMES, COUNTRIES_REG, CARTES_CONTINENTS, _MOIS_COURTS, _isSciAliasSource, isParkOnlyExotic,
  _continentDuPays, _verdictPaysEspece, _rareteEtendue, _chargerDonneesPays, _donneesPaysPretes, _chargerAiresPays,
  _chargerEspeceMonde, annualFreqToTier, _estReguliere, exoticCategoryInCountry, _estSaisonniere,
  _countryHasSpecies, _especeMonde, EXOTIQUES_EBIRD_PAR_PAYS, _MOIS_MIN_X_VISIBLE,
  get airesPays(){ return _airesPays; }, get raretePays(){ return _RARETE_PAYS; } };
`;
const prefixes = fs.readdirSync('data/especes-monde').filter(f => f.endsWith('.json')).map(f => f.slice(0, -5));

const nav = await chromium.launch();
// Le service worker servirait son app.js en cache, sans les lignes ajoutees.
const ctx = await nav.newContext({ serviceWorkers: 'block' });
await ctx.route(/\/app\.js(\?.*)?$/, async route => {
  const rep = await route.fetch();
  route.fulfill({ response: rep, body: (await rep.text()) + EXPORTS,
    headers: { ...rep.headers(), 'content-type': 'application/javascript; charset=utf-8' } });
});
const p = await ctx.newPage();
const erreurs = [];
p.on('pageerror', e => erreurs.push(e.message));
await p.goto(`http://localhost:${port}/demo/`, { waitUntil: 'load' });
await p.waitForFunction(() => window.__bdx, null, { timeout: 30000 });

const res = await p.evaluate(async (prefixes) => {
  const B = window.__bdx;
  await Promise.all([B._chargerDonneesPays(), B._chargerAiresPays(), ...prefixes.map(k => B._chargerEspeceMonde(k))]);
  if(!B._donneesPaysPretes() || !B.airesPays) return { erreur: 'donnees des pays ou surfaces absentes' };
  // Session neuve : aucun pays du monde lu (sinon sa frequence complete remplacerait le morceau arrondi
  // que lit la fiche). Les 48 pays des fichiers communs, eux, sont toujours lus.
  const mondeLus = Object.keys(B.COUNTRIES_REG).filter(cc => B.COUNTRIES_REG[cc].monde && B.raretePays[cc]);
  if(mondeLus.length) return { erreur: 'pays du monde deja lus : ' + mondeLus.join(' ') };
  const ECHELLES = Object.keys(B.CARTES_CONTINENTS);   // Monde + 7 continents
  const aires = B.airesPays;
  // Les membres de chaque echelle, exactement comme _rareteEtendue les choisit.
  const membres = {};
  for(const nom of ECHELLES) membres[nom] = Object.keys(B.COUNTRIES_REG)
    .filter(cc => aires[cc] > 0 && (nom === 'Monde' || B._continentDuPays(cc) === nom));
  const especes = Object.keys(B.FR_NAMES).filter(s => !B._isSciAliasSource(s));
  const sortie = Object.fromEntries(ECHELLES.map(n => [n, {}]));
  const ecartes = {}, horsGrille = new Set();
  const t0 = performance.now();
  for(const sci of especes){
    const key = sci.toLowerCase();
    // Une fois par pays : le verdict de l'annee, et les 12 mois si l'espece y est sauvage.
    const parPays = {};
    for(const cc of membres.Monde){
      const vA = B._verdictPaysEspece(key, cc, null, true, true);
      if(!vA || vA.sansDonnees) continue;
      const sauvage = vA.tier > 0;
      parPays[cc] = { an: sauvage ? vA.vAn : 0, sauvage, exo: vA.isExoLocal, absent: vA.absent,
        m12: B._MOIS_COURTS.map((_, mi) => sauvage ? ((B._verdictPaysEspece(key, cc, mi, true, true) || {}).vAn || 0) : 0) };
    }
    for(const nom of ECHELLES){
      let poidsTotal = 0;
      const lot = [];
      for(const cc of membres[nom]){ const x = parPays[cc]; if(!x) continue; lot.push([cc, x]); poidsTotal += aires[cc]; }
      if(!lot.length) continue;
      const plafond = 0.10 * poidsTotal;
      let poids = 0, an = 0; const m12 = Array(12).fill(0);
      for(const [cc, x] of lot){
        const w = Math.min(aires[cc], plafond);
        poids += w; an += x.an * w;
        for(let mi = 0; mi < 12; mi++) m12[mi] += x.m12[mi] * w;
      }
      an /= poids;
      if(!(an > 0)) continue;   // la fiche la dit « absente » : pas de case
      for(let mi = 0; mi < 12; mi++) m12[mi] /= poids;
      // Les pays ou elle vit : ceux qui ne la disent pas absente.
      const presents = lot.filter(([, x]) => !x.absent);
      // La grille d'un continent garde ce que la grille d'au moins un de ses pays montre : un echappe isole
      // (X sur moins de 6 mois, _isIsolatedXExotic) n'a de case nulle part, l'Emeu ouvrait l'Europe. Un
      // pays du monde pas encore lu se juge sur le morceau de l'espece, avec la meme regle des 6 mois.
      const dansUneGrille = presents.some(([cc]) => {
        if(B.raretePays[cc]) return B._countryHasSpecies(cc, sci);
        const vm = B._especeMonde(key, cc);
        if(!vm || !(vm[0] > 0)) return false;
        const x = B.EXOTIQUES_EBIRD_PAR_PAYS[cc] && B.EXOTIQUES_EBIRD_PAR_PAYS[cc][key];
        return x !== 'X' || vm.slice(1).filter(v => v > 0).length >= B._MOIS_MIN_X_VISIBLE;
      });
      if(!dansUneGrille){ ecartes[nom] = (ecartes[nom] || 0) + 1; horsGrille.add(nom + '|' + sci); continue; }
      const reguliere = presents.some(([cc]) => B._estReguliere(sci, cc));
      const exotique = presents.length > 0 && presents.every(([, x]) => x.exo);
      const cats = new Set();
      for(const [cc] of presents){ const c = B.exoticCategoryInCountry(sci, cc); if(c) cats.add(c); }
      // Parcs du monde entier (Bernache nene, flamants ornementaux) : gardes seulement s'ils vivent
      // ici en liberte ou s'y sont etablis, comme dans la grille d'un pays.
      if(B.isParkOnlyExotic(sci) && exotique && !cats.has('N') && !cats.has('P')){ horsGrille.add(nom + '|' + sci); continue; }
      // Arrondi : 3 chiffres significatifs, plus si le palier en changerait.
      const palier = B.annualFreqToTier(an);
      let arr = an;
      for(const d of [3, 4, 5, 6, 8, 12]){ const r = Number(an.toPrecision(d)); if(B.annualFreqToTier(r) === palier){ arr = r; break; } }
      const drap = (reguliere ? 1 : 0) | (B._estSaisonniere(m12, an) ? 2 : 0) | (exotique ? 4 : 0);
      const ord = ['N', 'P', 'X', 'C'].filter(c => cats.has(c)).join('');
      sortie[nom][sci] = ord ? [arr, drap, ord] : [arr, drap];
    }
  }
  const duree = Math.round(performance.now() - t0);
  // Recoupe avec le vrai _rareteEtendue, celui de la fiche : un echantillon d'especes, toutes les echelles.
  let compares = 0; const ecarts = [];
  const pas = Math.max(1, Math.floor(especes.length / 600));
  for(let i = 0; i < especes.length; i += pas){
    const sci = especes[i];
    for(const nom of ECHELLES){
      const r = B._rareteEtendue(sci, nom, true);
      const vrai = r && r.an > 0 ? B.annualFreqToTier(r.an) : 0;
      const e = sortie[nom][sci];
      const moi = e ? B.annualFreqToTier(e[0]) : 0;
      // Une espece ecartee volontairement (parc, echappe isole) n'est pas un ecart de calcul.
      if(moi !== vrai && !(moi === 0 && horsGrille.has(nom + '|' + sci))) ecarts.push([sci, nom, vrai, moi]);
      compares++;
    }
  }
  return { sortie, duree, compares, ecarts, ecartes, nbEspeces: especes.length };
}, prefixes);

await nav.close();
if(res.erreur){ console.log('ECHEC :', res.erreur); process.exit(1); }
console.log(`${res.nbEspeces} especes, calcul ${res.duree} ms ; recoupement avec _rareteEtendue : ${res.compares} couples, ${res.ecarts.length} ecart(s)`);
if(res.ecarts.length){
  for(const e of res.ecarts.slice(0, 20)) console.log('  ECART', e.join(' | '));
  console.log('RIEN ECRIT : le calcul ne concorde pas avec la fiche.');
  process.exit(1);
}
console.log('Echappes isoles ecartes (aucune grille de pays ne les montre) :', JSON.stringify(res.ecartes));
if(erreurs.length) console.log('Erreurs de la page (sans effet sur le calcul ?) :', erreurs.slice(0, 5).join(' | '));
fs.mkdirSync(SORTIE, { recursive: true });
const SLUG = { 'Monde': 'monde', 'Europe': 'europe', 'Amérique du Nord': 'amerique-du-nord', 'Amérique du Sud': 'amerique-du-sud',
  'Afrique': 'afrique', 'Asie': 'asie', 'Océanie': 'oceanie', 'Antarctique': 'antarctique' };
for(const [nom, table] of Object.entries(res.sortie)){
  const f = path.join(SORTIE, (SLUG[nom] || nom) + '.json');
  const txt = JSON.stringify(table);
  fs.writeFileSync(f, txt);
  console.log(`${nom.padEnd(17)} ${String(Object.keys(table).length).padStart(6)} especes  ${(txt.length / 1024).toFixed(0).padStart(5)} Ko  ${(zlib.gzipSync(txt).length / 1024).toFixed(0).padStart(4)} Ko gz`);
}
