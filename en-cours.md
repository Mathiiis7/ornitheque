# POUSSÉ le 2026-10-18 : chants douteux retirés des deux parcours (v817, app.js?v=391)
- XC 692351 était un Pouillot de Sibérie (collybita tristis, Herblay en décembre) : retiré. Puis les 146 fiches xeno-canto relues : espèce, « song », mois, sons et sonagrammes tous bons ; retirés aussi 400300 (nonnette ou boréale), 879546 (noire près d'une boréale), 884077 et 804603 (grimpereau des jardins atypique). Raisons notées dans outils/build/chants-gardes.mjs.
- Restent 63 chants (mésanges) et 79 (phrases). Vérifié en ligne. Les deux parcours sont ARRÊTÉS là pour le moment (Mathis).
- Suite décidée par Mathis : « les trucs annexes du quiz » (à préciser avec lui). Toujours ouvert : ordre et noms de tous les parcours.
---
# POUSSÉ le 2026-10-18 : progression du quiz protégée + sonagramme après le chant (v815, app.js?v=389)
- Progression « réinitialisée à chaque mise à jour », toujours sur le site en ligne : aucun code ne l'efface. Cause probable (non prouvée chez lui) : mémoire du site pleine, les 40 anciennes versions du cache de photos (mb-sp-photo-cache-v1 à v40) n'étant jamais effacées ; l'écriture de mb-parcours-* échouait en silence. Corrigé : purge des anciennes versions au démarrage, _stockageEcrire() (libère les caches et réessaie) pour progression, stats, oiseaux de l'entraînement, indices ; cache de photos plafonné à 2 500 espèces.
- Testé en remplissant la mémoire du navigateur intégré : anciennes versions purgées, progression gardée, réglage enregistré malgré la mémoire pleine.
- Sonagramme : téléchargé seulement au premier « playing » du chant, fetchPriority low (il retardait le chant). Vérifié : démarre après le chant, prêt au verdict.
- Poussé. Vérifié en ligne (navigateur intégré) : une progression écrite en v387 est toujours là après le passage à v389. Reste à voir si elle tient chez lui.
- Ouvert : ordre et noms de tous les parcours (demande de Mathis, à réfléchir).
---
# EN LOCAL le 2026-10-17, PAS POUSSÉ : cercles d'indices, réécouter, numéros des chants (v805, app.js?v=379)
- Commits 5c7426eb, 8bfc073e, 6dae1a20. Cercles DANS chaque réponse « Quel oiseau chante ? » : strophe (courte/moyenne/longue), motif (une note / deux hauteurs / petits pics / aigu puis trille), onomatopée (oreille, pas pour la bleue). Couleurs « sous-bois », textes de Mathis au survol (PC_CERCLES, sans répéter le titre). Absents des étapes 6 et 7 ; « Masquer / Afficher les indices », état gardé en mémoire de page.
- « Réécouter (n) » : menu dans l'entête de la question, et liste sur les écrans de fin. Chaque chant affiche « Chant n° XC <id> · <enregistreur> » en gris clair : Mathis signalera un son bizarre par ce numéro.
- Boutons à anneau partout (trois chants de « Nom vers chant » / étape 5, Réécouter) ; anciens ronds orange retirés.
- Vérifié sur la démo (1300 clair, 375 sombre), 11 bancs CONFORME. Reste : qu'il revérifie « Afficher les indices » chez lui (cause probable non prouvée : écriture localStorage qui échouait), puis pousser.
- Maquettes de cette conversation dans notes-privees/maquettes/criteres/ (remarques.html, cercles.html, sonos/). Vocabulaire fixé : strophe > motif > note. À reporter : « le pouillot alterne entre deux hauteurs » dans docs/criteres-chants.md (corrigé seulement dans criteres/index.html).
---
# EN LOCAL le 2026-10-17, PAS POUSSÉ : accueil du quiz refait en tableau (v799, app.js?v=373)
- Maquette C choisie (notes-privees/maquettes/quiz-accueil-2/) : collé en haut et pleine largeur comme les autres pages, phrase d'intro, entraînement en boîtes de Ma liste, parcours en lignes comme son tableau. Le chemin et les parties restent centrés et agrandis.
- 10 familles « Bientôt » ajoutées pour voir la place (fausses, assumé par Mathis). Dans l'entraînement, leurs oiseaux grisés sont remplacés par une ligne.
- Vérifié sur la démo à 1280 clair et 375 sombre ; aller-retour accueil, chemin, page d'un mode.
---
# EN LOCAL le 2026-10-17, PAS POUSSÉ : entraînement du quiz, qg#56 (v798, app.js?v=372)
- Sous les parcours, 4 cartes : Chant vers nom, Nom vers chant, Nom à écrire, Points faibles. Choix de Mathis sur la maquette notes-privees/maquettes/quiz-entrainement/ : E1, N2, noms C. Décisions dans docs/refonte-quiz.md.
- Vérifié sur la démo : les 4 modes joués jusqu'au bout à 1280 clair, page de choix et nom à écrire à 375 sombre (cibles 44 px), parcours inchangé, 11 bancs CONFORME.
- Reste : qu'il essaie en local, puis pousser.
---
# EN LOCAL le 2026-10-16, PAS POUSSÉ : étoiles sur l'écran de fin d'étape (v795, app.js?v=369)
- Trois grandes étoiles (44 px) au-dessus du score : celles de CETTE partie, le chemin garde la meilleure. Les pleines arrivent l'une après l'autre.
- Vérifié sur la démo : 10/10 (3) à 1280 clair, 9/10 (2) à 375 sombre, 5/10 (0, trois vides) ; 11 bancs CONFORME.
---
# 2026-10-16, fin de journée : critères des chants, OÙ ON EN EST (qg#60)
- Forme VALIDÉE pour de bon (cases figées dans la maquette notes-privees/maquettes/criteres/index.html, 5 chants par oiseau).
- Notes refaite (cases indépendantes, ✓ / parfois / ✗, définitions dans docs/criteres-chants.md) ; bleue tout en « parfois », charbonnière « notes variées » parfois, nom « Notes variées » gardé. Famille « Début et fin » retirée.
- Mathis a du mal à tout classer (« j'ai vraiment du mal ») : les oiseaux varient trop pour des cases nettes. Ne pas enchaîner les familles suivantes sans lui demander comment il veut avancer.
- Page d'écoute : notes-privees/maquettes/criteres/ecoute-charbonniere.html (un cri possible dans 862138, pas vérifié).
---
# 2026-10-16 : critères des chants, les 66 chants analysés (qg#60, docs seulement)
- Grille de docs/criteres-chants.md complétée : hauteur mesurée sur les 66, rythme et forme à l'œil sur 21 strophes, « Ralentit » ajouté. Rapport : notes-privees/analyse-sons/2026-10-16-criteres-mesanges/RAPPORT.md.
- Le comptage automatique des notes a échoué (notes à crochet comptées double) : ne pas réutiliser strophes.py/juge.py pour le rythme.
- Tranché par Mathis : « très aigu » = haut des notes ; ligne « Notes qui glissent d'un trait » ajoutée (sépare charbonnière et noire).
- EN ATTENTE DE MATHIS : valider la grille à l'oreille ; note à crochet = une ou deux ; timbre ; « sans s'arrêter ». La maquette notes-privees/maquettes/criteres/ ne suit plus la grille.
---
# EN LOCAL le 2026-10-16, PAS POUSSÉ : nouvel accueil du quiz, L1 + C3 (v793, puis v794 / app.js?v=368)
- v794 : anneau de l'étape choisie recentré sur le rond + son relief ; oiseaux tirés au hasard avec minimums (3/2/1/1, docs/refonte-quiz.md), vérifié sur 10 000 tirages.
- Onglet Quiz = les parcours en cartes (mésanges ouvert, « Merle et grives » et « Fauvettes » grisés « Bientôt ») ; toucher la carte ouvre le chemin.
- Chemin : ondule en largeur à partir de 700 px de large (pixels du parcours), vertical en dessous. Icône par genre, étoiles sous les étapes faites, l'étape en cours cerclée d'orange, bulle sous l'étape touchée.
- Tranché seul : une étape fermée montre aussi sa bulle (« Réussis l'étape N pour l'ouvrir », sans bouton) ; la hauteur du chemin est réservée pour la plus haute bulle, sinon tout le parcours sautait à chaque étape touchée (il est centré dans le panneau).
- Étoiles : 1 au seuil, 2 à une erreur, 3 sans faute (_pcEtoiles) ; l'écran de fin d'étape ne les montre pas encore.
- Vérifié sur la démo locale : 1200 px et 375 px, clair et sombre, partie jouée jusqu'au bout puis retour au chemin, cas rien joué / tout fini / épreuve 13 et 11 sur 15. Bancs : 11 conformes.
---
# EN LOCAL le 2026-10-16, PAS POUSSÉ : le parcours grandit avec l'écran (v792, app.js?v=366)
- Facteur --pc-k (zoom CSS) calculé par _pcHauteur sur la place disponible : 1 jusqu'à ~1280x720, 1,33 à 1680x1050, 1,37 à 1920x1080, plafond 1,5. Référence : question à 5 réponses + verdict = 720 px CSS.
- Page des étapes en colonne centrée (880 px avant zoom), étapes restantes sur deux colonnes au-dessus de 900 px.
- Place du verdict réservée (140 px) : les réponses ne bougent plus quand il apparaît (mesuré).
---
# EN LOCAL le 2026-10-16, PAS POUSSÉ : panneau du Quiz plein écran (v791, app.js?v=365)
- Tout l'onglet Quiz : le panneau descend jusqu'en bas de l'écran (_pcHauteur, recalculé au redimensionnement), le parcours se centre en hauteur dedans, le pied de page n'apparaît qu'en défilant. Mesuré à 1680x1050, 1280x720 et au téléphone.
---
# EN LOCAL le 2026-10-16, PAS POUSSÉ : réponses revenues en barres (v789, app.js?v=363)
- Grandes cartes photo jugées « bof » : barres pleine largeur (680 px max), photo 52 px à gauche du nom, coche/croix à droite.
- Bouton pause : variante D choisie (planche notes-privees/maquettes/quiz-visuel/pause.html), en place en v790 (app.js?v=364) : rond clair, anneau orange qui avance avec le chant, triangle centré sur son centre de gravité (écart mesuré 0,15 px). L'étape 5 garde ses petits boutons orange.
---
# EN LOCAL le 2026-10-16, PAS POUSSÉ : cartes plus grandes, pause de 2 s, plus de trait (v788, app.js?v=362)
- La partie prend la largeur des cartes (jusqu'à 290 px chacune), photos carrées : 5 cartes de 230 px d'écran à 1280 (141 avant). Téléphone : photos en 4/3, les 5 tiennent dans 812 px.
- Pause après la réponse : 2 s (1 s passait trop vite). Le trait qui se vidait pendant la pause est retiré.
---
# EN LOCAL le 2026-10-16, PAS POUSSÉ : visuel du quiz refait, « Sentier » + grandes cartes photo (v787, app.js?v=361)
- 3 directions maquettées (notes-privees/maquettes/quiz-visuel/) ; Mathis a choisi A « Sentier », avec les réponses en grandes cartes photo de B.
- Page des étapes : oiseaux de l'étape en photos rondes (la nouvelle entourée d'accent, mot « nouvelle » toujours caché), liste numérotée, icônes au trait au lieu de ✓ et 🔒.
- Question : 10 segments verts/rouges, son dans un bandeau (bouton orange, temps écoulé), cartes photo 4/3 avec coche/croix, ligne « C'était : … » et trait qui se vide pendant la pause de 1 s. Sonagramme gardé sous le verdict.
- Étape 5 (un oiseau, 3 chants) : mise en page inchangée, couleurs alignées.
- Vérifié 1280, 375 et sombre sur la démo, aucune erreur, 11 bancs CONFORME. Au téléphone, les oiseaux de l'étape passent sur deux lignes (3 + 1).
---
# EN LOCAL le 2026-10-16, PAS POUSSÉ : barre fluide, suite automatique, vignettes photo sans nom latin (v786, app.js?v=360)
- Barre du chant suivie à chaque image (requestAnimationFrame) au lieu de timeupdate. « , nouvelle » reste pour les lecteurs d'écran.
- Après une réponse : plus de boutons Suivante ni Réécouter, la suite arrive seule après 1 s (PC_PAUSE_SUITE_MS). Touche Entrée retirée.
- Parcours : nom scientifique retiré partout (choix, photo, verdict) ; petite photo arrondie 48 px à gauche de chaque choix (.pc-vign, _fetchWikiPhoto). Prototype : même photo à côté du nom.
- Prototype du tableau des critères : notes-privees/maquettes/criteres/ (familles en colonnes, oiseaux en lignes, coches et croix dessinées, 3 exemples à écouter par oiseau).
- Critères des chants (qg#60) : grille universelle dans docs/criteres-chants.md, 18 critères en 6 familles + « Sans s'arrêter » mis de côté au bout. Familles validées par Mathis ; « Ralentit » à ajouter dans Rythme.
- EN PAUSE. Pour reprendre : commencer par analyser moi-même les 66 chants gardés (voir « Pour reprendre » dans docs/criteres-chants.md), puis remplir les « ? ».
- Affichage voulu : dans chaque parcours pour ses espèces, plus un tableau d'ensemble depuis la page Quiz, là où seront regroupés tous les parcours.
---
# EN LOCAL le 2026-10-16, PAS POUSSÉ : le parcours joue les chants choisis par Mathis (v783)
- 66 chants écoutés et gardés, dans data/parcours-mesanges.json (outils/build/chants-gardes.mjs). Plus de _fetchXenoSound dans le parcours.
- Corrigé en testant : un audio retiré de la page continuait de télécharger, 25 questions rapides bloquaient le chant suivant (_pcLibererSons).
- Rien en attente de son côté. Suite possible : qg#65 (cris, enregistrements comme dehors).
---
# EN LOCAL le 2026-10-15, PAS POUSSÉ : parcours du quiz (v782, app.js?v=356)
- Page Quiz = parcours en 7 étapes (maquette C, notes-privees/maquettes/parcours-quiz/), mésanges + pouillot véloce. Décisions dans docs/refonte-quiz.md.
- Ancien quiz (défis, classé, classement) masqué dans #quizAncien, plus initialisé ; code gardé (_quizAncienInit).
- Progression dans le navigateur seulement (mb-parcours-mesanges), pas dans Firestore. Enregistreurs variés dans une partie.
- Vérifié 1280 et 375 sur la démo, étapes 1, 5, 6, 7 jouées, déblocage à 8/10, 11 bancs CONFORME. Visuel à retravailler plus tard (dit par Mathis).
---
# EN LIGNE le 2026-10-15 : entête immobile en défilant (v781, app.js?v=355)
- .entete-fixe en top:0 (le top:-16px de la v779 la faisait remonter au début du défilement : bizarre pour Mathis).
- 24 px au-dessus du logo (26 avant, 20 essayé), onglets à 12 px sous le logo (16 avant) : les onglets restent à la même hauteur.
- Vérifié 1280 et 375 sur la démo, logo et onglets fixes de 0 à 3000 px défilés, 11 bancs CONFORME.
---
# EN LIGNE le 2026-10-15 : entête fixe, plus de « ? » au Birdydex, moins de vide en bas (v779, app.js?v=353)
- Birdydex : les espèces à découvrir gardent fond doré et aura, sans le « ? » (photo toujours cachée jusqu'au toucher).
- Logo, thème et onglets dans .entete-fixe (sticky, top:-16px) : restent en haut en défilant, 10 px au-dessus du logo ; au repos rien ne bouge.
- Pied de page : 28 px sous le texte (80 avant) ; la démo garde 80 px pour son bandeau (genere-demo.mjs, « html .wrap »).
- Vérifié 1280 et 375 sur la démo, 11 bancs CONFORME. Rien en attente.
---
# EN LIGNE le 2026-10-15 : interrupteur de thème, entête à mi-chemin (26 et 16 px), carte « À ne pas confondre » retirée du code (v776, app.js?v=350)
- Interrupteur soleil/lune (variante B de notes-privees/maquettes/theme/), bille placée par la CSS selon le thème réel.
- Onglets à 10 px sous le logo (22 avant) ; haut de page 24 px (28 avant, 18 essayé et jugé trop haut).
- Vérifié 1280 et 375, clair et sombre, 11 bancs CONFORME. Vu en passant : le thème n'est pas retenu d'une visite à l'autre.
- Syrinx : idées notées en qg#55 à qg#64 (en réserve), détail dans docs/inspiration-syrinx.md.
---
# EN LIGNE le 2026-10-15 : pastille TOI et palette d'emojis (v772, app.js?v=348)
- « TOI » : variante C (11,5 px gras, maquette notes-privees/maquettes/toi/tailles-gras.html), centrée par flexbox à côté du prénom dans le classement et « Les observations de qui ? » ; 8 px avant.
- Emojis : EMOJI_GROUPES, 363 en 9 familles titrées, grille 8 colonnes. Emojis iPhone sur PC : non (dessins d'Apple non réutilisables), réponse donnée.
Vérifié 1100 px et 375 px, 11 bancs CONFORME. Reste : qu'il regarde en local, puis pousser.
---
# EN LIGNE le 2026-10-14 : fil, tchat et photos refaits (v768, app.js?v=344). Chantier clos.
# (détail ci-dessous ; dernier correctif : un clic redessiné ne ferme plus le panneau)
- Photos : grille 2 colonnes (1 au téléphone) qui défile seule, cartes = moitié de sa hauteur (container-type,
  100cqh) : pas de photo coupée en haut, 10 px d'air. Fiche d'une photo (_ouvrirFichePhoto) pour réactions,
  commentaires, suppression. Zoom de l'image ouverte (_zoomImg : molette, pincement, double-clic, glisser).
  Préchargement des vignettes rapporté à la grille (_thumbIOZones) ; banc photos ouvre le panneau et défile pas à pas.
- Tchat : heure à côté du nom, actions au survol à côté de la bulle (dans le flux au doigt) : 7 px entre messages.
- Palette d'emojis contre le bouton qui l'ouvre (_placeEmojiPop). Envoyer/supprimer en icônes au trait.
- Fil : chiffre blanc partout, niveau en couleur, drapeau du pays, plus d'« ajout manuel », latin à 90 % d'--ink-3,
  bulles d'aide sur Nouveautés/Chronologique, pastilles numérotées dans le choix de rareté.
- Panneaux recalés au redimensionnement et arrêtés au-dessus du bandeau de la démo.
Vérifié 780 px et 375 px, 11 bancs CONFORME. Reste : qu'il regarde en local, puis pousser.

# FAIT le 2026-10-14 (pas poussé) : fil refait, écrou, tchat (v763, app.js?v=339)
- Fil : maquette A choisie (notes-privees/maquettes/fil/), rangé par jour (jour d'ajout en Nouveautés, d'observation en
  Chronologique), pastille numérotée (chiffre blanc ou foncé selon le contraste, _texteSur), prénoms sans couleur,
  réagir/commenter en icônes au bout de la ligne, une ligne « depuis ta dernière visite ». Filtres personne et rareté
  en fenêtre centrée (_openFilterPicker), voulu par Mathis plutôt qu'une liste déroulante.
- Écrou à la place du ☰, panneaux jusqu'en bas, icônes au trait colorées dans le tchat, champ du nom masqué.
- Fil, Photos, Tchat en icônes dans la barre (commit b559c9d7).
Vérifié 1000 px et 375 px, 11 bancs CONFORME. Reste : qu'il regarde en local, puis pousser.
---
# EN LIGNE le 2026-10-14 : schéma « D'où vient la rareté » dans À propos (v760, app.js?v=336, ticket qg#50 déjà fermé)
Variante A de la maquette du QG, en HTML (classes `.rar-titre` à `.rar-ici` dans styles.css), sous le texte des 10 niveaux :
barres du martin en France (freq_48.json), moyenne pondérée 8,1 %, échelle des 10 niveaux. Vérifié 1280 clair et 375 sombre,
pas de défilement horizontal, étiquettes de seuils sans chevauchement, bancs CONFORME, démo régénérée.
Écartés par Mathis : rareté pays par pays (aucune). Gardés en idées : taille comparée (qg#53), comparer aux espèces qui se ressemblent (qg#54).
Vus en passant, pas touchés : Sri Lanka trié après les pays « absente » dans le sélecteur de pays ; `REAL_FREQ` est l'ancien pic
(0,178 contre 0,081 pour le martin) et sert encore à départager deux espèces de même niveau ; chiffre blanc sur pastille jaune (niveau 5) à 2,2:1.
---
# EN LIGNE le 2026-10-12 : page À propos refaite (v758, app.js?v=334)
Pleine largeur (bridée à 900 px avant), textes relus contre le code et allégés : rareté par pays, zones,
sources à jour (iNaturalist, INPN), plus d'anglicismes, phrase « facteur 3 » et date du 23/09 retirées.
Plus le schéma ci-dessous, allégé à sa demande.

# schéma « D'où viennent les cartes » dans À propos (v754, app.js?v=330, commit 9f8c6498)
Ticket qg#49, demandé par la session QG. Refait en HTML (classes .carto-*), cases empilées sous 760 px.
Chiffres revérifiés : 10 896 cartes, 82,7 Mo de PNG, 1 775 781 186 observations (API GBIF).
Vérifié dans la démo : ordi 1280 et téléphone 375, clair et sombre, 11 bancs CONFORME.
Ticket qg#49 fermé une fois en ligne.

---
# FAIT le 2026-10-12 (pas poussé) : Classement et fiche espèce (v743, app.js?v=319)
- Qui a vu quoi : en-tête et colonne Espèce collés (tableau borné à 75 vh), colonnes dans l'ordre du
  classement sans filtre, lignes à 37,9 px aux trois tris (étiquette de rareté amincie).
- Liste des pays de la fiche : se retrie quand les données des pays étrangers arrivent (elle restait
  dans l'ordre du code à la première ouverture).
- Monténégro : paliers recalculés (293/308 faux, remis à l'ancienne version le 27/09 ; profil
  d'effort effacé le 26/09 par inject-rarity-multi-country, qui fusionne désormais).
- Exotiques (v745, app.js?v=321) : _exoticCategory lit eBird FR (Cygne noir, Faisan vénéré, Colin de
  Californie passent N, donc comptent dans le score de rareté réelle) ; plus de lettre sur une ligne
  de pays « absente » (Capucin bec-de-plomb en Suisse).
- Carte des statuts exotiques : bleu partout où l'espèce est vue sans classement, gris = non observée.
- Pays sans statut national : lettres des zones si au moins la moitié des zones où l'espèce est vue
  la classent (EXOTIQUES_ZONES_MAJORITAIRES, outils/build/exotiques-majoritaires.mjs, 96 cas ; à
  relancer après inject-exotic-by-region). Capucin en Italie : X. Seul cas douteux : Oie cendrée ME.
- Étiquette TOI : variante B (pastille d'origine 20 px, texte 10,5 px centré à l'encre), choisie sur
  notes-privees/maquettes/toi/.
Dernière version : v750, app.js?v=326. Vérifié dans la démo, 11 bancs CONFORME. Reste : qu'il
regarde en local, puis pousser.

---
# FAIT le 2026-10-11 (pas poussé) : le dépôt eBird fait foi (v738, app.js?v=314, commit 307ca46a)
Un ajout à la main absent du CSV disparaît désormais au dépôt suivant (avant : gardé pour toujours, et aucun bouton pour retirer).
Vérifié dans la démo : dépôt 3 espèces + 1 à la main, redépôt de 2 -> il en reste 2. Bancs CONFORME.
Quota Firestore dépassé le 11/10 (lecture admin refusée) : son redépôt doit se faire après la remise à zéro (~9 h).
En suspens : texte du formulaire d'ajout (« pas encore dans ton export eBird ») à revoir avec lui.

---
# EN LIGNE le 2026-10-11 (tard) : cases « à découvrir » dorées (v737, app.js?v=313)
Plus de photo sur une espèce à découvrir : vignette légèrement dorée, « ? » doré, aura dorée (variante 8f,
choisie sur deux planches : notes-privees/variantes-a-decouvrir/). Indices de la scène : plus de flou en sortie.
Son « bug » venait de la démo : elle compare un dépôt à la fausse liste de 212 espèces, pas à la sienne.
Sur le vrai site, son dépôt du soir a bien trouvé ses 10 nouvelles (vérifié dans Firestore).

---
# EN LIGNE le 2026-10-08 : le guide s ouvre a chaque ouverture de la demo (v733, app.js?v=309)
Demande depuis la conversation portfolio. Script ajoute par outils/build/genere-demo.mjs (clic sur « Guide du site »
une fois connecte et les boutons flottants visibles) : la vraie appli ne l ouvre toujours qu apres le premier depot.
demo/?sansguide le laisse ferme, pour les captures. Ordre du guide (vraie appli aussi) : accueil, Carte, Birdydex,
fiche, pays, Ma liste, Classement, puis la suite. Verifie ordi 1280 et telephone 375, 18 bulles, bancs CONFORME.

---
# FAIT le 2026-10-11 (nuit) : « Bruant lapon ? » bord de mer, 6:15-6:35 (son seul, hors appli)
Rapport : notes-privees/analyse-sons/2026-10-11-bruant-lapon/RAPPORT.md (3 passes). Merlin proposait lapon ET farlouse.
Bruant lapon, bonne confiance sans certitude : DEUX crécelles jumelles (6:24,3 et 6:24,9), dessin que
12 autres espèces côtières (222 enr., dont 54 Pipits farlouses) ne reproduisent pas. Le gazouillis
aigu seul ne sépare pas lapon et farlouse. Linotte écartée (50 enr.) : ses notes ont une trace grave vers 2-3 kHz, pas les tiennes. Passe 5 : 20 espèces, 549 enr. ; 14 jumelles hors lapon, 6 écartées par la trace grave, 8 à l'œil (trilles de Bruant jaune, Verdier, Tarier...). La longueur des séries n'a pas pu être mesurée (series.py échoue). Prochaine étape utile : un expert (vérificateur eBird, forum) avec l'extrait et les sonagrammes. Passe 7 (12/10) : le Bruant zizi n'est PAS exclu (un enregistrement, XC385614, fait des groupes très proches) ; lapon toujours le plus probable. Dossier neutre pour Faune France prêt (faune-france-neutre/). Passe 8 : lieu = Bouin (85), buissons ; lapon absent des données eBird de Vendée, zizi 4-23 % ; seul un JEUNE zizi (XC385614) fait la même crécelle. Verdict : le son dit lapon, le lieu dit zizi, indécidable sans expert. Puis (vu par Mathis) : ses tics montent puis descendent (« ∧ »), comme le lapon ; le jeune zizi ne fait que descendre -> le son repenche lapon. EN PAUSE le 12/10 : Mathis attend l'avis du forum Faune France ; pour reprendre, section « POUR REPRENDRE » en tête du RAPPORT. Sonagramme et extraits à écouter : dossier ecoute/.
Outils : crecelle.py, qui_crecelle.py, deuxieme_crecelle.py, duel.py, fenetres.py (LISEZMOI). Rien à pousser.

---
# EN LIGNE le 2026-10-11 : espèces à découvrir (v736, app.js?v=312, fusionné avec le guide de la démo)
3e passe, à sa demande : après un dépôt eBird, fenêtre « N nouvelles espèces ! » -> « Voir le Birdydex » ;
les nouvelles y attendent sur fond teinté (.a-decouvrir, gardées en localStorage par compte), les toucher
joue la scène. Scène ralentie (indices 1,3 s, carte à 4,7 s). Carte au style du site (grande case du
Birdydex), plus de bronze/argent/or. Ajout manuel : scène tout de suite (validé par lui). Vérifié dans la
démo, ordi et téléphone sombre. Poussé à sa demande.

# (2e passe) espèce débloquée façon walkout (commit f5d76aff, v734)
2e passe, à sa demande : bouton renommé « Ajouter à ma liste » ; la carte sobre (« pas ouf ») remplacée par
une scène plein écran façon FIFA (faisceaux, indices pays/famille/palier, carte bronze/argent/or/spéciale
qui arrive en tournant, flash, étincelles). Vérifié dans la démo : ordi 1280, téléphone 375, dépôt de
5 espèces (la plus rare en vedette), passer d'un clic. Reste : son avis sur la scène, puis pousser.
Historique de la 1re passe ci-dessous (le bouton s'y appelait encore « Je l'ai vu »).

# (1re passe) espèce débloquée + « Je l'ai vu » (commit 9bdbc0d7, v733)
Demandé par Mathis : une animation quand on débloque un oiseau, et ajouter un oiseau depuis le Birdydex.
Ses choix (questions à choix) : bouton DANS LA FICHE ; animations « révélation de la vignette » ET
« carte plein écran », à tester toutes les deux.
- « ＋ Je l'ai vu » (en-tête de la fiche, seulement si l'espèce est grisée) -> fenêtre d'ajout pré-remplie
  (espèce + pays de la fiche ; date et lieu à donner). Visible dans toutes les fiches, pas seulement
  depuis le Birdydex : à lui de dire si ça lui va. La fenêtre d'ajout vit désormais au niveau de la page.
- Ajout réussi (fiche ou Ma liste) ou re-dépôt eBird avec des nouveautés (pas au 1er dépôt, ni les « sp. »)
  -> carte au centre (photo silhouette -> couleur) ; en la fermant depuis la fiche, la fiche se ferme
  et la case du Birdydex se révèle (rebond, halo) + bandeau 3 s. Interrupteurs DEBLOQUE_CARTE /
  DEBLOQUE_REVELATION dans app.js.
- Vérifié dans la démo : ordi 1280 clair, téléphone 375 sombre (pointer coarse, 44 px), filtre
  « Manquantes » (pas de révélation, pas d'erreur), Échap/flèches. Re-dépôt eBird SIMULÉ dans la démo
  avec un export fabriqué (2 espèces + un « duck sp. » écarté). Bancs CONFORME.
- Reste : ses retours sur les deux effets (garder les deux, ou un seul) et les textes (bouton, carte,
  bandeau) ; puis pousser.

---
# FAIT le 2026-10-11 (soir) : vidéo 3, Les Moutiers-en-Retz (bruant.mp4, 25 s)
Section « Vidéo 3 » du même RAPPORT.md. Bruant des roseaux sûr (cri net à 20,3 s), trois autres cris
du même dessin non prouvés par la mesure ; le reste est surtout des voix humaines. Références ajoutées :
Bergeronnette grise (14) et des ruisseaux (15). Rien à pousser.

---
# FAIT le 2026-10-11 : analyse des deux vidéos « Bruant roseaux » (son seul, hors appli)
Rapport : notes-privees/analyse-sons/2026-10-11-bruant-roseaux/RAPPORT.md (257 références xeno-canto).
Bruant des roseaux sûr (5 cris « tsiu »), Pouillot véloce probable (1 « huit »), 5 notes plates
vers 4 kHz sans nom, babil de la vidéo 1 non attribué. Milieu donné (roselière) : 6 espèces d'étang testées,
aucune ne colle ; piste non prouvée : notes de chant du Bruant. Rien à pousser.

---
# EN LIGNE le 2026-10-07 : « France entier » retiré (e714d7ff, v732, app.js?v=308)
Bouton pays du Birdydex : « France » ; première ligne des listes de zones (Birdydex et fiche) :
« Tous les départements » en France, « Toutes les régions » ailleurs (`libelleToutesZones`) ; note du
graphique des mois : « affichage pour tout le pays ». Vérifié dans la démo (ordi + téléphone, Espagne), bancs CONFORME.
Vérifié en ligne (v732, app.js?v=308). Capture du Birdydex du portfolio refaite sur la démo en ligne.

---
# EN LIGNE le 2026-10-07 : le guide du site (v730, app.js?v=306), vérifié sur la démo en ligne
Choix de Mathis (questions à choix) : **visite guidée** qui pointe chaque partie du vrai écran,
**proposée juste après le premier dépôt** (« Plus tard » / « Découvrir le site », le tuto ne change
pas), **rouvrable par « 🧭 Guide du site » dans le menu ☰**.
- 17 étapes + accueil : les six onglets, la fiche espèce (ouverte puis refermée par le guide), le pays du Birdydex, Fil, Photos, Tchat, le menu ☰ puis chacune de ses lignes (Profil, Requêtes, À propos, Inviter, Guide du site), menu ouvert par le guide.
  Tout est dans `GUIDE_ETAPES` (app.js, après les fenêtres de Ma liste) ; styles `.guide-*`.
- Vérifié dans la démo : ordinateur 1280×800 et téléphone 375 (pointer coarse, boutons 44 px
  d'écran), clair et sombre ; bulle dans l'écran et hors de sa cible à chaque étape ; Échap,
  Retour, « Plus tard » ; l'onglet de départ revient à la fin ; nouveau venu simulé (fiche
  retirée dans le bouchon + code `mb-invite`) -> la proposition s'ouvre après le dépôt. Bancs CONFORME.
- Reste : rien d obligatoire ; il peut encore retoucher les textes des bulles.
- Ticket qg#45 « Faire le guide » fermé.

---
# EN LIGNE le 2026-10-06 : relecture « recruteur », schémas communs, noms latins en police du texte (v722, app.js?v=298)
Suite de la revue : la prochaine page qu'il choisira. Il regarde en local, puis on pousse.
- Noms latins : une seule règle en fin de styles.css, police du texte en italique (Palatino essayé puis refusé).

- Infos privées retirées du public : trophées en pause (nom complet d'un ami) déplacés dans
  notes-privees/TROPHEES-EN-PAUSE.md, « Maël ne l'a pas » ôté du Pic noir, prénoms du banc de perf
  neutres, README remis à jour (plus de Cornell S&T ni de lien vers un tableau privé). L'historique
  git garde l'ancienne version : le réécrire reste son choix (non fait).
- Toute l'appli au tutoiement ; visiteur de la démo renommé Alex (« Alex (toi) ») ; espèces « la plus
  rare » des fiches de la démo ajoutées à leurs listes ; « Jalouse » -> « Jaloux » (Samir).
- À propos : ni « par email » sans adresse, ni double authentification invérifiable ; anglicismes ôtés.
- Schémas alignés sur toutes les pages, écrits dans la charte (section « Schémas récurrents ») :
  police unique, 14 px minimum, contrôles de filtre à 34 px, 12 px sous le titre, raretés 1 -> 10.
- Emojis des titres de blocs et du menu : GARDÉS (son choix).

---
# Page Classement TERMINÉE le 2026-10-05 (validée par Mathis), EN LIGNE - v719, app.js?v=296
Suite de la revue page par page : la prochaine page qu'il choisira.

Ce qui a changé (détail dans les commits du 2026-10-05 et la charte) :
- tableau des joueurs et « Qui a vu quoi » alignés sur le tableau de Ma liste (en-têtes 13 px capitales,
  texte 14 px, une police) ; podium or/argent/bronze sur la seule case du rang ;
- explication de chaque tri + barème de la rareté réelle dans une bulle au survol des boutons
  (#triBulle, _bulleTri) ; plus de « ? », de phrase sous le titre ni de barème sur la page ;
- règle générale du survol : curseur « ? » (--curseur-aide) et 250 ms (DELAI_SURVOL), dans la charte ;
- « Qui a vu quoi » toujours affichée (repli refusé), sans colonne Rareté au tri « Nombre d'espèces » ;
  filtres de rareté en étiquettes (ils étaient écrasés en ronds) ; pastilles du tableau pleines comme
  les filtres ;
- onglets : Birdydex avant Carte ; textes d'introduction des pages tous au style de Ma liste ;
- fiche espèce : les habitats se chargent aussi hors Birdydex (ils manquaient depuis le 2026-09-28).
Au tri « Nombre d'espèces », le tri « Par rareté » et le filtre de rareté sont masqués et ignorés (oui de Mathis).

# FAIT : onglets 15 -> 17 px, poussés le 2026-10-05 (qg#41 déjà fermé).

# FAIT et EN LIGNE le 2026-10-05 (poussé, vérifié sur la démo en ligne) : refonte de l'onglet Ma liste, v706, app.js?v=286

Maquette : `notes-privees/maquettes/ma-liste/` -> direction C retenue (box à pictogramme au trait),
**titres seuls**, sans petite ligne (« ça surcharge »). Accueil : « Ajoute ta liste eBird et rejoins
la ligue ! ». Fin du tuto : aucune phrase. Vérifié dans la démo : membre (4 box, 3 fenêtres, carte du
lieu au-dessus de la fenêtre d'ajout, Échap ferme la carte seule) ; nouveau venu simulé (seule
« Charger ma liste », prénom exigé dans la dernière étape, dépôt -> fenêtre fermée, liste affichée) ;
téléphone + sombre. Bancs CONFORME. Reste : qu'il regarde en local, puis pousser.
Note : au dépôt d'un nouveau venu, le code d'invitation est encore demandé par une fenêtre du
navigateur (`prompt()` dans saveMyList) - pas touché.

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
- compte GBIF créé par Mathis (identifiant dans notes-privees, pas ici : ce fichier est public). Je n'utilise jamais son mot de passe :
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
