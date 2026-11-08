// Reporte dans les traits du cladogramme ce que Sangster et al. 2022 (Avian Research 13:100027,
// cosigne par G. Mayr) dit des groupes : leurs « Diagnostic apomorphies », ou l'absence de trait
// connu. Le texte est resume en francais, jamais recopie (licence CC BY-NC-ND).
// Extraits utilises : notes-privees/arbre/sources/sangster-2022-apomorphies.txt.
// Lancer depuis la racine : node outils/build/_traits-sangster.mjs
import fs from 'node:fs';
const F = 'notes-privees/maquettes/arbre/traits.json';
const T = JSON.parse(fs.readFileSync(F, 'utf8'));
const SANG = 'https://doi.org/10.1016/j.avrs.2022.100027';
const MAJ = {
  n2:  { trait: 'Creux profond au-dessus de la hanche', detail: 'Seul trait possible relevé : un creux profond entre la hanche et le bassin, visible chez tous sauf les tinamous.', statut: 'approx', src: SANG },
  n3:  { trait: 'Aile réduite, sans pouce', detail: 'Main presque sans os : plus de premier métacarpe ni d’alula (le « pouce » de l’aile), muscles de l’aile très réduits.', statut: 'source', src: SANG },
  n7:  { trait: 'Mâles sans pénis', detail: 'Les Néoaves ont perdu l’organe copulateur que gardent autruches, canards et gallinacés ; ils se sont aussi diversifiés très vite vers −66 millions d’années.', statut: 'source', src: SANG },
  n13: { trait: 'Vertèbres du dos soudées, os du bras à forte crête', detail: 'Les trois groupes ont des vertèbres du dos soudées et une crête très marquée sur l’humérus, là où s’attache un muscle du vol, même chez les mésites qui volent mal. Les auteurs jugent ce groupe difficile à définir.', statut: 'approx', src: SANG },
  n14: { trait: 'Os du pubis très fin', detail: 'Deux traits possibles : le bord arrière du sternum et un pubis réduit à un filet osseux.', statut: 'approx', src: SANG },
  n20: { trait: 'Lien tiré de l’ADN', detail: 'Phaétons, kagou, caurale et oiseaux d’eau : aucun trait anatomique connu, selon la revue de 2022.', statut: 'adn', src: SANG },
  n21: { trait: 'Lien tiré de l’ADN', detail: 'Aucun trait anatomique connu ; l’un des auteurs (Mayr) doute même que les études génétiques reflètent ici la vraie histoire.', statut: 'adn', src: SANG },
  n22: { trait: 'Oiseaux d’eau', detail: 'Oiseaux aquatiques et semi-aquatiques (plongeons, manchots, albatros, cigognes, pélicans, hérons), mais aucun trait anatomique connu.', statut: 'approx', src: SANG },
  n24: { trait: 'Narines en tube, au moins chez l’embryon', detail: 'Narines en tube chez tous au début du développement (elles disparaissent ensuite chez les manchots), humérus droit et allongé.', statut: 'source', src: SANG },
  n25: { trait: 'Lien tiré de l’ADN', detail: 'Cigognes, fous, cormorans, pélicans, hérons et ibis : aucun trait anatomique connu, selon la revue de 2022.', statut: 'adn', src: SANG },
  n26: { trait: 'Doigt arrière allongé', detail: 'Trait possible : un doigt arrière (hallux) allongé, et une forme particulière du haut du tibia.', statut: 'approx', src: SANG },
  n32: { trait: 'Vie dans les arbres', detail: 'Groupe défini par la vie arboricole ; aucun trait anatomique propre connu (revue de 2022). Leur ancêtre était peut-être un prédateur.', statut: 'approx' },
  n36: { trait: 'Lien tiré de l’ADN', detail: 'Colious et nicheurs en cavité : aucun trait anatomique connu, selon la revue de 2022.', statut: 'adn', src: SANG },
  n37: { statut: 'approx', detail: 'Leur nom vient de là : la plupart nichent dans des cavités. Aucun trait anatomique connu (revue de 2022).' },
  n38: { statut: 'approx', detail: 'Trogons, calaos, martins-pêcheurs, pics : la majorité nichent dans des cavités. Aucun trait anatomique connu (revue de 2022).' },
  n39: { trait: 'Poussin à bec inférieur plus long', detail: 'Un sillon bien marqué sur un os du poignet ; chez le poussin, la mâchoire inférieure dépasse la supérieure (trait possible).', statut: 'source', src: SANG },
  n40: { trait: 'Omoplate à bout fourchu', detail: 'Trait possible : une pointe d’omoplate en fourche, absente toutefois chez les jacamars.', statut: 'approx', src: SANG },
  n42: { trait: 'Même ordre de mue des ailes', detail: 'Faucons et perroquets renouvellent les plumes de l’aile dans le même ordre particulier, peut-être hérité et perdu chez les passereaux. Aucun trait du squelette connu.', statut: 'approx', src: SANG },
  n43: { detail: 'Les uns comme les autres apprennent leurs sons : l’ancêtre commun en était peut-être déjà capable. Trait du squelette possible : un sillon sur un os du 4e doigt du pied, perdu chez les passereaux actuels.' },
};
for(const [id, m] of Object.entries(MAJ)) Object.assign(T[id], m);
fs.writeFileSync(F, JSON.stringify(T, null, 1));
const c = {}; for(const k in T) if(T[k].statut) c[T[k].statut] = (c[T[k].statut] || 0) + 1;
console.log(Object.keys(MAJ).length, 'traits mis a jour ;', JSON.stringify(c));
console.log('restent ADN :', Object.entries(T).filter(([, v]) => v.statut === 'adn').map(([k, v]) => k + ' ' + v.groupe).join(' | '));
