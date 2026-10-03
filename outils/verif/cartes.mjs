/*
  Les encarts des cartes : la loupe sur la Petite couronne, les Acores, les Shetland.

  CE QU ILS ONT DEJA RATE
  Le nom de l'encart etait pose dans un <g pointer-events="none"> qu'on avait oublie de
  fermer. Le navigateur le referme a la fin du parent : les quatre departements de la loupe
  se retrouvaient dedans et heritaient de son pointer-events. La loupe s'affichait, mais rien
  n'y etait cliquable - et aucune erreur nulle part.

  Le banc tire des points au hasard dans le cadre de l'encart et demande au navigateur ce
  qu'il y a dessous. C'est la seule facon de le savoir : le DOM, lui, a l'air normal.
*/
import { page, fonctions, constante, RACINE } from './_banc.mjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const nom = 'cartes';
export const titre = 'Encarts des cartes';
export const quoi = 'nom au-dessus du cadre, départements cliquables';

export function html(){
  const source = [
    constante('_ENCART_CARTE'), constante('_ZONES_ENCART'),
    fonctions('esc', '_HAUT_LEGENDE', '_bboxChemins', '_boitesEncarts', '_cadresEncarts',
      '_cadreEncartApp', '_viewBoxAvecEncarts', '_viewBoxCarte', '_styleCarte', '_encartCarte',
      '_unEncart', '_reposerIles', '_pathZone', '_codesEnEncart', '_ordonnerSelectionDevant'),
    constante('_CORPS_ENCART_APP'), constante('_COLONNE_CARTE'), constante('_BOITE_CARTE'),
    'const _viewBoxTightCache = {};',
  ].join('\n\n');

  const dep = JSON.parse(readFileSync(join(RACINE, 'data', 'departements-fr-simplified.json'), 'utf8'));

  return page({
    titre,
    styleEnPlus: '  .banc { background:#fff; padding:10px; border-radius:10px; display:inline-block; }',
    corps: '<div class="banc" id="banc"></div>',
    source: `const DEP = ${JSON.stringify({ viewBox: dep.viewBox, zones: dep.deps })};\n` + source,
    script: `
const paths = { viewBox: DEP.viewBox, zones: DEP.zones };
const zonesSelectionnables = new Set(Object.keys(DEP.zones));
const selection = new Set();
const rendreZone = (z, echelle, dRemplace) => _pathZone(
  dRemplace || DEP.zones[z].path, '#86efac', DEP.zones[z].name || z,
  selection.has(z), selection.size > 0, zonesSelectionnables.has(z) ? z : null, echelle);
const horsCarte = _codesEnEncart('FR');
const zones = Object.keys(DEP.zones).filter(z => !horsCarte || !horsCarte.has(z));
document.getElementById('banc').innerHTML =
  '<svg id="carte" viewBox="' + _viewBoxCarte('FR', paths) + '" style="' + _styleCarte()
  + '" preserveAspectRatio="xMidYMid meet">'
  + _ordonnerSelectionDevant(zones, selection).map(z => rendreZone(z, 1)).join('')
  + _encartCarte('FR', paths, rendreZone) + _cadresEncarts('FR', paths) + '</svg>';

setTimeout(() => {
  const svg = document.getElementById('carte');
  const cfgs = _ENCART_CARTE.FR || [];

  // 1. Chaque departement de l'encart porte bien un data-zone.
  for (const cfg of cfgs) {
    const sans = cfg.codes.filter(c => !svg.querySelector('[data-zone="' + c + '"]'));
    verif('« ' + cfg.titre + ' » : codes posés', sans.length ? sans.join(' ') : cfg.codes.length + ' sur ' + cfg.codes.length, !sans.length);
  }

  // 2. Le nom de l'encart est AU-DESSUS de son cadre, pas dedans.
  for (const cfg of cfgs.filter(c => c.titre)) {
    const cadre = _cadreEncartApp(cfg);
    const t = [...svg.querySelectorAll('text')].find(e => e.textContent.trim() === cfg.titre);
    verif('« ' + cfg.titre + ' » : nom au-dessus',
      t ? (+t.getAttribute('y')).toFixed(1) + ' vs cadre ' + cadre.y.toFixed(1) : 'introuvable',
      !!t && +t.getAttribute('y') < cadre.y);
  }

  // 3. Et surtout : qu'y a-t-il SOUS le curseur, dans le cadre ?
  const vb = svg.viewBox.baseVal, r = svg.getBoundingClientRect();
  const k = Math.min(r.width / vb.width, r.height / vb.height);
  const ox = r.left + (r.width - vb.width * k) / 2, oy = r.top + (r.height - vb.height * k) / 2;
  for (const cfg of cfgs) {
    const cadre = _cadreEncartApp(cfg);
    let touches = 0; const trouves = new Set();
    for (let i = 1; i <= 6; i++) for (let j = 1; j <= 6; j++) {
      const px = ox + (cadre.x + cadre.w * i / 7 - vb.x) * k;
      const py = oy + (cadre.y + cadre.h * j / 7 - vb.y) * k;
      const el = document.elementFromPoint(px, py);
      const z = el && el.closest ? el.closest('[data-zone]') : null;
      if (z) { touches++; trouves.add(z.dataset.zone); }
    }
    verif('« ' + (cfg.titre || cfg.codes[0]) + ' » : cliquable',
      touches + '/36 points, ' + trouves.size + ' zone(s)', touches > 0 && trouves.size > 0);
  }
  note('');
  note('(36 points tirés en grille dans chaque cadre ; ceux qui tombent entre deux');
  note(' départements ne touchent rien, c est normal — seul un zéro franc est un défaut)');
  fini();
}, 400);`,
  });
}
