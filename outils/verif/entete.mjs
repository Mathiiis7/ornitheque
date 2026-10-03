/*
  L'entete du panneau « Ou et quand la trouver » : le nom de zone, le jeton de statut
  exotique, le pourcentage, et les onglets.

  CE QU'ELLE A DEJA RATE
  - le nom et le chiffre posés a deux hauteurs differentes ;
  - le nom qui remontait de 2 px quand le chiffre disparaissait sur l'onglet du statut ;
  - une hauteur d'entete variable selon ce qu'elle portait, si bien que la pastille ANNEE de
    la colonne des mois tombait a trois endroits selon l'espece.
*/
import { page, fonctions, constante } from './_banc.mjs';

export const nom = 'entete';
export const titre = 'Entete du panneau';
export const quoi = 'nom de zone, jeton de statut, pourcentage, hauteur constante';

export function html(){
  const source = fonctions('esc', 'jetonExo', 'libelleExo', '_vueCarte', '_carteExoAffichee',
    '_bulleSiCoupe', '_majEnteteOuQuand') + '\n' + constante('EXOTIC_CATEGORY_LABEL');

  const cadre = (id, onglets, largeur = 520) => `<div class="species-modal" style="width:${largeur}px">
    <div style="background:#fff; border-radius:12px; padding:12px; margin-bottom:8px;">
      <div class="sm-oq-bloc"><div class="sm-oq-entete">
        <span class="sm-oq-zone" id="${id}"></span>
        ${onglets ? '<span class="sm-oq-onglets"><button class="sm-oq-onglet on">Rareté</button></span>' : ''}
      </div><div style="height:22px"></div></div></div></div>`;

  return page({
    titre,
    corps: `<h3>avec jeton et chiffre</h3>${cadre('z1', true)}
<h3>sans chiffre — onglet du statut exotique</h3>${cadre('z2', true)}
<h3>sans jeton ni onglets</h3>${cadre('z3', false)}
<h3>nom long, coupé</h3>${cadre('z4', false, 170)}`,
    source,
    script: `
const poser = (id, nomZone, avecScore, avecJeton) => {
  window._oqScore = avecScore ? '<b style="font-weight:700;color:var(--ink-2);">4\\u00A0%</b>' : '';
  window._oqStatutExo = avecJeton ? jetonExo('N') : '';
  const el = document.getElementById(id);
  el.id = 'smOqZone';
  _majEnteteOuQuand(nomZone);
  el.id = id;
  return el;
};
poser('z1', 'FRANCE', true, true);
poser('z2', 'FRANCE', false, true);
poser('z3', 'FRANCE', true, false);
poser('z4', 'PROVENCE-ALPES-COTE D AZUR', false, false);

setTimeout(() => {
  const r = (e) => e.getBoundingClientRect();
  const milieu = (e) => { const b = r(e); return b.top + b.height / 2; };
  const entete = (id) => document.getElementById(id).closest('.sm-oq-entete');

  // 1. Le nom et le chiffre au meme corps : sans ca, aucun alignement ne tient.
  const z1 = document.getElementById('z1');
  const nomEl = z1.querySelector('.sm-oq-nom'), score = z1.querySelector('.sm-oq-score');
  const cNom = getComputedStyle(nomEl).fontSize, cScore = score ? getComputedStyle(score).fontSize : '-';
  verif('corps du nom et du chiffre', cNom + ' / ' + cScore, cNom === cScore);

  // 2. Les trois centres - nom, jeton, chiffre - sur la meme horizontale.
  const jeton = z1.querySelector('.pkdx-exo');
  const ecarts = [Math.abs(milieu(nomEl) - milieu(jeton))];
  if (score) ecarts.push(Math.abs(milieu(nomEl) - milieu(score)));
  const pire = Math.max(...ecarts);
  verif('centres alignés', pire.toFixed(2) + ' px d écart', pire < 0.6);

  // 3. Le nom ne bouge pas quand le chiffre part.
  const base = (id) => {
    const el = document.getElementById(id).querySelector('.sm-oq-nom');
    const s = document.createElement('span');
    s.style.cssText = 'display:inline-block;width:0;height:0;overflow:hidden;';
    el.appendChild(s);
    const y = s.getBoundingClientRect().bottom - r(entete(id)).top;
    s.remove();
    return y;
  };
  const b1 = base('z1'), b2 = base('z2');
  verif('nom immobile sans le chiffre', b1.toFixed(2) + ' / ' + b2.toFixed(2),
    Math.abs(b1 - b2) < 0.4);

  // 4. Une seule hauteur d'entete, quelle que soit sa garniture.
  const h = ['z1', 'z2', 'z3', 'z4'].map(id => r(entete(id)).height);
  verif('hauteur constante', h.map(x => x.toFixed(1)).join(' / '),
    Math.max(...h) - Math.min(...h) < 0.4);

  // 5. L'infobulle du nom : seulement quand les points de suspension l ont ampute.
  const court = document.getElementById('z1').querySelector('.sm-oq-nom');
  const long = document.getElementById('z4').querySelector('.sm-oq-nom');
  verif('nom entier, pas d infobulle', court.hasAttribute('data-tip') ? 'posée' : 'absente',
    !court.hasAttribute('data-tip'));
  verif('nom coupé, infobulle posée', long.hasAttribute('data-tip') ? 'posée' : 'absente',
    long.hasAttribute('data-tip'));

  fini();
}, 250);`,
  });
}
