// Traits des embranchements ENTRE FAMILLES (demande de Mathis, 2026-11-08). Un trait n'est retenu que
// si une phrase de la source l'attribue au groupe EXACT du nœud (mêmes familles) ; sinon le nœud est
// « adn » : connu seulement par la génétique (Stiller 2024). Chaque trait garde la phrase source (cite).
// La clé d'un nœud est la liste triée de ses familles : elle ne dépend pas de l'ordre des branches
// dans data/arbre.json, que le générateur peut changer.
// Écrit notes-privees/maquettes/arbre/traits-familles.json (lu par arbre-donnees.mjs) et
// notes-privees/arbre/TRAITS-FAMILLES.md (relecture par Mathis). Lancer depuis la racine.
import fs from 'node:fs';
const W = t => 'https://en.wikipedia.org/wiki/' + t;
// Décisions, par identifiant de outils/build/_noeuds-familles.mjs (chemin depuis la racine de l'ordre).
// douteux : trait gardé mais signalé à Mathis (hérité plutôt qu'apparu, ou proche d'une description).
// Écartés par Mathis le 2026-11-08 (« tout en ADN ») : pénis des Anseres (hérité), bec crochu des
// Accipitriformes (les faucons l'ont aussi), carrure des rolliers, syrinx « plus simple » des sous-oscines,
// plumage soyeux des jaseurs. Ne garder qu'un trait apparu au nœud, propre au groupe exact.
const TRAITS = {
  'Procellariiformes/r': { g: 'Albatros, océanites et pétrels', t: 'Narines en tubes', d: 'Les narines s’ouvrent au bout de tubes cornés sur le bec, d’où leur nom anglais de « tubenoses ».', src: W('Procellariiformes'), cite: 'The name "tubenoses" … refers to the "naricorns" or bony nostrils that distinguish these birds from other groups.' },
  'Procellariiformes/1': { g: 'Océanites et pétrels', t: 'Tubes sur le dessus du bec', d: 'Les tubes des narines courent sur le dessus du bec ; chez les albatros, ils sont de chaque côté.', src: W('Albatross'), cite: 'The tubes of all albatrosses are along the sides of the bill, unlike the rest of the Procellariiformes, where the tubes run along the top of the bill.' },
  'Suliformes/1': { g: 'Fous, anhingas et cormorans', t: 'Parade du mâle ailes levées', d: 'Le mâle parade en levant les ailes, comportement propre à ce groupe.', src: W('Darter'), cite: 'The male raised-wing display seems to be a synapomorphy of the Sulae' },
  'Suliformes/1.1': { g: 'Anhingas et cormorans', t: 'Un os de plus derrière le crâne', d: 'Un os propre à ces deux familles, l’os nucal, porte de puissants muscles de la mâchoire.', src: W('Cormorant'), cite: 'This bone and the highly developed muscles over it, the M. adductor mandibulae caput nuchale, are unique to the families Phalacrocoracidae and Anhingidae.' },
  'Apodiformes/r': { g: 'Martinets et colibris', t: 'Aile qui pivote à sa base', d: 'L’aile tourne depuis l’épaule et reste tendue : elle porte à la descente comme à la remontée.', src: W('Swift_(bird)'), cite: 'They share with their relatives the hummingbirds a special ability to rotate their wings from the base' },
  'Strigiformes/r': { g: 'Effraies et chouettes', t: 'Oreilles asymétriques', d: 'Les deux oreilles sont placées différemment sur le crâne, ce qui situe un bruit au millionième de seconde.', src: W('Owl'), cite: 'Owls can have either internal or external ears, both of which are asymmetrical.' },
  'Bucerotiformes/0': { g: 'Huppes et irrisors', t: 'Os de l’oreille particulier', d: 'L’étrier, petit os de l’oreille, a chez eux une forme qu’on ne retrouve nulle part ailleurs.', src: W('Wood_hoopoe'), cite: 'A close relationship between the hoopoe and the wood hoopoes is also supported by the shared and unique nature of their stapes.' },
  'Coraciiformes/r': { g: 'Rolliers, guêpiers, martins-pêcheurs', t: 'Doigts soudés à la base', d: 'Trois doigts vers l’avant, deux d’entre eux soudés à la base.', src: W('Coraciiformes'), cite: 'They generally have syndactyly, with three forward-pointing toes (and toes 3 & 4 fused at their base)' },
  'Piciformes/r': { g: 'Jacamars, barbus, toucans et pics', t: 'Deux doigts en avant, deux en arrière', d: 'Pied zygodactyle, acquis avant la séparation des deux branches.', src: W('Galbuli'), cite: 'the groups had developed zygodactyl feet (two toes facing forward and two aft) before separating' },
  'Psittaciformes/r': { g: 'Perroquets', t: 'Bec courbe et pied zygodactyle', d: 'Bec fort et courbé, deux doigts en avant et deux en arrière.', src: W('Cockatoo'), cite: 'Cockatoos share many features with other parrots, including the characteristic curved beak shape and a zygodactyl foot' },
  'Psittaciformes/1.1': { g: 'Perroquets vrais', t: 'Plumes qui font le bleu et le vert', d: 'Une structure des plumes (texture de Dyck) diffuse la lumière et donne les bleus et verts vifs, absente chez les cacatoès.', src: W('Parrot'), cite: 'lacking the Dyck texture feathers that, in the Psittacidae, scatter light to produce the vibrant colours of many parrots' },
  // --- Passereaux (lot 2). Steell et al. 2023 (os de la main, toutes les familles) : aucun trait unique
  // et sans retour ne distingue les grands groupes de passereaux ; d'où tant de nœuds « adn ».
  'Passeriformes/r': { g: 'Passereaux', t: 'Pied fait pour se percher', d: 'Trois doigts en avant, un pouce long en arrière, attaché à la même hauteur que les autres.', src: W('Passerine'), cite: 'The hind toe (hallux) is long and joins the leg at approximately the same level as the front toes.' },
  'Passeriformes/1.0.1.1': { g: 'Fourmiliers, tapaculos et fourniers', t: 'Organe du chant dans la trachée', d: 'Leur syrinx est logée dans la trachée elle-même, et non à sa fourche comme chez les autres oiseaux.', src: W('Syrinx_(bird_anatomy)'), cite: 'The syrinx may also be restricted to the trachea and this is found in a very small number of bird groups that are sometimes known as Tracheophonae' },
  'Passeriformes/1.1': { g: 'Oiseaux chanteurs (oscines)', t: 'Organe du chant très développé', d: 'Une syrinx aux muscles nombreux, la mieux contrôlée de tous les oiseaux : d’où la variété de leurs chants.', src: W('Songbird'), cite: 'Songbirds do, however, possess a highly developed vocal organ, the syrinx, that enables their sonorous activity.' },
  'Passeriformes/1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1': { g: 'Pinsons, bruants, parulines, tangaras…', t: 'Neuf rémiges primaires visibles', d: 'L’aile ne montre que neuf grandes plumes primaires ; la dixième est minuscule et cachée.', src: W('Nine-primaried_oscine'), cite: 'all species within it have only nine easily visible primary feathers on each wing (in reality most, if not all, also have a tenth primary, but it is greatly reduced and largely concealed)' },
};
const noeuds = JSON.parse(fs.readFileSync('notes-privees/arbre/noeuds-familles.json', 'utf8'));
const lot = noeuds;
const sortie = {}, md = ['# Traits des embranchements entre familles - relecture', '',
  'Un trait est gardé seulement si la source le donne pour le groupe exact. Sinon : **ADN**, groupe connu seulement par la génétique (point d’une autre couleur).', ''];
let ord = '', nT = 0;
for(const n of lot){
  const fams = n.cotes.flat(), cle = fams.map(f => f.lat).sort().join('+');
  const d = TRAITS[n.id];
  const cotes = n.cotes.map(c => c.length > 6 ? `${c.length} familles (${c[0].fr} … ${c[c.length - 1].fr})` : c.map(f => f.fr).join(' · ')).join('  |  ');
  if(n.ordre !== ord){ ord = n.ordre; md.push('', '## ' + n.ordreFr, ''); }
  if(d){
    nT++;
    sortie[cle] = { g: d.g, t: d.t, d: d.d, st: 'source', src: d.src, cite: d.cite };
    md.push(`- **${d.t}**${d.douteux ? ' ⚠' : ''} - ${cotes}`, `  ${d.d}`, `  > « ${d.cite} » (${d.src})`);
    if(d.douteux) md.push(`  ⚠ ${d.douteux}`);
  } else {
    sortie[cle] = { g: cotes.replace(/  \|  /g, ' + '), t: 'ADN', d: '', st: 'adn', src: '' };
    md.push(`- ADN - ${cotes}`);
  }
}
md.splice(3, 0, `**${nT} traits sur ${lot.length} embranchements** ; les autres sont « ADN ».`, '');
fs.writeFileSync('notes-privees/maquettes/arbre/traits-familles.json', JSON.stringify(sortie, null, 1));
fs.writeFileSync('notes-privees/arbre/TRAITS-FAMILLES.md', md.join('\n') + '\n');
console.log(nT, 'traits sur', lot.length);
for(const id of Object.keys(TRAITS)) if(!lot.some(n => n.id === id)) console.log('identifiant inconnu :', id);
