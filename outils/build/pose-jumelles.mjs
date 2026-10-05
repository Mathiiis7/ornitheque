// Pose « jumelles » de la mascotte : le martin du logo, intact au trait près, avec des
// jumelles pendues au cou sur la poitrine. On ajoute des formes par-dessus, on ne touche à
// aucune des siennes : c'est ce qu'Arrow 2 n'a pas su faire le 2026-10-05 (il redessinait
// un autre oiseau). Gris du bec pour le corps des jumelles : l'or est réservé aux trophées
// (docs/charte-graphique.md).
// Sortie : notes-privees/mascotte/poses/jumelles.svg
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const source = readFileSync('assets/logos/sources/martin-figma.svg', 'utf8');

const jumelles = `
<g id="jumelles" transform="translate(15.55 13.6) scale(1.3) translate(-15.1 -13.2) rotate(-10 15.1 13.2)">
<path d="M14.2 9.85 L13.95 12.15 M16.35 9.9 L16.2 12.15" stroke="#364042" stroke-width="0.16" stroke-linecap="round"/>
<rect x="14.75" y="12.45" width="0.55" height="0.8" fill="#364042"/>
<rect x="13.55" y="11.85" width="1.3" height="2.75" rx="0.45" fill="#364042"/>
<rect x="15.2" y="11.85" width="1.3" height="2.75" rx="0.45" fill="#364042"/>
<rect x="13.75" y="11.7" width="0.9" height="0.45" rx="0.15" fill="#1E2526"/>
<rect x="15.4" y="11.7" width="0.9" height="0.45" rx="0.15" fill="#1E2526"/>
<rect x="13.55" y="13.0" width="1.3" height="0.32" fill="#455052"/>
<rect x="15.2" y="13.0" width="1.3" height="0.32" fill="#455052"/>
<ellipse cx="14.2" cy="14.55" rx="0.58" ry="0.2" fill="#1E2526"/>
<ellipse cx="15.85" cy="14.55" rx="0.58" ry="0.2" fill="#1E2526"/>
</g>
`;

const sortie = source.replace(/<\/svg>\s*$/, jumelles + '</svg>\n');
if (sortie === source) throw new Error('fin de </svg> introuvable');
mkdirSync('notes-privees/mascotte/poses', { recursive: true });
writeFileSync('notes-privees/mascotte/poses/jumelles.svg', sortie);
console.log('notes-privees/mascotte/poses/jumelles.svg');
