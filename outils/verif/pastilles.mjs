/*
  Les ronds de palier et de statut exotique : leur chiffre ou leur lettre doit etre centre.

  CE QU ILS ONT DEJA RATE
  Trois fois de suite. Centrer la BOITE du texte n'est pas centrer son ENCRE : pour une
  capitale ou un chiffre, l'encre va de la ligne de base a la hauteur de capitale, alors que
  la boite descend jusqu'a la descendante, que ces caracteres n'utilisent pas. L'ecart vaut
  (ascendante − descendante − hauteur de capitale) / 2, soit 0,064 em en Segoe UI, et il se
  voit : les lettres tombaient trop bas.

  On mesure donc l'ENCRE, dans le repere PROPRE de l'element - avant sa transformation et
  avant le zoom du corps, pour que rien n'ait a etre reconverti. C'est la qu'etaient mes
  erreurs : melanger les pixels ecran et les pixels CSS.
*/
import { page, fonctions } from './_banc.mjs';

export const nom = 'pastilles';
export const titre = 'Centrage dans les ronds';
export const quoi = 'l encre des chiffres et des lettres, pas la boîte du texte';

export function html(){
  return page({
    titre,
    styleEnPlus: '  .banc { background:#fff; padding:14px; border-radius:10px; display:flex; gap:14px; align-items:center; flex-wrap:wrap; }\n'
      + '  .loupe { zoom:6; width:120px; overflow:hidden; }',
    corps: `<div class="banc" id="banc"></div>
<h3>agrandi six fois</h3><div class="banc loupe" id="loupe"></div>`,
    source: fonctions('esc', 'realColor', 'tierChip'),
    script: `
const PALIERS = ['1','4','5','8','10'], LETTRES = ['N','P','X','C'];
const contenu = PALIERS.map(t => tierChip(t, '#7e8a99', { cls: 'tier-rond' })).join('')
  + LETTRES.map(c => '<span class="pkdx-exo">' + c + '</span>').join('');
document.getElementById('banc').innerHTML = contenu;
document.getElementById('loupe').innerHTML = contenu;

// Tout en pixels CSS de l'element lui-meme : offsetHeight ignore la transformation et le
// zoom, et les metriques du canvas parlent la meme langue. Aucune conversion, donc aucune
// occasion de se tromper de repere.
function ecartEncre(el) {
  const cs = getComputedStyle(el);
  const h = el.offsetHeight;
  const padH = parseFloat(cs.paddingTop) || 0, padB = parseFloat(cs.paddingBottom) || 0;
  const taille = parseFloat(cs.fontSize);
  const lh = cs.lineHeight === 'normal' ? null : parseFloat(cs.lineHeight);
  const cv = document.createElement('canvas').getContext('2d');
  cv.font = cs.fontWeight + ' ' + taille + 'px ' + cs.fontFamily;
  const m = cv.measureText(el.textContent);
  const asc = m.fontBoundingBoxAscent, desc = m.fontBoundingBoxDescent;
  const hauteurLigne = lh == null ? (asc + desc) : lh;
  const hautLigne = padH + ((h - padH - padB) - hauteurLigne) / 2;
  const base = hautLigne + (hauteurLigne - (asc + desc)) / 2 + asc;
  const centreEncre = base - (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
  return centreEncre - h / 2;   // positif = trop bas
}

setTimeout(() => {
  let pire = 0, pireQuoi = '';
  for (const el of document.querySelectorAll('#banc .tier-chip, #banc .pkdx-exo')) {
    const e = ecartEncre(el);
    if (Math.abs(e) > Math.abs(pire)) { pire = e; pireQuoi = el.textContent; }
    verif('« ' + el.textContent +' »', e.toFixed(3) + ' px', Math.abs(e) < 0.35);
  }
  note('');
  note('écart le plus fort : « ' + pireQuoi + ' » à ' + pire.toFixed(3) + ' px');
  note('(positif = encre trop basse ; le seuil de 0,35 px est celui en dessous duquel');
  note(' l écart ne se voit plus, la pastille étant peinte au double puis réduite de moitié)');
  fini();
}, 250);`,
  });
}
