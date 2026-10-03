/*
  annees-par-quinzaine.mjs - Combien d'ANNEES de listes se cachent derriere chaque quinzaine
  d'un bar chart eBird, et comment en tirer des poids honnetes.

  LE PROBLEME
  Un bar chart 2019-2026 telecharge en septembre 2026 porte huit annees sur ses quinzaines
  de janvier a mi-septembre, et sept seulement sur celles d'octobre a decembre. La valeur
  annuelle d'une espece etant une moyenne des 48 quinzaines PONDEREE PAR LE NOMBRE DE
  LISTES, le printemps pese alors plus lourd qu'il ne devrait - et d'autant plus que 2026
  est l'annee la plus fournie de la fenetre, eBird ayant sextuple en France depuis 2019.

  Mesure sur la France : les quinzaines de janvier a mi-septembre portent 83,4 % du poids
  annuel, contre 79,4 % dans une fenetre d'annees completes. Les oiseaux d'automne et
  d'hiver en ressortent sous-estimes, ceux du printemps surestimes.

  LA CORRECTION
  Chaque quinzaine garde TOUTES ses annees pour calculer SA frequence - on ne jette aucune
  donnee. Seul son poids change : « nombre de listes par an » au lieu de « nombre de listes
  en tout ». Une quinzaine compte alors pour une quinzaine, quel que soit le nombre
  d'annees qu'on en a.

  CE QUE CA VAUT
  Test a blanc sur sept pays : on prend 2019-2025, sept annees completes, on ampute 2025 a
  la mi-septembre comme 2026 l'est vraiment, et on regarde quelle methode retombe le plus
  pres de la verite connue.

                                 sans correction   avec correction   sans la derniere annee
    France    erreur mediane          3,07 %           2,12 %              4,09 %
              paliers faux                19               14                  40
    Norvege   erreur mediane          3,68 %           2,10 %              6,04 %
    Etats-Unis erreur mediane         1,45 %           0,56 %              1,51 %

  Entre 67 et 80 % des especes se rapprochent de la verite, et les paliers faux ne montent
  jamais. A noter pour la suite : JETER l'annee incomplete est la PIRE des trois options -
  supprimer le biais en perdant l'annee la plus fournie coute plus que le biais lui-meme.

  LA DATE D'ARRET
  Elle ne se devine pas dans le fichier : c'est la date a laquelle il a ete telecharge. Les
  1 377 bar charts de l'appli s'etalent sur cinq dates, de fin juillet a fin septembre 2026,
  donc la coupure n'est pas la meme pour tous. Elle est figee dans dates-barcharts.json,
  releve une fois depuis les dates de fichier - un clone du depot les perdrait.

  DECOUPAGE eBird : quatre tranches par mois, 1-7, 8-14, 15-21, 22-fin. Le mot « quinzaine »
  employe partout dans le depot designe ces tranches ; il est impropre mais il est celui du
  code, on s'y tient.
*/
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const JOURS_MOIS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// Les bornes en jours du mois de chaque tranche : [debut, fin], 1-indexe.
function bornesTranche(mois, i){
  const fin = JOURS_MOIS[mois];
  return i === 0 ? [1, 7] : i === 1 ? [8, 14] : i === 2 ? [15, 21] : [22, fin];
}

/*
  Les 48 valeurs, pour une fenetre [byr, eyr] arretee au jour `arret` de l'annee eyr.
  Les annees byr..eyr-1 sont completes ; eyr ne couvre que le debut de l'annee.
*/
export function anneesParQuinzaine({ byr, eyr, arret }){
  const completes = eyr - byr;            // annees pleines de la fenetre
  const m = arret.getMonth(), j = arret.getDate();
  const out = new Array(48);
  for(let q = 0; q < 48; q++){
    const mois = Math.floor(q / 4), i = q % 4;
    const [d1, d2] = bornesTranche(mois, i);
    let part;
    if(mois < m) part = 1;
    else if(mois > m) part = 0;
    else if(j >= d2) part = 1;
    else if(j < d1) part = 0;
    else part = (j - d1 + 1) / (d2 - d1 + 1);
    out[q] = completes + part;
  }
  return out;
}

// Le releve des dates de telechargement, fige une fois pour toutes.
let DATES = null;
function dates(){
  if(DATES) return DATES;
  const p = join(__dir, 'dates-barcharts.json');
  DATES = existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {};
  return DATES;
}

/*
  Les 48 valeurs pour UN fichier de bar chart, d'apres son nom (la fenetre) et le releve
  des dates (l'arret). Sans date connue, on refuse de deviner : une correction appliquee au
  mauvais endroit ferait plus de mal que pas de correction du tout.
*/
export function anneesPourFichier(chemin){
  const nom = basename(chemin);
  const f = /(\d{4})[-_](\d{4})/.exec(nom);
  if(!f) throw new Error(`fenetre d'annees illisible dans le nom : ${nom}`);
  const d = dates()[nom];
  if(!d) throw new Error(`date de telechargement inconnue pour ${nom} - relancer outils/build/releve-dates-barcharts.mjs`);
  return anneesParQuinzaine({ byr: +f[1], eyr: +f[2], arret: new Date(d + 'T12:00:00Z') });
}

/*
  Les poids a passer a une moyenne ponderee sur les 48 quinzaines : le nombre de listes de
  chacune, ramene a l'annee.

  ATTENTION - ces poids ne servent QU'A ponderer le temps. Partout ou l'effort sert a
  RECOMBINER des comptes en frequence (fusion de deux bar charts, regroupement de zones),
  il faut le nombre de listes BRUT : frequence x listes = listes citant l'espece, et ce sont
  ces comptes-la qui s'additionnent.
*/
export function poidsAnnuels(effort, annees){
  return effort.map((n, q) => (n || 0) / (annees[q] || 1));
}
