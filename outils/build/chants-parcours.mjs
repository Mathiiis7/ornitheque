#!/usr/bin/env node
/*
  chants-parcours.mjs - preselectionne les chants candidats du parcours du quiz, pour que
  Mathis les ecoute et garde les bons (notes-privees/ecoute-chants/index.html).

      node outils/build/chants-parcours.mjs

  Pourquoi (2026-10-15) : le quiz prenait les 8 chants notes A les plus recents de
  xeno-canto, sans rien ecarter. Sur les 40 des cinq especes : des oiseaux du parcours en
  fond (une noire avec bleue et pouillot), une nonnette de Coree, deux noires du Maroc, des
  pistes « cri et chant », et 7 bleues sur 8 du meme enregistreur.

  Filtres : chant seul (type exactement « song »), qualite A puis B si besoin, Europe de
  l'Ouest hors peninsule iberique (le pouillot iberique y chante et s'y confond), aucune
  des cinq especes du parcours en fond, 8 s a 3 min, un seul enregistrement par personne.
  Tri : France d'abord, puis sans aucun autre oiseau en fond, puis qualite, puis le plus
  recent. 15 candidats par espece.
*/
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SORTIE = join(RACINE, 'notes-privees', 'ecoute-chants', 'candidats.json');
const CLE = 'a082ff6c2adafb02ea6b275da67cd903988f82ea';   // la cle publique d'app.js (XC_API_KEY)
const ESPECES = ['parus major', 'phylloscopus collybita', 'cyanistes caeruleus', 'poecile palustris', 'periparus ater'];
const PAYS = new Set(['France', 'Belgium', 'Switzerland', 'Luxembourg', 'Germany', 'Netherlands',
  'United Kingdom', 'Ireland', 'Italy', 'Austria', 'Denmark']);
const PAR_ESPECE = 15;

const norm = u => !u ? null : u.startsWith('//') ? 'https:' + u : u.replace(/^http:\/\//, 'https://');
const secondes = s => { const [m, ss] = String(s || '0:00').split(':').map(Number); return (m || 0) * 60 + (ss || 0); };

async function tout(gen, sp, q){
  const out = [];
  for(let page = 1; page <= 10; page++){
    const query = ['gen:' + gen, 'sp:' + sp, 'type:song', 'q:' + q].join(' ');
    const r = await fetch('https://xeno-canto.org/api/3/recordings?query=' + encodeURIComponent(query) + '&per_page=500&page=' + page + '&key=' + CLE);
    const j = await r.json();
    out.push(...(j.recordings || []));
    if(page >= (j.numPages || 1)) break;
  }
  return out;
}

const res = {};
for(const sci of ESPECES){
  const [gen, sp] = sci.split(' ');
  let brut = await tout(gen, sp, 'A');
  const garder = r => {
    if(!r.file || r.type !== 'song' || !PAYS.has(r.cnt)) return false;
    const autres = (r.also || []).filter(Boolean).map(s => s.toLowerCase());
    if(autres.some(a => ESPECES.includes(a))) return false;
    const d = secondes(r.length);
    return d >= 8 && d <= 180;
  };
  let ok = brut.filter(garder);
  if(new Set(ok.map(r => r.rec)).size < PAR_ESPECE) ok.push(...(await tout(gen, sp, 'B')).filter(garder));
  const qOrdre = { A: 2, B: 1 };
  ok.sort((a, b) => (b.cnt === 'France') - (a.cnt === 'France')
    || ((a.also || []).filter(Boolean).length === 0 ? -1 : 0) - ((b.also || []).filter(Boolean).length === 0 ? -1 : 0)
    || (qOrdre[b.q] || 0) - (qOrdre[a.q] || 0)
    || (+b.id) - (+a.id));
  const vus = new Set(), choisis = [];
  for(const r of ok){
    if(vus.has(r.rec)) continue;
    vus.add(r.rec);
    choisis.push({ id: r.id, file: norm(r.file), sono: norm(r.sono?.large || r.sono?.med || r.sono?.small),
      q: r.q, cnt: r.cnt, loc: r.loc, length: r.length, rec: r.rec, date: r.date,
      also: (r.also || []).filter(Boolean), url: 'https://xeno-canto.org/' + r.id });
    if(choisis.length >= PAR_ESPECE) break;
  }
  res[sci] = choisis;
  console.log(sci.padEnd(24), 'qualite A :', String(brut.length).padStart(4), ' gardes :', choisis.length,
    ' dont France :', choisis.filter(r => r.cnt === 'France').length);
}
mkdirSync(dirname(SORTIE), { recursive: true });
writeFileSync(SORTIE, JSON.stringify(res, null, 1));
console.log('ecrit', SORTIE);
