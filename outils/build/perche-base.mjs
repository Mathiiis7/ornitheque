// Extrait le perché de la retouche n° 3 d'Arrow 2 (choisi par Mathis le 2026-10-05 comme pose de
// base de la mascotte) dans un fichier à lui seul, sans le reflet blanc dans l'œil.
//   node outils/build/perche-base.mjs
// Lit notes-privees/mascotte/retouche-3.svg, écrit notes-privees/mascotte/perche-base.svg.
import fs from 'node:fs';

const DOS = 'notes-privees/mascotte/';
const lignes = fs.readFileSync(DOS + 'retouche-3.svg', 'utf8').split(/\r?\n/);

// Le perché est la case en haut à gauche : ses formes commencent toutes dans x < 30, y < 26.
// On lit le premier point de chaque forme (« m x y » d'un chemin, ou cx/cy d'un cercle).
const depart = (l) => {
  // -?[\d.]+ et pas [-\d.]+ : dans « m6.81 21.59-0.16 », le signe moins commence le nombre suivant
  const m = l.match(/ d="m\s*(-?[\d.]+)[ ,]*(-?[\d.]+)/);
  if (m) return [+m[1], +m[2]];
  const cx = l.match(/cx="([-\d.]+)"/), cy = l.match(/cy="([-\d.]+)"/);
  return cx && cy ? [+cx[1], +cy[1]] : null;
};
const formes = lignes.filter((l) => {
  const p = depart(l);
  return p && p[0] < 30 && p[1] < 26; // 26 et pas 30 : le bout des ailes de l oiseau en vol commence vers y = 27,8
});

// Le reflet : le seul petit cercle blanc (rayon < 0,2) posé dans la pupille.
const sansReflet = formes.filter((l) => !(/<circle/.test(l) && /fill="#fff"/.test(l) && +l.match(/ r="([\d.]+)"/)[1] < 0.2));
console.log(formes.length, 'formes,', formes.length - sansReflet.length, 'reflet retiré');

fs.writeFileSync(DOS + 'perche-base.svg', [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="2 2 27 27">',
  ...sansReflet,
  '</svg>', '',
].join('\n'));
