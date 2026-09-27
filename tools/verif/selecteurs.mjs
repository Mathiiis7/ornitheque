/*
  Les trois selecteurs qui partagent la classe .cp-item : le choix du pays, celui des zones,
  et le selecteur generique (trier la grille, choisir un milieu, une famille).

  CE QU'ILS ONT DEJA RATE
  - « Par famille » rendu « P… » : le selecteur generique heritait de la grille a six
    colonnes du selecteur de pays, et son libelle tombait dans la colonne du drapeau ;
  - le compte d'especes ecrit dans deux tailles selon l'onglet, et trop long pour sa colonne,
    si bien qu'il passait sous la barre ;
  - les colonnes des deux onglets qui ne tombaient pas au meme pixel, ce qui faisait danser
    la barre et la pastille d'un onglet a l'autre.
*/
import { page, fonctions } from './_banc.mjs';

export const nom = 'selecteurs';
export const titre = 'Selecteurs de pays, de zones et de filtres';
export const quoi = 'libellés entiers, comptes homogènes, colonnes alignées';

export function html(){
  const source = fonctions('esc', 'realColor', 'tierChip', 'jetonExo', 'libelleExo')
    + "\nconst EXOTIC_CATEGORY_LABEL = { N:'Introduit établi', P:'Provisoire', X:'Échappé isolé' };";

  return page({
    titre,
    styleEnPlus: '  .cp-list { background:#fff; border-radius:10px; padding:6px; width:460px; }',
    corps: `<h3>sélecteur générique — trier la grille</h3><div class="cp-list" id="simple"></div>
<h3>pays, avec espèce courante</h3><div class="cp-list" id="p1"></div>
<h3>zones, avec espèce courante</h3><div class="cp-list" id="z1"></div>
<h3>pays, sans espèce</h3><div class="cp-list" id="p2"></div>
<h3>zones, sans espèce</h3><div class="cp-list" id="z2"></div>`,
    source,
    script: `
// La case des lettres, calculee sur le pays le plus charge : ici deux jetons.
for (const id of ['p1','z1','p2','z2'])
  document.getElementById(id).style.setProperty('--cp-exo', (2 * 16 + 3) + 'px');

// Le selecteur generique, tel que _openFilterPicker le rend.
document.getElementById('simple').innerHTML = ['Par famille','Par rareté','Par milieu']
  .map((l, i) => '<div class="cp-item cp-item-simple' + (i ? '' : ' on') + '">'
    + '<span class="cp-item-name">' + l + '</span></div>').join('');

const barre = (pct, coul) => '<div class="reg-picker-bar"><div style="width:' + pct + '%; color:' + coul + ';"></div></div>';
document.getElementById('p1').innerHTML = [['Royaume-Uni',['N'],'24 %',2],['Espagne',['N','X'],'17 %',2]]
  .map(([n, cats, v, t]) => '<div class="cp-item"><span class="cp-item-flag">🏳</span>'
    + '<span class="cp-item-name">' + n + '</span>'
    + '<span class="cp-item-exo">' + cats.map(c => jetonExo(c)).join('') + '</span>'
    + '<span class="reg-picker-val">' + v + '</span>' + barre(60, realColor(t))
    + tierChip(t, realColor(t), { cls: 'tier-rond' }) + '</div>').join('');
document.getElementById('z1').innerHTML = [['Seine-et-Marne','N','36 %',1],['Yvelines','','27 %',1]]
  .map(([n, cat, v, t]) => '<div class="reg-picker-item"><span>' + n + '</span>'
    + '<span class="reg-picker-exo">' + (cat ? jetonExo(cat) : '') + '</span>'
    + '<span class="reg-picker-val">' + v + '</span>' + barre(60, realColor(t))
    + tierChip(t, realColor(t), { cls: 'tier-rond' }) + '</div>').join('');
document.getElementById('p2').innerHTML = [['France',610],['États-Unis',1201],['Kosovo',219]]
  .map(([n, s]) => '<div class="cp-item sans-palier"><span class="cp-item-flag">🏳</span>'
    + '<span class="cp-item-name">' + n + '</span><span class="cp-item-exo"></span>'
    + '<span class="cp-item-meta">' + s + ' esp.</span>' + barre(Math.round(s / 1201 * 100), 'var(--accent)') + '</div>').join('');
document.getElementById('z2').innerHTML = [['Ain',283],['Bouches-du-Rhône',389],['Alpes-de-Haute-Provence',233]]
  .map(([n, s]) => '<div class="reg-picker-item sans-palier"><span>' + n + '</span>'
    + '<span class="reg-picker-exo"></span><span class="reg-picker-val">' + s + ' esp.</span>'
    + barre(Math.round(s / 389 * 100), 'var(--accent)') + '</div>').join('');

setTimeout(() => {
  const r = (e) => e.getBoundingClientRect();
  const gauche = (it, sel) => { const e = it.querySelector(sel); return e ? Math.round(r(e).left) : null; };

  // 1. Le selecteur generique : aucun libelle rabote.
  const rabotes = [...document.querySelectorAll('#simple .cp-item-name')]
    .filter(e => e.scrollWidth > e.clientWidth + 1).length;
  verif('libellés du filtre entiers', rabotes + ' rabotés', rabotes === 0);

  // 2. Le compte d especes : meme corps des deux cotes.
  const cm = getComputedStyle(document.querySelector('#p2 .cp-item-meta')).fontSize;
  const cv = getComputedStyle(document.querySelector('#z2 .reg-picker-val')).fontSize;
  verif('compte d espèces, même corps', cm + ' / ' + cv, cm === cv);

  // 3. Ni debordement de colonne, ni chevauchement avec la barre.
  const comptes = [...document.querySelectorAll('#p2 .cp-item-meta, #z2 .reg-picker-val')];
  verif('comptes dans leur colonne',
    comptes.filter(e => e.scrollWidth > e.clientWidth + 1).length + ' débordent',
    comptes.every(e => e.scrollWidth <= e.clientWidth + 1));
  const mord = [...document.querySelectorAll('#p2 .cp-item, #z2 .reg-picker-item')].filter(it => {
    const m = it.querySelector('.cp-item-meta, .reg-picker-val'), b = it.querySelector('.reg-picker-bar');
    return m && b && r(m).right > r(b).left + 0.5;
  }).length;
  verif('comptes à l écart de la barre', mord + ' mordent', mord === 0);

  // 4. Les deux onglets tombent au meme pixel, colonne par colonne.
  // La colonne de la valeur porte deux classes selon le cas - .reg-picker-val quand une
  // espece est choisie, .cp-item-meta quand on ne compte que les especes du pays - mais
  // c'est la MEME colonne de la grille, et elle doit tomber au meme pixel.
  const colonnes = [['lettre', '.cp-item-exo', '.reg-picker-exo'],
    ['valeur', '.reg-picker-val, .cp-item-meta', '.reg-picker-val, .cp-item-meta'],
    ['barre', '.reg-picker-bar', '.reg-picker-bar'], ['pastille', '.tier-chip', '.tier-chip']];
  for (const [cas, idP, idZ] of [['avec espèce', 'p1', 'z1'], ['sans espèce', 'p2', 'z2']]) {
    for (const [libelle, selP, selZ] of colonnes) {
      const vp = [...new Set([...document.querySelectorAll('#' + idP + ' > div')].map(it => gauche(it, selP)).filter(v => v != null))];
      const vz = [...new Set([...document.querySelectorAll('#' + idZ + ' > div')].map(it => gauche(it, selZ)).filter(v => v != null))];
      if (!vp.length && !vz.length) continue;
      verif(libelle + ', ' + cas, (vp.join('/') || '—') + ' vs ' + (vz.join('/') || '—'),
        vp.length === 1 && vz.length === 1 && vp[0] === vz[0]);
    }
  }
  fini();
}, 250);`,
  });
}
