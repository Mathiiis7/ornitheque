/*
  Le panneau « Ou et quand la trouver » et sa machine a etats : deux cartes qui se relaient
  sous des onglets, un graphique qui n'accompagne que l'une des deux, une legende qui suit.

  CE QU'IL A DEJA RATE
  - la legende restait celle de la rarete apres un clic sur l'onglet du statut ;
  - le graphique restait affiche sous la carte des statuts, ou il se lisait comme sa legende ;
  - une espece qui n'a QUE la carte des statuts n'a aucun onglet, et l'ancien test - fonde
    sur la preference de l'utilisateur et non sur ce qui est affiche - lui laissait ses barres.
*/
import { page, fonctions, constante } from './_banc.mjs';

export const nom = 'panneau';
export const titre = 'Panneau a onglets';
export const quoi = 'quelle carte s affiche, le graphique, la légende';

export function html(){
  const source = fonctions('esc', 'realColor', '_vueCarte', '_carteExoAffichee', '_bulleSiCoupe',
    'libelleExo', '_majEnteteOuQuand', '_majOngletsOuQuand', '_majPanneauOuQuand', '_legendeOuQuand')
    + '\n' + constante('EXOTIC_CATEGORY_LABEL');

  const CAS = [
    { nom: 'les deux cartes', rar: 1, exo: 1, graph: 1, national: 1 },
    { nom: 'sauvage, échappés locaux', rar: 1, exo: 1, graph: 1, national: 0 },
    { nom: 'rareté seule', rar: 1, exo: 0, graph: 1 },
    { nom: 'exotique seule', rar: 0, exo: 1, graph: 1, national: 1 },
    { nom: 'graphique seul', rar: 0, exo: 0, graph: 1 },
    { nom: 'rien du tout', rar: 0, exo: 0, graph: 0 },
  ];
  const SQUELETTE = [
    '<div class="sm-card" id="smOuQuandCard" hidden>',
    '  <div class="sm-card-title">Où et quand la trouver <span class="sm-freq-src" id="smFreqSrc"></span></div>',
    '  <div class="sm-oq-bloc"><div class="sm-oq-entete">',
    '    <span class="sm-oq-zone" id="smOqZone"></span>',
    '    <span class="sm-oq-onglets" id="smOqOnglets"></span>',
    '  </div><div id="smRarityMap"></div><div id="smExoticMap" hidden></div></div>',
    '  <div id="smGraphZone"><div class="sm-freq-chart-wrap" style="height:60px"></div></div>',
    '  <div class="sm-freq-legend" id="smOuQuandLegende"></div>',
    '</div>',
  ].join('');

  return page({
    titre,
    styleEnPlus: '  .species-modal { display:block; position:static; max-width:560px; }\n'
      + '  .sm-card { background:#fff; border-radius:12px; padding:12px; margin-bottom:6px; }\n'
      + '  .fausse { height:70px; display:grid; place-items:center; color:#888; font:12px system-ui; }',
    corps: '<div class="species-modal" id="scene"></div>',
    source,
    script: `
const CAS = ${JSON.stringify(CAS)};
const SQUELETTE = ${JSON.stringify(SQUELETTE)};
const scene = document.getElementById('scene');

for (const c of CAS) {
  window._smCarteVue = 'rarete';
  window._oqPortee = { zoneWord: 'département', sansDecoupage: false };
  window._oqExoNational = !!c.national;
  window._oqNoteExo = (c.exo && !c.national) ? 'exotique dans 2 départements' : '';
  window._oqExoNatif = false;
  window._oqScore = '';
  window._oqStatutExo = c.national ? '<span class="pkdx-exo">N</span>' : '';
  scene.insertAdjacentHTML('beforeend', '<h3>' + c.nom + '</h3>' + SQUELETTE);
  const card = document.getElementById('smOuQuandCard');
  document.getElementById('smRarityMap').innerHTML = c.rar ? '<div class="fausse">carte de rareté</div>' : '';
  document.getElementById('smExoticMap').innerHTML = c.exo ? '<div class="fausse">carte des statuts</div>' : '';
  const g = document.getElementById('smGraphZone');
  g.dataset.plein = c.graph ? '1' : '0';
  g.hidden = !c.graph;
  _majEnteteOuQuand('France');
  _majPanneauOuQuand();

  const onglets = card.querySelectorAll('.sm-oq-onglet');
  const rarVu = !document.getElementById('smRarityMap').hidden;
  const exoVu = !document.getElementById('smExoticMap').hidden;
  const graphVu = !g.hidden;

  verif(c.nom + ' — panneau', card.hidden ? 'masqué' : 'visible',
    card.hidden === !(c.rar || c.exo || c.graph));
  verif(c.nom + ' — onglets', onglets.length, onglets.length === ((c.rar && c.exo) ? 2 : 0));
  verif(c.nom + ' — une seule carte', (rarVu ? 'rareté' : exoVu ? 'statuts' : 'aucune'),
    !(rarVu && exoVu) && (!c.rar || rarVu) && (!c.rar && c.exo ? exoVu : true));
  // Le graphique mesure une frequence : il n'a rien a faire sous la carte des statuts.
  verif(c.nom + ' — graphique', graphVu ? 'visible' : 'masqué',
    c.graph ? (graphVu === !exoVu) : !graphVu);

  if (onglets.length === 2) {
    const avant = document.getElementById('smOuQuandLegende').textContent;
    onglets[1].click();
    const apres = document.getElementById('smOuQuandLegende').textContent;
    verif(c.nom + ' — bascule vers les statuts',
      document.getElementById('smExoticMap').hidden ? 'carte absente' : 'carte affichée',
      !document.getElementById('smExoticMap').hidden && document.getElementById('smRarityMap').hidden);
    verif(c.nom + ' — légende suit', apres === avant ? 'inchangée' : 'change',
      apres !== avant && /introduit établi/.test(apres));
    verif(c.nom + ' — barres retirées',
      document.getElementById('smGraphZone').hidden ? 'masquées' : 'visibles',
      document.getElementById('smGraphZone').hidden);
    // Les onglets sont reecrits a chaque bascule : on reprend celui qui est affiche.
    card.querySelectorAll('.sm-oq-onglet')[0].click();
    verif(c.nom + ' — retour, barres revenues',
      document.getElementById('smGraphZone').hidden ? 'masquées' : 'visibles',
      !document.getElementById('smGraphZone').hidden);
  }
  for (const e of card.querySelectorAll('[id]')) e.removeAttribute('id');
  card.removeAttribute('id');
}
fini();`,
  });
}
