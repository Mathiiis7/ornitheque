// Reporte dans les traits du cladogramme ce que Chen & Field 2020 (Vertebrate Zoology 70(4):571-585,
// doi:10.26049/VZ70-4-2020-03, CC BY 4.0) dit des sous-groupes des engoulevents et martinets, et
// l'article Wikipedia des egotheles pour le dernier. Texte source :
// notes-privees/arbre/sources/chen-field-2020.txt (le paragraphe de Letornithes est coupe en deux
// par la mise en page : sa fin est a la ligne 203). Lancer depuis la racine.
import fs from 'node:fs';
const F = 'notes-privees/maquettes/arbre/traits.json';
const T = JSON.parse(fs.readFileSync(F, 'utf8'));
const CHEN = 'https://doi.org/10.26049/VZ70-4-2020-03';
const MAJ = {
  n28: { trait: 'Os lacrymal peu saillant', detail: 'Groupe surtout connu par l’ADN ; un seul trait possible : la pointe descendante de l’os lacrymal (au bord de l’œil) est peu développée.', statut: 'approx', src: CHEN },
  n29: { trait: 'Pattes très courtes, longtemps perchés', detail: 'Pattes extrêmement courtes et sans pont osseux sur le tibia (traits possibles) ; leur nom, « oiseaux assis », vient de là et de leur habitude de rester perchés longtemps. Tous deux vivent aujourd’hui en Amérique tropicale.', statut: 'approx', src: CHEN },
  n30: { trait: 'Crâne sans pointes basiptérygoïdes', detail: 'Groupe surtout connu par l’ADN ; ses membres n’ont pas les deux petites pointes osseuses qui, sous le crâne de nombreux oiseaux, s’appuient sur le palais. Autre trait possible : un canal absent dans l’os du pied.', statut: 'approx', src: CHEN },
  n31: { trait: 'Ancêtre au bec large et aux pattes fortes', detail: 'Les ancêtres des martinets et des colibris ressemblaient sans doute à un petit égothèle : bouche large, pattes fortes, alors que leurs pattes sont aujourd’hui très réduites. Séparés il y a environ 57 millions d’années.', statut: 'approx', src: 'https://en.wikipedia.org/wiki/Owlet-nightjar' },
  n27: { detail: 'Os de la mâchoire supérieure séparés par une large fente ; torpeur (le corps se met au ralenti) plus fréquente que chez tout autre groupe ; bec souvent plus court que le reste du crâne.' },
};
for(const [id, m] of Object.entries(MAJ)) Object.assign(T[id], m);
fs.writeFileSync(F, JSON.stringify(T, null, 1));
const c = {}; for(const k in T) if(T[k].statut) c[T[k].statut] = (c[T[k].statut] || 0) + 1;
console.log(JSON.stringify(c));
console.log('restent ADN :', Object.entries(T).filter(([, v]) => v.statut === 'adn').map(([k, v]) => k + ' ' + v.groupe).join(' | '));
