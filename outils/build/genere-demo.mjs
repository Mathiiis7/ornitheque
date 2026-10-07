/*
  Genere la demo du portfolio : demo/index.html et demo/donnees.js.

    node outils/build/genere-demo.mjs            ecrit les deux fichiers
    node outils/build/genere-demo.mjs --verifie  ne rien ecrire, dire si c est a jour

  Le mode verification est branche dans outils/verif/tous.mjs. C est lui qui compte : la demo
  recopie le squelette d index.html, et un double qui prend du retard en silence est LE piege
  maison - inject-exotic-by-region.mjs a coute deux jours pour exactement ca le 2026-09-27.
  Le code, lui, ne se recopie pas : demo/index.html charge le MEME app.js, le MEME styles.css
  et le meme data/ que le vrai site, par <base href="../">. Une correction poussee arrive donc
  dans la demo sans rien faire.

  Contrepartie assumee : un bug pousse casse aussi la demo, devant les visiteurs du
  portfolio. Ca se voit tout de suite, c est le prix de l absence de retard.
*/
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const f = (...p) => resolve(RACINE, ...p);
const VERIFIE = process.argv.includes('--verifie');

const LIGUE = 'merlin-bird';          // doit rester egal a LEAGUE_ID dans app.js
const UID_MOI = 'demo-visiteur';

/* ============================================================
   Lire les tables d app.js sans l executer
   ============================================================ */
// app.js est un module qui a besoin du DOM : impossible de l importer ici. On extrait donc
// le litteral, en suivant les guillemets pour ne pas se faire piper par une accolade dans
// un nom d espece.
function litteral(source, nom){
  const i = source.indexOf('const ' + nom + ' = {');
  if(i < 0) throw new Error(nom + ' introuvable dans app.js');
  const debut = source.indexOf('{', i);
  let profondeur = 0, dansChaine = false, echappe = false;
  for(let j = debut; j < source.length; j++){
    const c = source[j];
    if(dansChaine){
      if(echappe) echappe = false;
      else if(c === '\\') echappe = true;
      else if(c === '"') dansChaine = false;
      continue;
    }
    if(c === '"') dansChaine = true;
    else if(c === '{') profondeur++;
    else if(c === '}'){ profondeur--; if(profondeur === 0) return JSON.parse(source.slice(debut, j + 1)); }
  }
  throw new Error(nom + ' : accolade fermante introuvable');
}

const APP = readFileSync(f('app.js'), 'utf8');
const FR_NAMES = litteral(APP, 'FR_NAMES');
const REAL_RARITY = litteral(APP, 'REAL_RARITY');

const ligueDansApp = APP.match(/const LEAGUE_ID = '([^']+)'/);
if(!ligueDansApp || ligueDansApp[1] !== LIGUE){
  throw new Error('LEAGUE_ID vaut ' + (ligueDansApp ? ligueDansApp[1] : '?') + ' dans app.js, ' + LIGUE + ' ici');
}

/* ============================================================
   Choisir des especes francaises credibles
   ============================================================ */
// freq_48.json donne la frequence de chaque espece par quinzaine, en France. Trier sur la
// moyenne met les especes que tout le monde voit en tete : c est exactement l ordre dans
// lequel une vraie life list francaise se remplit.
const FREQ = JSON.parse(readFileSync(f('data/countries/fr/freq_48.json'), 'utf8'));
const ESPECES = Object.entries(FREQ)
  .map(([sci, quinzaines]) => ({ sci, moyenne: quinzaines.reduce((a, b) => a + b, 0) / quinzaines.length }))
  .filter(e => FR_NAMES[e.sci])                  // sans nom francais, le panneau afficherait du latin
  .sort((a, b) => b.moyenne - a.moyenne)
  .map(e => e.sci);

if(ESPECES.length < 500) throw new Error('seulement ' + ESPECES.length + ' especes utilisables, attendu au moins 500');
const sansRarete = ESPECES.filter(s => REAL_RARITY[s] === undefined).length;

// Tirage deterministe : le meme fichier sort a chaque execution, sinon le mode verification
// annoncerait un retard a chaque fois.
function pseudo(n){ const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); }
function graineDe(texte){ let h = 0; for(const c of texte) h = (h * 31 + c.charCodeAt(0)) % 9973; return h; }

/* ============================================================
   Les lieux
   ============================================================ */
// Jusqu au 2026-10-02, dix lieux fixes tires au hasard : 1 349 cochages empiles sur dix points,
// et un Macareux aussi probable a Fontainebleau qu a la Pointe du Raz. Ca se voyait sur la carte.
// Chaque membre a maintenant ses coins : plusieurs dans son departement, deux dans chaque
// departement visite. Une espece va dans le coin ou freq_by_region (frequence eBird par
// departement et par mois) la donne la plus frequente ce mois-la. Les points tombent dans le
// vrai contour du departement ; le nom affiche est celui du departement, faute de nom de site
// qu on puisse affirmer pour un point tire au hasard.
const FREQ_DEP = JSON.parse(readFileSync(f('data/countries/fr/freq_by_region.json'), 'utf8'));
const CONTOURS = JSON.parse(readFileSync(f('outils/config/departements-fr.geojson'), 'utf8'));

// Paris n a pas de frequences a lui dans freq_by_region : sans elles, aucune espece n irait y
// tomber, on le laisse de cote. Plus de cinq departements manquants voudrait dire autre chose.
const DEPS = CONTOURS.features.map(ft => {
  const cle = Object.keys(FREQ_DEP).find(k => k.endsWith('-' + ft.properties.code));
  const polygones = ft.geometry.type === 'Polygon' ? [ft.geometry.coordinates] : ft.geometry.coordinates;
  return cle && { cle, nom: ft.properties.nom, polygones };
}).filter(Boolean);
if(DEPS.length < 91) throw new Error('seulement ' + DEPS.length + ' departements avec frequences');
const DEP = Object.fromEntries(DEPS.map(d => [d.cle, d]));

function dansAnneau(lon, lat, anneau){
  let dedans = false;
  for(let i = 0, j = anneau.length - 1; i < anneau.length; j = i++){
    const [xi, yi] = anneau[i], [xj, yj] = anneau[j];
    if((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) dedans = !dedans;
  }
  return dedans;
}
const dansDep = (lon, lat, d) =>
  d.polygones.some(p => dansAnneau(lon, lat, p[0]) && !p.slice(1).some(trou => dansAnneau(lon, lat, trou)));

// Arrondi au millieme (une centaine de metres) puis reteste : arrondir au centieme pouvait
// pousser un point cotier dans la mer.
function pointDans(d, graine){
  const tous = d.polygones.flatMap(p => p[0]);
  const lons = tous.map(p => p[0]), lats = tous.map(p => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...lons), Math.max(...lons), Math.min(...lats), Math.max(...lats)];
  for(let essai = 0; essai < 1000; essai++){
    const lo = Math.round((x0 + pseudo(graine + essai * 1.37) * (x1 - x0)) * 1000) / 1000;
    const la = Math.round((y0 + pseudo(graine * 1.91 + essai * 2.71 + 0.5) * (y1 - y0)) * 1000) / 1000;
    if(dansDep(lo, la, d)) return { la, lo };
  }
  throw new Error('aucun point trouve dans ' + d.nom);
}

function coinsDe(m){
  const coins = [];
  const ajoute = (cle, combien, poids) => {
    for(let k = 0; k < combien; k++){
      coins.push({ cle, poids, l: DEP[cle].nom, ...pointDans(DEP[cle], graineDe(cle) + k * 97 + m.graine * 7919) });
    }
  };
  if(!DEP[m.chezSoi]) throw new Error('departement inconnu : ' + m.chezSoi);
  ajoute(m.chezSoi, 8, 4);
  // Plus la liste est longue, plus son auteur a voyage.
  const visites = DEPS.map(d => d.cle).filter(c => c !== m.chezSoi)
    .sort((a, b) => pseudo(graineDe(a) + m.graine * 53) - pseudo(graineDe(b) + m.graine * 53))
    .slice(0, Math.round(m.especes / 12));
  for(const cle of visites) ajoute(cle, 2, 1);
  return coins;
}

const frequence = (cle, sci, mois) => (FREQ_DEP[cle][sci] || [])[mois - 1] || 0;

function tireSelon(poids, tirage){
  const total = poids.reduce((a, b) => a + b, 0);
  if(total === 0) return -1;
  let seuil = tirage * total;
  for(let i = 0; i < poids.length; i++){ seuil -= poids[i]; if(seuil < 0) return i; }
  return poids.length - 1;
}

function coinPour(m, coins, sci, mois, tirage){
  const i = tireSelon(coins.map(c => frequence(c.cle, sci, mois) * c.poids), tirage);
  if(i >= 0) return coins[i];
  // L espece n est dans aucun de ses coins ce mois-la : une sortie ailleurs, la ou elle est.
  // Le coin s ajoute aux siens, une espece suivante pourra y etre vue aussi.
  let j = tireSelon(DEPS.map(d => frequence(d.cle, sci, mois)), tirage);
  if(j < 0) j = tireSelon(DEPS.map(d => (FREQ_DEP[d.cle][sci] || []).reduce((a, b) => a + b, 0)), tirage);
  if(j < 0) return coins[Math.floor(tirage * coins.length)];
  const cle = DEPS[j].cle;
  const coin = { cle, poids: 1, l: DEP[cle].nom, ...pointDans(DEP[cle], graineDe(cle) + 5003 + m.graine * 7919) };
  coins.push(coin);
  return coin;
}

function listeDe(m){
  const { graine, especes: combien } = m;
  const coins = coinsDe(m);
  const out = [];
  for(let i = 0; i < ESPECES.length && out.length < combien; i++){
    // Les especes communes entrent presque toujours, les rares de moins en moins : une life
    // list vraisemblable, et deux joueurs ne se retrouvent pas avec la meme.
    const chance = 0.55 + 0.45 * (1 - i / ESPECES.length);
    if(pseudo(i * 7 + graine * 101) > chance) continue;
    const sci = ESPECES[i];
    const jour = 1 + Math.floor(pseudo(i * 3 + graine) * 27);
    const mois = 1 + Math.floor(pseudo(i * 5 + graine * 2) * 12);
    const lieu = coinPour(m, coins, sci, mois, pseudo(i + graine * 13));
    let annee = 2020 + Math.floor(pseudo(i * 11 + graine * 3) * 7);
    // Une observation dans le futur se verrait tout de suite. On recule d une annee plutot
    // que de raboter, pour garder des cochages recents : une demo ou personne n a rien vu
    // depuis neuf mois a l air abandonnee.
    while(Date.UTC(annee, mois - 1, jour) > MAINTENANT - 2 * JOUR) annee--;
    const d = annee + '-' + String(mois).padStart(2, '0') + '-' + String(jour).padStart(2, '0');
    out.push({ k: sci, c: FR_NAMES[sci], s: sci, d, l: lieu.l, o: 1, f: 1, co: 'FR',
               la: lieu.la, lo: lieu.lo, a: Date.UTC(annee, mois - 1, jour) });
  }
  // L espece « la plus rare » de la fiche doit etre dans la liste : le Classement affichait
  // la Chevechette de Hugo, que « Qui a vu quoi » ne lui donnait pas (vu le 2026-10-06).
  // Elle prend la place de la derniere tiree, pour garder le compte.
  if(m.rareSci && !out.some(x => x.k === m.rareSci)){
    if(!DEP[m.rareDep]) throw new Error('departement inconnu : ' + m.rareDep);
    const { la, lo } = pointDans(DEP[m.rareDep], graineDe(m.rareDep) + 7001 + graine * 7919);
    const a = Date.UTC(m.rareAn, 4, 15);
    out[out.length - 1] = { k: m.rareSci, c: FR_NAMES[m.rareSci], s: m.rareSci,
      d: m.rareAn + '-05-15', l: DEP[m.rareDep].nom, o: 1, f: 1, co: 'FR', la, lo, a };
  }
  return out;
}

/* ============================================================
   La fausse ligue
   ============================================================ */
const JOUR = 86400000;
const MAINTENANT = Date.UTC(2026, 8, 28);     // date figee : le fichier ne doit pas changer tout seul
const ts = ms => ({ __horodatage: ms });      // remplace par un vrai objet dans donnees.js

const MEMBRES = [
  { id: UID_MOI,      nom: 'Alex',      especes: 212, graine: 1, statut: 'En quête du Guêpier',
    but: 'Passer les 250 espèces cette année', reve: 'Le Gypaète barbu en vol',
    rare: 'Marouette ponctuée, Brenne, 2023', rareSci: 'porzana porzana', rareDep: 'FR-CVL-36', rareAn: 2023, avatar: '🦅', jours: 400, chezSoi: 'FR-CVL-36' },   // la Brenne de sa rareté
  { id: 'demo-claire', nom: 'Claire',   especes: 318, graine: 2, statut: 'Camargue tous les week-ends',
    but: 'Finir les limicoles de la façade atlantique', reve: 'Une Aigrette des récifs',
    rare: 'Bécassine double, baie de Somme, 2024', rareSci: 'gallinago media', rareDep: 'FR-HDF-80', rareAn: 2024, avatar: '🦩', jours: 900, chezSoi: 'FR-PAC-13' },   // la Camargue
  { id: 'demo-hugo',   nom: 'Hugo',     especes: 274, graine: 3, statut: 'Sorties au petit matin',
    but: 'Photographier les dix pics de France', reve: 'Le Grand Tétras',
    rare: 'Chevêchette d’Europe, Jura, 2022', rareSci: 'glaucidium passerinum', rareDep: 'FR-BFC-39', rareAn: 2022, avatar: '🦉', jours: 700, chezSoi: 'FR-BFC-39' },   // le Jura
  { id: 'demo-lina',   nom: 'Lina',     especes: 156, graine: 4, statut: 'Débutante assumée',
    but: 'Reconnaître dix chants sans tricher', reve: 'Un Martin-pêcheur de près',
    rare: 'Torcol fourmilier, jardin, 2025', rareSci: 'jynx torquilla', rareDep: 'FR-NAQ-33', rareAn: 2025, avatar: '🐦', jours: 120, chezSoi: 'FR-NAQ-33' },
  { id: 'demo-samir',  nom: 'Samir',    especes: 389, graine: 5, statut: 'Compte les Pouillots',
    but: 'Boucler les 400', reve: 'Une Sittelle corse chez elle',
    rare: 'Rollier d’Europe, Crau, 2021', rareSci: 'coracias garrulus', rareDep: 'FR-PAC-13', rareAn: 2021, avatar: '🐧', jours: 1500, chezSoi: 'FR-BRE-29' },
];

const DONNEES = {};
DONNEES['leagues/' + LIGUE] = {
  name: 'L’Ornithèque',
  goalHeader: 'Démonstration - cette ligue et ses membres sont inventés',
};

for(const m of MEMBRES){
  DONNEES['leagues/' + LIGUE + '/members/' + m.id] = {
    name: m.nom, species: listeDe(m),
    goal: m.but, dream: m.reve, rare: m.rare, status: m.statut, avatar: m.avatar,
    fav: '', regions: ['FR-11', 'FR-93', 'FR-75', 'FR-53'],
    joinedAt: ts(MAINTENANT - m.jours * JOUR), updatedAt: ts(MAINTENANT - 2 * JOUR),
  };
}

// Deux personnes en ligne, pour que la pastille verte ait un sens.
for(const id of ['demo-claire', 'demo-samir']){
  const m = MEMBRES.find(x => x.id === id);
  DONNEES['leagues/' + LIGUE + '/presence/' + id] = { name: m.nom, at: ts(MAINTENANT), lastSeen: ts(MAINTENANT) };
}

const CHAT = [
  ['demo-claire', 'Claire', 'Guêpiers de retour sur la carrière ce matin, une quinzaine 🐝', 260],
  ['demo-samir',  'Samir',  'Jaloux. Moi c’est pouillot véloce, pouillot véloce et pouillot véloce.', 240],
  ['demo-hugo',   'Hugo',   'Quelqu’un a déjà coché la Chevêchette ailleurs que dans le Jura ?', 180],
  ['demo-lina',   'Lina',   'Je viens de dépasser les 150 ! Merci pour les conseils sur les chants 🙏', 120],
  ['demo-claire', 'Claire', 'Bravo Lina 🎉 la suite c’est les limicoles, et là ça pique', 110],
  [UID_MOI,       'Alex',   'Sortie Camargue le week-end prochain si quelqu’un veut se joindre', 40],
];
CHAT.forEach(([uid, nom, texte, minutes], i) => {
  DONNEES['leagues/' + LIGUE + '/chat/msg-' + (i + 1)] =
    { uid, name: nom, text: texte, createdAt: ts(MAINTENANT - minutes * 60000) };
});

// Les trois idees sont calees sur ce que l appli fait VRAIMENT, verifie dans app.js le
// 2026-09-28 : le visiteur du portfolio peut aller voir.
//   - "Fait" doit exister pour de bon, sinon la demo promet une fonctionnalite absente. Le
//     chant depuis la fiche d espece existe (xeno-canto, app.js:11779), donc il est coche.
//   - "En cours" est une extension d un existant : le quiz de chants a un defi quotidien et
//     un hebdomadaire (_quizDailyShowLastRecap, _quizWeeklyShowLastRecap), rien de mensuel.
//   - "A faire" est bien absent : le classement n a que ses trois modes (#boardModes), aucun
//     filtre geographique.
// La version precedente disait l inverse : elle reclamait le chant qui existe deja et
// annoncait "fait" un defi mensuel qui n existe pas.
const IDEES = [
  ['demo-hugo',  'Hugo',  'Un classement filtrable par département, pas seulement sur la France entière', 'todo', 9],
  ['demo-claire','Claire','Un défi mensuel au quiz de chants, en plus du quotidien et de l’hebdo', 'doing', 5],
  ['demo-lina',  'Lina',  'Pouvoir écouter le chant depuis la fiche d’espèce', 'done', 20],
];
IDEES.forEach(([uid, nom, texte, statut, jours], i) => {
  DONNEES['leagues/' + LIGUE + '/requests/idee-' + (i + 1)] =
    { uid, name: nom, text: texte, status: statut, createdAt: ts(MAINTENANT - jours * JOUR) };
});

const REACTIONS = [
  ['demo-hugo',   'chat:msg-4', '🎉'], ['demo-samir', 'chat:msg-4', '👏'],
  ['demo-claire', 'chat:msg-2', '😂'], [UID_MOI,      'chat:msg-1', '😍'],
];
REACTIONS.forEach(([uid, cible, emoji], i) => {
  DONNEES['leagues/' + LIGUE + '/reactions/r-' + (i + 1)] =
    { uid, target: cible, emoji, createdAt: ts(MAINTENANT - (i + 1) * 3600000) };
});

DONNEES['leagues/' + LIGUE + '/comments/c-1'] =
  { uid: 'demo-samir', name: 'Samir', text: 'La même chose au lac du Der la semaine dernière.',
    target: 'chat:msg-1', createdAt: ts(MAINTENANT - 3 * 3600000) };

const VOTES = [
  ['demo-claire', UID_MOI,       'regulier'], ['demo-hugo', 'demo-claire', 'explorateur'],
  ['demo-lina',   'demo-samir',  'pedagogue'], [UID_MOI,     'demo-lina',  'progression'],
];
VOTES.forEach(([voter, cible, trophee], i) => {
  DONNEES['leagues/' + LIGUE + '/votes/v-' + (i + 1)] =
    { voter, target: cible, trophy: trophee, createdAt: ts(MAINTENANT - (i + 2) * JOUR) };
});

// Collections laissees vides EXPRES, et le bouchon les sert quand meme : un abonnement sans
// reponse laisse son morceau d interface en chargement perpetuel, l effet "demo cassee" a
// eviter avant tout. typing, photos, requestVotes, trophyEvents, quizStats, admins.
// admins vide a une raison de plus : la demo ne doit pas etre administratrice.

/* ============================================================
   Ecrire demo/donnees.js
   ============================================================ */
function enJs(v){
  if(v && typeof v === 'object' && typeof v.__horodatage === 'number') return 'h(' + v.__horodatage + ')';
  if(Array.isArray(v)) return '[' + v.map(enJs).join(',') + ']';
  if(v && typeof v === 'object') return '{' + Object.entries(v).map(([k, x]) => JSON.stringify(k) + ':' + enJs(x)).join(',') + '}';
  return JSON.stringify(v);
}

const donneesJs = `/*
  La fausse ligue de la demo. FICHIER GENERE par outils/build/genere-demo.mjs : ne pas
  modifier a la main, la prochaine execution ecraserait tout.

  Les ${ESPECES.length} especes disponibles viennent de data/countries/fr/freq_48.json, triees de la plus
  commune a la plus rare en France ; leurs noms francais de la table FR_NAMES d app.js. Les
  listes sont donc vraisemblables, et les fiches d espece s affichent puisque les cles sont
  celles du vrai jeu de donnees.${sansRarete ? '\n  (' + sansRarete + ' especes sans indice de rarete connu : leur pastille restera neutre.)' : ''}

  Genere a partir d une date figee, le ${new Date(MAINTENANT).toISOString().slice(0, 10)} : relancer le generateur sans
  toucher a rien redonne le meme fichier, sinon le mode verification crierait au retard a
  chaque execution.
*/
const h = ms => ({ seconds: Math.floor(ms / 1000), nanoseconds: 0,
                   toDate(){ return new Date(ms); }, toMillis(){ return ms; }, valueOf(){ return ms; } });

export const UID_MOI = ${JSON.stringify(UID_MOI)};
export const LIGUE = ${JSON.stringify(LIGUE)};

export const DONNEES = {
${Object.entries(DONNEES).map(([c, d]) => '  ' + JSON.stringify(c) + ': ' + enJs(d) + ',').join('\n')}
};
`;

/* ============================================================
   Ecrire demo/index.html
   ============================================================ */
const ANCRE = '<meta charset="utf-8">';
const INJECTION = `
<!-- ================= DEMO DU PORTFOLIO - BLOC AJOUTE PAR outils/build/genere-demo.mjs =================
     Tout ce qui suit cette balise est identique a index.html. Ne pas modifier ce fichier a la
     main : relancer le generateur.

     <base href="../"> fait pointer TOUS les chemins relatifs vers la racine du site : app.js,
     styles.css, data/ et les fetch qu app.js lance lui-meme (data/countries/..., etc.) sont
     donc les vrais, pas des copies. C est ce qui empeche la demo de prendre du retard.
     index.html n a aucun href="#", donc <base> ne casse aucune ancre - verifie le 2026-09-28.

     L importmap doit venir avant tout module : elle detourne les trois URL Firebase de
     gstatic vers les bouchons, qui n ont pas une ligne de reseau.

     Piege deja paye par le banc : index.html n a PAS de balise <head>. Le mot n apparait que
     dans un commentaire. L ancre est <meta charset="utf-8">, et le generateur verifie apres
     coup que l injection est bien tombee avant le premier script.
-->
<base href="../">
<script type="importmap">
{
  "imports": {
    "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js": "./demo/bouchons/firebase-app.js",
    "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js": "./demo/bouchons/firebase-auth.js",
    "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js": "./demo/bouchons/firebase-firestore.js"
  }
}
</script>
<script>
  // La demo n enregistre JAMAIS de service worker. Elle est sur la meme origine que le vrai
  // site sur GitHub Pages, et <base href="../"> ferait resoudre le register('service-worker.js')
  // d app.js vers la racine : la demo abimerait le cache du vrai site.
  try{
    if(navigator.serviceWorker){
      Object.defineProperty(navigator.serviceWorker, 'register',
        { value: () => Promise.resolve(), configurable: true });
    }
  }catch(_){ }
</script>
<script>
  // Le guide du site s ouvre a CHAQUE ouverture de la demo (demande de Mathis le 2026-10-08) :
  // un recruteur qui arrive sur Ma liste ne sait pas ou regarder. Dans la vraie appli, il n est
  // propose qu apres le premier depot ; le visiteur de la demo a deja sa liste, il ne le verrait
  // donc jamais. On ne touche pas app.js : on clique sur « Guide du site » du menu, comme lui.
  // On attend que la connexion soit faite ET que les boutons flottants se voient : lance trop
  // tot, le guide saute en silence les etapes dont la cible est encore cachee (Fil, Photos, Tchat).
  // ?sansguide le laisse ferme, pour les captures d ecran.
  if(!/[?&]sansguide/.test(location.search)) addEventListener('DOMContentLoaded', () => {
    const debut = Date.now();
    const essai = setInterval(() => {
      const pret = document.documentElement.getAttribute('data-auth') === 'signed-in'
        && document.getElementById('fabFeed')?.getClientRects().length > 0;
      if(pret){
        clearInterval(essai);
        if(document.getElementById('guide')?.hidden !== false) document.getElementById('hamGuide')?.click();
      }
      else if(Date.now() - debut > 10000) clearInterval(essai);
    }, 100);
  });
</script>
<style>
  /* Bandeau non negociable : personne ne doit croire qu il regarde la vraie ligue.
     Fixe en bas pour ne rien pousser - body porte un zoom 0.85, une bande en haut
     decalerait toutes les mesures de l interface. */
  #demoBandeau{
    position:fixed; left:0; right:0; bottom:0; z-index:99999;
    background:#1d3557; color:#fff; font:600 13px/1.4 system-ui, sans-serif;
    padding:8px 14px; text-align:center; letter-spacing:.2px;
    box-shadow:0 -2px 12px rgba(0,0,0,.25);
  }
  #demoBandeau span{ font-weight:400; opacity:.85; }
  @media (max-width:640px){ #demoBandeau{ font-size:12px; padding:7px 10px; } }
</style>
<!-- ================= FIN DU BLOC DEMO ================= -->`;

const BANDEAU = `<div id="demoBandeau">🎬 Démonstration <span>- ligue, membres et listes entièrement inventés. Tout reste dans ton navigateur.</span></div>`;

function genereHtml(){
  let html = readFileSync(f('index.html'), 'utf8');
  const n = html.split(ANCRE).length - 1;
  if(n !== 1) throw new Error('ancre ' + ANCRE + ' trouvee ' + n + ' fois dans index.html, attendu 1');

  html = html.replace(ANCRE, ANCRE + INJECTION);

  // Le manifeste est celui du vrai site : le laisser proposerait d installer la vraie appli
  // depuis la demo.
  const manifeste = html.match(/^.*rel="manifest".*$\r?\n/m);
  if(manifeste) html = html.replace(manifeste[0], '');

  // Les trois <link rel="modulepreload"> vers gstatic doivent SAUTER. Une importmap ne
  // s applique pas a un preload : il garde l URL ecrite. La demo telechargeait donc pour
  // rien les vrais modules Firebase - et faisait savoir a gstatic que quelqu un regardait
  // le portfolio. Trouve par le banc outils/verif/demo.mjs le 2026-09-28, pas a l oeil.
  const avant = html;
  html = html.replace(/^.*rel="modulepreload"[^\n]*firebasejs[^\n]*$\r?\n/gm, '')
             .replace(/^.*rel="preconnect"[^\n]*gstatic[^\n]*$\r?\n/gm, '');
  const retires = (avant.match(/firebasejs/g) || []).length - (html.match(/firebasejs/g) || []).length;
  if(retires !== 3) throw new Error('attendu 3 modulepreload firebasejs a retirer, ' + retires + ' retire(s)');

  // Le bandeau se pose A LA FIN du document. index.html n a pas plus de <body> que de
  // <head> - les deux sont implicites - et chercher l un ou l autre a deja fait echouer ce
  // generateur. Un element en position fixe se moque de sa place dans le document.
  html = html.replace(/\s*$/, '\n' + BANDEAU + '\n');

  // Verification du piege : l injection doit precede le premier script ET le premier link.
  const iBase = html.indexOf('<base href="../">');
  const iScript = html.indexOf('<script');
  const iLink = html.indexOf('<link');
  if(iBase < 0 || (iScript >= 0 && iBase > iScript) || (iLink >= 0 && iBase > iLink)){
    throw new Error('le bloc demo est tombe APRES un script ou un link : app.js ne demarrerait pas');
  }
  return html;
}

/* ============================================================
   Ecrire, ou verifier
   ============================================================ */
const html = genereHtml();
const cibles = [['demo/index.html', html], ['demo/donnees.js', donneesJs]];

if(VERIFIE){
  let defauts = 0;
  for(const [chemin, contenu] of cibles){
    if(!existsSync(f(chemin))){ console.log('  ' + chemin.padEnd(22) + 'ABSENT'); defauts++; continue; }
    // Comparaison aux fins de ligne pres. Le depot est en core.autocrlf=true sans
    // .gitattributes : Git rend ces fichiers en CRLF au prochain clone, alors que le
    // generateur les ecrit avec les fins de ligne de sa source. Sans cette normalisation le
    // banc annoncerait un retard permanent apres un clone, sur des fichiers identiques.
    const meme = s => s.replace(/\r\n/g, '\n');
    const surDisque = readFileSync(f(chemin), 'utf8');
    const ok = meme(surDisque) === meme(contenu);
    console.log('  ' + chemin.padEnd(22) + (ok ? 'a jour' : 'EN RETARD sur la source'));
    if(!ok) defauts++;
  }
  const membres = MEMBRES.map(m => m.nom + ' ' + (DONNEES['leagues/' + LIGUE + '/members/' + m.id].species.length));
  console.log('  ligue fictive         ' + membres.join(', '));
  if(defauts){
    console.log('\n  Relancer : node outils/build/genere-demo.mjs');
    process.exit(1);
  }
} else {
  mkdirSync(f('demo'), { recursive: true });
  for(const [chemin, contenu] of cibles){ writeFileSync(f(chemin), contenu, 'utf8'); console.log('ecrit  ' + chemin); }
  console.log('\nEspeces disponibles : ' + ESPECES.length + (sansRarete ? ' (' + sansRarete + ' sans indice de rarete)' : ''));
  for(const m of MEMBRES){
    console.log('  ' + m.nom.padEnd(8) + String(DONNEES['leagues/' + LIGUE + '/members/' + m.id].species.length).padStart(4) + ' especes');
  }
}
