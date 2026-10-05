# PROCHAIN TRAVAIL (décidé le 2026-10-05, pas commencé) : refonte de l'onglet Ma liste

Décisions de Mathis (questions à choix, réponses fermes) :
- L'onglet n'affiche plus que **la liste** (le tableau « Mes espèces » actuel), et au-dessus **quatre
  petites box cliquables** : **Charger ma liste** (tuto), **Ajouter une espèce** (l'ajout manuel actuel,
  dans une fenêtre au centre), **Mon prénom** (fenêtre pour changer le nom), **Retirer ma liste**
  (confirmation).
- Le bloc vert « 212 espèces chargées » est **retiré** : le nombre reste dans le titre de la liste.
- Le **tuto** s'ouvre au centre et guide **une étape à la fois** : choix liste simple / avec GPS, puis
  chaque étape seule avec « Suivant », jusqu'à la zone où déposer le fichier.
- Le guide en blocs fléchés, la ligne prénom + retirer et le bloc vert disparaissent de la page.

Points à tenir en le faisant :
- Quelqu'un qui n'a PAS encore de liste : la page ne doit pas être vide - la box « Charger ma liste »
  doit sauter aux yeux, et le prénom est exigé avant le dépôt (voir handleFiles / attend-saisie).
- Garder les identifiants que le code branche (#file, #drop, #myName, #removeMineBtn, #manualAdd…)
  ou suivre chaque usage dans app.js ; .onboarding est partagé avec Profil.
- Maquetter d'abord si le doute porte sur l'aspect des box (règle des projets).
- Textes à 14 px écrits minimum, pas d'emoji décoratif dans les intitulés.

---

# En cours le 2026-10-05 (nuit) : revue de la charte page par page, avec Mathis

Mathis parcourt le site et commente ; on corrige page par page. **Rien n'est poussé** depuis
`8aa112da` : tout est commité sur `main`, il valide en local (localhost:8765) avant de pousser.
v704, app.js?v=285.

**Ma liste, refaite (fini sauf nouveau commentaire)** :
- « Inviter des amis » quitte la page : ligne du menu ☰, ouvre une fenêtre `<dialog id="inviteDialog">`.
- Guide d'import en blocs fléchés : deux départs (liste simple / avec GPS) → bloc de fin commun
  « Dépose le fichier ici ». Il a refusé la version en deux cartes détaillées (« trop complexe »).
- « Retirer ma liste » à côté du prénom ; tableau « Mes espèces » en bas (recherche, clic = fiche),
  « Ajouter une espèce manuellement » dessous.
- Petites étiquettes en capitales : GARDÉES (tranché).

**Règles décidées ce soir** (dans la charte ou la mémoire) :
- Première observation = la plus ancienne, tous pays confondus (`ingest()` ; `seenFR` lit `v.fr`).
  Les listes déposées avant gardent l'ancienne date tant qu'elles ne sont pas redéposées.
- Le gras s'arrête à 700 (`b, strong`), sauf les pastilles rondes chiffrées.

**Suite** : continuer la revue sur les autres pages, au fil de ses commentaires.

---

# Fait le 2026-10-05 soir : logo et mascotte EN LIGNE (poussé, vérifié sur la démo en ligne)

- `1ab89c0c` : le martin-pêcheur entier (retouché par Mathis dans Figma, source
  `assets/logos/sources/martin-figma.svg`) remplace la huppe : `martin.svg`, sur l'écran de
  connexion et l'écran d'attente. `mix-blend-mode:multiply` retiré (noircissait le logo en sombre).
- `5bcd682a` puis le commit suivant : le logo = la tête dans un cadre vert pâle #ddedec (essai n° 17), sur sapin #1d524e en thème sombre (`logo-sombre.svg`, bascule dans app.js après le bouton Thème) : `logo.svg`
  (entête, favicon), `logo-192/512.png` pleins (manifeste, apple-touch). v691, app.js?v=277.
- Tout se refait avec `node outils/build/icones-martin.mjs` ; les essais de cadrage et de fonds avec
  `tete-martin.mjs` (sortie dans `notes-privees/logos-candidats/martin-2026-10-05/`, hors dépôt).
- Bancs CONFORME, vérifié en local ordinateur + téléphone, clair + sombre.
- `09c858d1` puis le suivant (poussés) : la tête encadrée aussi sur les écrans de connexion et d'attente (suit clair/sombre), fond foncé à #d3e7e6 (accent à 18 %). Le choix d'un logo personnel en cliquant sur la pastille est retiré (v693, app.js?v=279).

- **Logo définitif (2026-10-05, poussé)** : la tête avec les points de la calotte et de l'aile (motifs Arrow reportés puis retouchés par Mathis dans Figma, deuxième retouche le même soir : poitrine, bande crème, haut de l'aile) ; source unique `assets/logos/sources/martin-figma.svg`, l'outil des motifs est dans `archives/logos-motifs/`. Essais rangés dans `notes-privees/logos-candidats/`, huppe dans `archives/logos-huppe/`. v696.

---

# Point fait avec Mathis le 2026-10-05 (nuit) : ce qui reste, trié

- **Poses de la mascotte : ABANDONNÉES le 2026-10-05** (« pas très utile »). Deux essais Arrow 2 à
  partir du martin du logo (poisson, jumelles devant les yeux) n'ont pas gardé son dessin ; la pose
  jumelles au cou faite sans Arrow (`outils/build/pose-jumelles.mjs`) reste dans
  `notes-privees/mascotte/poses/`. Le martin reste le logo, sans poses.
- **Vidéo : plus tard**, ticket [qg#39](https://github.com/Mathiiis7/qg/issues/39) avec toutes les retouches.
- **Fait (2501dcdf, commité, PAS poussé)** : tout ce qui servait Cornell Status & Trends est aux
  archives (`archives/status-trends/` : scripts R, injecteurs, guide, 233 `st_by_species.json`) et le
  dernier recours S&T est retiré d'`app.js` (~60 endroits, branches mortes). v697, app.js?v=281.
  Bancs CONFORME, fiche vérifiée en France et en Espagne, téléphone compris.
- Branche `sauvegarde/avant-rangement-2026-10-04` et `outils/build/build-range-gbif.mjs` supprimés
  par Mathis le même soir.
- Habitats IUCN : clos (BIRDBASE en ligne depuis le 30/09). Espèces sans carte : on n'y touche pas.
- Restent ouverts : petites étiquettes en capitales, refonte de la page des trophées (5 spéciaux en pause).

---

# Prochain sujet (décidé le 2026-10-05) : la mascotte

Design et charte finis et en ligne (voir plus bas, section du 2026-10-02 complétée le 05/10).
**Espèce choisie le 2026-10-05 : le martin-pêcheur** (il porte l'accent bleu-vert et l'orange de
la charte). Demande Arrow 2 de la fiche personnage écrite : `docs/LOGOS-DEMANDES.md`, section
« La mascotte ». Envoyée ; Mathis a retenu deux planches, copiées dans `notes-privees/mascotte/`
(planche-3.svg, planche-4.svg). Choix : **poses de la 4, tuile de la 3** (meilleur bec en petit).
`node outils/build/mascotte.mjs` en fait `mascotte-poses.svg` et `mascotte-tuile.svg` : couleurs
recalées sur la charte, fentes bouchées (2 841 pixels de trou au rendu 2400 px -> 0 ; les 336
restants sont l'espace normal entre les pattes). Comparaison avant/après :
localhost:8765/notes-privees/mascotte/voir.html. Trois retouches High ont suivi (retouche-1 à 3.svg, bilan dans LOGOS-DEMANDES section 1). **Nouvelle méthode décidée : valider d'abord le perché seul**, base = perché de la retouche 3 avec les pattes du 1er envoi greffées par `node outils/build/perche-pattes.mjs` -> `perche-base-2.svg` (échelle des pattes 1,03 réglée avec Mathis, reflet de l'œil gardé). Comparaison A/D/E : localhost:8765/notes-privees/mascotte/perches.html. **E validé par Mathis ; il le retouche dans Canva et rapporte le fichier (SVG de préférence)**, puis la demande en tête de LOGOS-DEMANDES est périmée (Arrow 2 a fait des pattes minuscules) : écrire une demande par pose avec perche-base-2.svg joint. Puis chaque pose seule, ce perché joint. Arrow 2 a échoué deux fois en fin de journée (crédit épuisé ? non vérifié). Ensuite : tuile au banc des
logos, puis manifeste, favicon, entête, démo ; décider où vont les poses. Charte à respecter : `docs/charte-graphique.md`. Logos candidats déjà essayés : mémoire
« Logo : deux candidats retenus » et `notes-privees/logos-candidats/` (hors git).

---

# Fait le 2026-10-05 : cartes GBIF en ligne (les deux dépôts poussés, démo en ligne vérifiée)

Commits : `afd03b30` (ce dépôt : code, crédits, manifeste `data/cartes-index.json`, anciens
manifestes Cornell retirés) et `43d29357` (`ornitheque-data` : 21 793 images dans `cartes/`).
Le design reste NON commité dans le dossier de travail, à part (choix de Mathis : cartes seules).
10 896 cartes (10 660 eBird, 236 présence seule, 39 espèces sans assez de données), 82,7 Mo.
Vérifié dans la démo, ordinateur et téléphone : carte annuelle, animation 12 mois, espèce en présence.
Tous les bancs CONFORME.

**Pour mettre en ligne, dans cet ordre** : pousser `ornitheque-data`, attendre que
`https://mathiiis7.github.io/ornitheque-data/cartes/hoopoe-a.png` réponde, puis pousser ce dépôt.
FAIT : poussés dans cet ordre, puis `range/` et `range-weekly/` retirés d'`ornitheque-data` (250 Mo, vérifié en ligne : 404).
Si le design doit partir en même temps, le commiter avant de pousser.

Reste éventuel : `outils/build/build-range-gbif.mjs` (ancien générateur, écrit dans
`data/range-index.json` qui n'existe plus) est obsolète.

---

# Fait le 2026-10-04 : rangement commun (e8041ead, poussé et contrôlé en ligne)

`tools/` est devenu `outils/`, et `_config.yml` retire `docs/`, `outils/`, `CLAUDE.md` et
`en-cours.md` du site. Le détail est dans la section « Rangement » de `CLAUDE.md`. Le dossier
`tools/` vide a été supprimé après redémarrage. Reste :
- la branche locale `sauvegarde/avant-rangement-2026-10-04` (la photo d'avant, design compris)
  peut être supprimée quand Mathis aura validé le design.

**Le même jour, `Documents\Projets` est devenu `Documents\0-Claude`.** Chemins corrigés partout
(a049dadb), venv de `.onetake` recréé, tâche de sauvegarde Firestore réparée. Restent les scripts
R de `outils/ebirdst/`, à corriger seulement si on les relance :
- 5 ne dépendent que du chemin du projet et remarcheront une fois ce chemin corrigé :
  `build-abundance-by-country.R`, `build-abundance-by-region-fr.R`,
  `build-abundance-by-region-multi.R`, `build-abundance-multi-country.R`, `build-st-catalogs.R` ;
- les 8 autres (et `run-parallel.ps1`) ont aussi besoin du dossier `clc` (CORINE, CGLC), qui a
  disparu avant le renommage.

# En cours - 2026-10-02 (nuit) : le design de l'appli, avant le logo

**Poussé le 2026-10-03 (c30c0696)** : les 5 « Trophées spéciaux » (Kimono, Nécrophile,
Bourriche d'huître, Wallaby, Gros Bébé) sont retirés de l'appli, gardés dans
`TROPHEES_EN_PAUSE` d'`app.js`, à reprendre avec la refonte de la page des trophées.

**EN PAUSE à la demande de Mathis.** Il reprendra par le style du site, « pas encore fini ».
Repartir de là : lui demander ce qui le gêne encore, la liste ci-dessous est l'état exact.
Tout est resté NON commité dans le dossier de travail : ne pas lancer de `git checkout` ni de
`git clean` dessus.

**Ordre décidé par Mathis** : juger le design de l'appli -> écrire une charte graphique ->
choisir l'espèce de la mascotte -> fiche personnage Arrow 2 (plusieurs poses + tête en tuile
pour le logo, sur UNE planche). L'espèce n'est pas choisie (« on va y réfléchir »).

**Fait, NON commité, à faire valider en local** (puis monter CACHE_VERSION et les deux
`app.js?v=` avant de commiter) :
- maquettes de 3 styles du Birdydex : `notes-privees/maquettes/design-birdydex.html` (servie sur
  localhost:8765/notes-privees/...). Il garde SON style, et emprunte au style A « guide de terrain » ;
- onglets sans emojis, actif seul en gras ; titres de page `h2.page-title` (24 px, 21 px tel.)
  sans emoji ni surtitre ; plus aucun `.eyebrow` (ceux qui étaient le seul nom d'un bloc sont
  devenus `.bloc-titre`) ;
- police des titres Source Serif 4 (`--titre`), 600 et 700 servis depuis `assets/fonts/`, licence OFL à côté ;
- Birdydex : compteur « **212** espèces vues sur 466 », titres de famille « X · vues sur total ».

**Le 2026-10-05** : essai de la charte commune des projets perso sur la démo (« inspiré » et
« complète », `notes-privees/maquettes/charte/`) -> refusé, **Mathis garde le style actuel et veut
une charte propre à l'Ornithèque** : ÉCRITE et commitée (a56b34cf), `docs/charte-graphique.md` ; noté au QG
(`decisions.md` et `charte-graphique.md`, commit db4028c du dépôt qg). Ticket #12 laissé ouvert
(reste l'espèce de la mascotte et le logo). Titres : essai plus petit / police du texte refusé, on
garde. **TOUT LE DESIGN EST POUSSÉ le 2026-10-05 (76349c82, v687, app.js?v=273), vérifié en
ligne** (démo : bonne version, police servie, aucune erreur). Corrigé dans ce lot : titres de page tous à la même hauteur (Ma liste avait 2 px de marge
en plus, le compteur du Birdydex poussait son titre de 4,8 px), titre « Quiz » ajouté (seule page
sans titre), fondu glissé à l'ouverture du Classement retiré. Démo régénérée. Bancs CONFORME.

**Question ouverte** : passer aussi en minuscules les petites étiquettes en capitales restantes
(AVATAR, PROGRESSION AU FIL DU TEMPS, RARETÉ, INVITER DES AMIS, en-têtes de colonnes) ?

---

# En cours - 2026-10-02 (soir)

**Retours de Mathis sur le brouillon v2 (moments 1 et 2), dans l'ordre où on les traite :**
1. **Le logo d'abord, avant toute vidéo** : il n'aime pas vraiment la huppe actuelle. Reprendre le
   travail sur le logo (voir la mémoire « Logo : deux candidats retenus » : 1-oiseau-plat et
   3-tete-sarcelle-clair, dans `notes-privees/logos-candidats/`, non suivis par git).
2. **FAIT le 02/10 : la démo étalée.** 337 points sur 84 départements au lieu de 10. Chaque membre
   a 8 coins dans son département (Indre, Bouches-du-Rhône, Jura, Gironde, Finistère) et 2 dans
   chaque département visité ; l'espèce va là où eBird la donne fréquente ce mois-là
   (`freq_by_region.json`), points tirés dans les vrais contours, nommés par le département.
   `v2-carte.py` relancé (1 349 points lus) ; le film n'est pas encore réassemblé.
3. **La vidéo, après** :
   - la police ne lui plaît pas (aujourd'hui Instrument Serif, via `.onetake/look-ornitheque.json`) :
     proposer 2-3 polices ;
   - les photos d'oiseaux qui surgissent : « top », mais leur cadre est carré alors que les cases du
     Birdydex ont des coins arrondis -> découper la carte avec le même arrondi ;
   - ça manque de rythme : plus de contraste entre moments rapides et pauses.
   Le reste du brouillon lui va.

**Vidéo, déroulé v2 : moments 1 et 2 construits, brouillon 16,8 s** (`.onetake/v2-brouillon.mp4`,
1080p30, sans son, oracle PASS). Phrases choisies par Mathis : colonne A de
`docs/VIDEO-DEROULE-V2.md`. La huppe se dessine facette par facette (59, tirées de l'image
embarquée dans `huppe.svg`), son oeil ouvre un iris sur la carte, la huppe et le nom se rangent
en haut à gauche, 12 points arrivent, 5 photos vont dans le compteur 0 à 212.
Reconstruire : `v2-extrait-logo.py`, `v2-facettes.py` (depuis `.onetake/v2/`), `v2-carte.py`,
`assemble-v2.py`, puis `render.py .onetake/film2/comp.html`.
**La démo n'a que 12 lieux** (1 349 cochages superposés aux mêmes GPS) : pas plus de points sans
inventer des données. Reste : moments 3 à 9, son, crédits, retouches de Mathis sur ce brouillon.

---

# En cours - 2026-10-02

**Sujet du moment : la vidéo de présentation, déroulé v2.** Tout est dans
`docs/VIDEO-DEROULE-V2.md` (9 moments, ~60 s, ouverture sur la huppe qui se dessine, tranché
le 02/10). Prochaines étapes : voir à quoi ressemble le gain d'un trophée, vérifier les
observations récentes dans la démo, proposer 2-3 variantes par phrase, écrire le fil qui relie
les moments. Le compteur validé vient de `outils/onetake/essai-compteur.py`.

---

Sujet précédent, toujours ouvert (cartes GBIF) :

# En cours - 2026-10-01

**Sujet : remplacer les cartes Status & Trends (Cornell interdit l'usage sur un site sans accord
écrit) par nos propres cartes, faites à partir des observations eBird publiées sur GBIF (CC BY 4.0).**

Décisions :
- pas de mail à Cornell pour l'instant (brouillon gardé : `notes-privees/MAIL-CORNELL-STATUS-TRENDS.md`) ;
- méthode validée sur 10 espèces : fréquence = observations de l'espèce / observations de tous
  les oiseaux, par case et par mois, lissée avec les cases voisines. Détail et limites dans
  `docs/sources-cartes.md` ;
- Mathis trouve les cases de 155 km beaucoup trop grosses. Les cartes « à la demande » de GBIF ne
  descendent pas plus bas : il faut le téléchargement SQL.

Où on en est :
- compte GBIF créé par Mathis (identifiant piebavarde49). Je n'utilise jamais son mot de passe :
  c'est LUI qui lance la demande, curl lui demande le mot de passe ;
- requête prête et validée par GBIF : `notes-privees/essai-cartes/gbif-requete.json`
  (espèce × mois × case de 0,25° via GBIF_DMSGCode(900), eBird seul, depuis 2015) ;
- **demande lancée le 2026-10-01 : clé `0006511-260928105237408`** (aussi dans
  `notes-privees/essai-cartes/gbif-cle.txt`), état RUNNING au lancement. L'état se lit sans mot de
  passe sur `https://api.gbif.org/v1/occurrence/download/0006511-260928105237408` ; quand c'est
  SUCCEEDED, le zip est sur `.../download/request/0006511-260928105237408.zip` et le DOI dans l'état ;
- pour relancer une demande : `notes-privees/essai-cartes/lancer-gbif.ps1` (lancé PAR LUI avec
  `powershell -ExecutionPolicy Bypass -File ...`). curl.exe ne marche pas dans le terminal de
  l'appli : la saisie masquée du mot de passe n'arrive jamais.

**Premier essai vide, cause trouvée** : la base SQL de GBIF a changé de classification. Les clés
y sont des codes (Aves = « V2 », pas 212), d'où 0 ligne avec `classKey = 212` (diagnostic
`0006538-260928105237408`). Requête refaite sans classe ni clé GBIF : elle regroupe par
`v_scientificName`, le nom tel qu'eBird le publie, donc déjà en taxonomie eBird (le piège des
sizerins disparaît). Validée par GBIF. L'ancienne requête vide n'est pas gardée.

**Vraie demande réussie : clé `0006562-260928105237408`, DOI `10.15468/dl.c7y4kg`** (celui à citer),
45 881 584 lignes, zip de 1,33 Go, gardé par GBIF jusqu'au 1er avril 2027 (indéfiniment si on cite le DOI).
Zip : `https://api.gbif.org/v1/occurrence/download/request/0006562-260928105237408.zip`.

Reste à faire :
1. récupérer le zip (taille inconnue, peut-être plusieurs centaines de Mo), le traiter en flux ;
2. FAIT le 2026-10-01 : correspondance des noms. Zip téléchargé (`notes-privees/essai-cartes/gbif-ebird.zip`,
   1,33 Go, lu en flux en 55 s par `bilan-gbif.mjs`) : 1 485 098 423 obs, 10 716 noms, 132 954 cases.
   59 noms GBIF suivent une autre version de la taxonomie : tous rattachés dans `gbif-renommages.json`
   (`fige-renommages.mjs` ; les espèces que GBIF sépare et que l'appli range en sous-espèces sont
   ADDITIONNÉES à l'espèce parente). Le rapprochement par épithète seule s'est trompé une fois
   (grive -> Akialoa disparu), corrigé à la main. Bilan : 10 699 espèces vivantes sur 10 994 ont des
   données ; 295 n'en ont pas (`especes-sans-donnees.txt`), surtout les espèces sensibles qu'eBird
   masque (perroquets, chouettes, tétras rares). 61 d'entre elles ont une carte aujourd'hui :
   Décision de Mathis : le plus de cartes possible. 239 des 295 ont des observations dans les AUTRES
   sources GBIF (381 532 obs depuis 2000, `autres-sources.tsv`), dont 51 des 61 qui ont une carte
   aujourd'hui ; les 56 restantes sont quasi disparues ou des séparations récentes, « on verra ».
   La récolte page par page par l'API (`recolte-autres-sources.mjs`) était trop lente (~7 h, pages
   figées) : remplacée par une demande groupée, **clé `0006783-260928105237408`, DOI
   `10.15468/dl.rb9sut`** (à citer aussi), `gbif-autres.zip` (1,9 Mo, 78 792 lignes, mêmes cases
   0,25°, colonnes species, v_scientificName, mois, case, n). Relu par `bilan-autres.mjs` avec
   `gbif-autres-noms.json` : **236 des 239 espèces**, toutes les lignes rattachées. Piège : la base
   SQL range certaines espèces eBird en sous-espèces (« Gygis alba microrhyncha ») : genre + 3e mot.
   Écarts avec le comptage API = observations sans mois (Chouette de l'Oural : 73 000 sur 103 000),
   inutilisables pour les cartes mensuelles. Ces cartes-là sont des cartes de présence : pas de
   correction par l'effort comme pour eBird ;
3. générer cartes annuelles + 12 mois pour toutes les espèces, rendu fondu
   (`notes-privees/essai-cartes/essai-fondu.mjs` comme base), comparer, puis brancher dans l'appli
   et retirer Status & Trends (cartes, animation hebdo, mentions) ;
4. citer le DOI du téléchargement + CC BY 4.0 dans l'À propos.

Page de comparaison : http://localhost:8765/notes-privees/essai-cartes/
