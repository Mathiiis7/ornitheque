// Fabrique la mascotte (martin-pêcheur) à partir des deux planches Arrow 2 retenues le 2026-10-05 :
// les poses de la planche 4 (plus détaillées), la tuile de la planche 3 (le bec se lit en petit).
//   node outils/build/mascotte.mjs
// Lit notes-privees/mascotte/planche-3.svg et planche-4.svg, écrit dans notes-privees/mascotte/ :
//   mascotte-poses.svg, mascotte-tuile.svg
// Trois retouches :
//   1. les couleurs sont recalées sur celles de la charte (docs/charte-graphique.md), les deux
//      planches ayant chacune leur propre bleu-vert et leur propre orange ;
//   2. les fentes entre deux formes (le fond passait au travers) sont bouchées : chaque forme est
//      recopiée DESSOUS avec un trait de sa propre couleur, l'original reste dessus, bords nets ;
//   3. la tuile de la planche 4 est retirée des poses, celle de la planche 3 est découpée seule.
import fs from 'node:fs';

const DOS = 'notes-privees/mascotte/';

// Couleur d'Arrow 2 -> couleur de la charte. Les ombres gardent un ton plus sombre que l'aplat.
const COULEURS = {
  // bleu-vert principal -> --accent
  '#157b7d': '#0b7c77', '#0f7375': '#0b7c77', '#197d7d': '#0b7c77', '#127777': '#0b7c77',
  // bleu-vert sombre (queue, dessous d'aile)
  '#157373': '#086660', '#146e6e': '#086660',
  // bleu-vert clair -> accent du thème sombre
  '#26bdb5': '#2bbcb0', '#29b9af': '#2bbcb0',
  // orange -> --accent-2
  '#d2763e': '#c05e33', '#c26937': '#c05e33', '#c26b3a': '#c05e33', '#c7703d': '#c05e33', '#d98146': '#c05e33',
  // orange sombre (pattes en arrière-plan)
  '#c46234': '#9e4523', '#be5d31': '#9e4523', '#bc653b': '#9e4523', '#994f27': '#9e4523',
  '#995632': '#9e4523', '#99512d': '#9e4523', '#844626': '#9e4523',
  // blanc cassé de la gorge
  '#f4e8d6': '#f0eee6', '#f7f1e3': '#f0eee6', '#f7f0e0': '#f0eee6', '#f9f2e8': '#f0eee6', '#e1c1a4': '#f0eee6',
  // noir du bec et de l'œil -> encre de la charte
  '#151617': '#15201e', '#0a0a0a': '#15201e', '#0b0b0b': '#15201e', '#182827': '#15201e',
  '#1a2a2a': '#15201e', '#1b2d2d': '#15201e', '#1a2727': '#15201e', '#2a2c2d': '#15201e',
  '#163030': '#15201e', '#122423': '#15201e', '#182d2d': '#15201e',
  '#373a3d': '#33403d', // reflet du bec, un ton au-dessus de l'encre
  // or des jumelles et du carnet -> --gold et ses tons
  '#bc8c2d': '#b98d22', '#c99e3a': '#b98d22', '#b98633': '#b98d22', '#b98533': '#b98d22',
  '#c48d2e': '#b98d22', '#c18d42': '#c9a03e', '#c18c45': '#c9a03e',
  '#b58330': '#9a7419', '#9e6c2b': '#9a7419', '#a2702d': '#9a7419',
};

const recolore = (s) => s.replace(/#[0-9a-fA-F]{6}\b/g, (c) => COULEURS[c.toLowerCase()] ?? c);

// Le trait de bouchage : 0,5 unité sur 80, soit 0,6 % de la largeur. Assez pour fermer les
// fentes mesurées sur fond magenta, trop fin pour épaissir la silhouette à l'œil.
const TRAIT = 0.5;
const sousCouche = (formes) => formes
  .filter((l) => /^\s*<(path|circle|ellipse)\b/.test(l) && /fill="#[0-9a-fA-F]{6}"/.test(l))
  .map((l) => {
    const fill = l.match(/fill="(#[0-9a-fA-F]{6})"/)[1];
    return l.replace(/\s*\/>\s*$/, ` stroke="${fill}" stroke-width="${TRAIT}" stroke-linejoin="round"/>`);
  });

// La sous-couche déborde aussi sur le bord extérieur, ce qui dessinait un liseré autour du ventre
// de l'oiseau en plongée - un contour, que la charte interdit. Elle est donc masquée par la
// silhouette « fermée » (dilatée puis érodée d'autant) : les fentes intérieures sont dans le
// masque, l'extérieur n'y est pas.
// Pas de feMorphology : son tampon est CARRÉ, et il rendait en escalier les bouts de plumes et
// les doigts. Ici on dilate et on érode par un flou suivi d'un seuil, ce qui fait un tampon rond.
// Pour un flou d'écart σ, le seuil 0,1 avance le bord d'environ 1,3 σ, le seuil 0,9 le recule d'autant ; la pente de 50 garde un bord net (à 10, il restait un halo flou au creux des plumes).
const SIGMA = (TRAIT / 1.3).toFixed(3);
const masque = (formes) => [
  '<defs>',
  '<filter id="ferme" x="-5%" y="-5%" width="110%" height="110%">'
    + `<feGaussianBlur stdDeviation="${SIGMA}"/><feComponentTransfer><feFuncA type="linear" slope="50" intercept="-5"/></feComponentTransfer>`
    + `<feGaussianBlur stdDeviation="${SIGMA}"/><feComponentTransfer><feFuncA type="linear" slope="50" intercept="-45"/></feComponentTransfer>`
    + '</filter>',
  '<mask id="silhouette" maskUnits="userSpaceOnUse" x="-10" y="-10" width="100" height="100"><g filter="url(#ferme)">',
  ...formes.filter((l) => /^\s*<(path|circle|ellipse)\b/.test(l) && /fill="#/.test(l)).map((l) => l.replace(/fill="#[0-9a-fA-F]+"/, 'fill="#fff"')),
  '</g></mask>',
  '</defs>',
];

function lignes(fichier) {
  return fs.readFileSync(DOS + fichier, 'utf8').split(/\r?\n/);
}

function ecris(fichier, viewBox, fond, formes) {
  const corps = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">`,
    '<!-- Mascotte de L\'Ornithèque. Dessin : Arrow 2 (QuiverAI), retouché par outils/build/mascotte.mjs -->',
    ...(fond ? [fond] : []),
    ...masque(formes),
    '<g mask="url(#silhouette)">', ...sousCouche(formes), '</g>',
    '<g>', ...formes, '</g>',
    '</svg>', '',
  ].join('\n');
  fs.writeFileSync(DOS + fichier, recolore(corps));
  console.log(fichier, (corps.length / 1024).toFixed(1), 'Ko');
}

// Planche 4 : lignes 1-4 = en-tête et fonds, 5-17 = sa tuile (écartée), 18 et après = les poses.
const p4 = lignes('planche-4.svg');
if (!p4[4].includes('m77.33 56.6') || !p4[17].includes('m58.28 43.84')) throw new Error('planche-4.svg a changé : revoir les numéros de ligne');
const poses = p4.slice(17).filter((l) => !l.includes('</svg>') && l.trim());
ecris('mascotte-poses.svg', '0 0 80 80', null, poses);

// Planche 3 : ligne 5 = le carré blanc de la tuile, 6-14 = la tête.
const p3 = lignes('planche-3.svg');
if (!p3[4].includes('x="55.03"') || !p3[13].includes('m57.97 67.68')) throw new Error('planche-3.svg a changé : revoir les numéros de ligne');
const tuile = p3.slice(5, 14);
// Le carré se cale sur le côté le plus court (22,78) : la tuile reste carrée.
ecris('mascotte-tuile.svg', '55.03 49.8 22.78 22.78', '<rect x="55.03" y="49.8" width="22.78" height="22.85" fill="#fff"/>', tuile);
