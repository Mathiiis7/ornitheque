# Où on en est (2026-11-07)

Dernière version : v1034 / app.js?v=606 (et styles.css?v=606). Prochaine : v1035 / 607.

- **Fiche espèce au téléphone (08/11, v1034)** : constat dans `notes-privees/chantier-telephone/fiche/CONSTAT.md`
  (mêmes commandes qu'à l'ordinateur ; manquaient les explications au seul survol). Corrigé, choix de Mathis :
  explications au toucher DANS LA FICHE (pointerup dans `_initInfobulle`, `parDoigt` ignore le faux survol qui suit),
  ligne lieu · durée · auteur des Sons entière. REFUSÉ par Mathis : agrandir les petits boutons (Détails du calcul,
  Animation, zoom, Voir en grand, liens xeno-canto), ne pas reproposer. v1033 : trophée seul qui glissait de côté.

- **v1031-v1032 (08/11)** : croix des trophées hors écran sur iPhone (fenêtre en 90vh -> svh, au-dessus de la barre
  d'onglets) ; en-tête des Dernières coches du profil posé sur une ligne (sticky + top:53px dans un cadre
  overflow:hidden -> static) ; Qui mène la Ligue resserré (lignes 69 -> 56 px, photos 44 px, textes 14 px gardés).
- **v1026 à v1030 (08/11, confirmés par Mathis sur iPhone)** : rareté au téléphone sur UN modèle partout (Qui a vu
  quoi, Birdydex, Carte Récent et Ligue) : ronds sur une ligne (`--nrar` si plus de 10), Tout / Aucun (Vide dans
  Qui a vu quoi) en boutons, filet, X/P/N à 16 px comme le tableau ; HTML de l'ordinateur ouvert par display:contents.
  Retirés partout : filtre « Milieu » du Birdydex (le tri par milieu reste), « Cacher sous N non observées » des
  hotspots. Page fixe de côté au téléphone (`html, body { overflow-x:clip }`). Échappés X/P : laissés tels quels
  dans Qui a vu quoi, 0 point en rareté terrain, ils comptent en ligue et en nombre : choix de Mathis, rien à changer.
- **v1021 à v1025 (08/11, retours de Mathis sur iPhone, tous confirmés)** : Carte, barre avant X/P/N cachée au
  téléphone debout ; barème des tris qui défile sans se fermer ; Qui mène la Ligue : entête « Rareté » ou « Espèces »,
  seul le NOM figé (rang et score défilent, il l'a demandé), pas de rebond de côté ; Qui a vu quoi sans rebond
  (`@media (pointer: coarse)`, debout et couché) ; ronds de rareté vraiment ronds au doigt (le min-height:52px des
  jetons les étirait) ; numéro des vignettes du Birdydex revenu (se colle aux lettres N/X sous 360 px, laissé).
- **v1020 (conversation de l'arbre)** : familles calées sur **AviList v2026** (liste mondiale unique, CC BY 4.0,
  doi:10.2173/avilist.v2026, 45 ordres / 250 familles / 2 379 genres, identiques à eBird v2026). « Océanites »
  coupée en Océanites du Sud (Océanitidés) et Océanites du Nord (Hydrobatidés) ; Ictérie polyglotte rangée dans
  les Icteridés (famille Ictériidés supprimée en 2026). Comparaison : `outils/build/_compare-avilist.mjs` sur
  `notes-privees/arbre/avilist/AviList-v2026-extended.xlsx` -> 0 écart de famille ni d'ordre. Choix de Mathis :
  groupes AviList partout, ESPÈCES eBird (les listes des membres viennent d'eBird ; 97,7 % d'accord seulement).
- **À GLISSER DANS LA PROCHAINE MISE EN LIGNE (accord de Mathis, 08/11)** : deux lignes dans `SCI_ALIAS` d'app.js,
  `'neochen jubata': 'oressochen jubatus'` (Ouette de l'Orénoque) et `'chloephaga melanoptera': 'oressochen melanopterus'`
  (Ouette des Andes). AviList v2026 les nomme ainsi, l'API eBird dit encore Oressochen le 08/11
  (`outils/build/_ouettes-ebird.mjs`) ; sans alias, le jour où eBird suit, elles sortiraient en anglais au palier 10.
  Les 3 autres renommées (brachycope, humblotia, thryorchilus) y sont déjà.
- **v1019** : Classement au téléphone : les 4 colonnes de droite REVIENNENT et défilent de côté, rang, joueur et nombre
  figés (choix de Mathis) ; barème des tris sur toute la largeur ; filtres de Qui a vu quoi rangés, 10 ronds sur une
  ligne ; X/P/N à 19 px (plus petits que les chiffres, 24). Essais : _essai-classement-tel.mjs, _essai-filtres-qui.mjs.
- **v1018** : la pastille de version des admins (#adminBuildStamp) cachée au téléphone, gardée à l'ordinateur.

## NOUVEAU CHANTIER (demandé le 08/11) : l'arbre de l'évolution des oiseaux
Une page « arbre phylogénétique » : d'où vient chaque famille, ce qui la distingue, quels oiseaux
elle contient, **monde entier**. Choix de Mathis : « purement scientifique », grands groupes au-dessus
des ordres, **une phrase par branche** (sourcée), grands groupes et ordres d'abord (~60 phrases), les
familles ensuite par lots relus.
- Source retenue : **Stiller et al. 2024, Nature** (doi:10.1038/s41586-024-07323-1, CC BY 4.0), arbre
  principal `63K.tre` (ASTRAL, 363 oiseaux, dit « main species tree » dans le README) téléchargé avec
  son README dans `notes-privees/arbre/source/` (entrepôt doi:10.17894/ucph.85624f66-c8e5-4b89-8e8a-fe984ca89e4a).
- Raccord : `outils/build/arbre-correspondance.mjs` -> `notes-privees/arbre/correspondance.txt`. Les 363
  feuilles raccordées (7 genres renommés), **224 familles du site sur 250** ; les 26 absentes (surtout de
  petites familles de passereaux, plus Huîtriers, Pluvian, Sarothruridés) s'accrochent à leur ordre,
  marquées « placement non publié dans l'étude ». « Océanites » du site = deux familles (Océanitidés,
  Hydrobatidés), que l'arbre sépare à juste titre.
- Branches incertaines selon l'article (à MONTRER, pas cacher) : Hoazin (3 positions possibles),
  Phaethontimorphes, Strisores, rapaces + chouettes, Nandous, Mirandornithes, Outardes/Coucous.
- Reste : vérifier les noms français des espèces du monde ; maquette (2-3 directions, charte
  `docs/charte-graphique.md`, page dans « Plus » à confirmer) ; phrases sourcées ; construire, données
  dans un `data/arbre-*.json` chargé à l'ouverture.

- **Recherche du 08/11** (`notes-privees/arbre/BILAN-RECHERCHE.md`) : pas de fausse route. AviList ne définit rien
  au-dessus de l'ordre : grands groupes = Stiller 2024, étage des passereaux = Oliveros 2019 (choisi par Mathis :
  « plus un étage dans les passereaux »). L'arbre et la suite AviList ne divergent qu'aux 3 noeuds débattus.
  **Tranché le 08/11** : groupes maison des Trophées NE PAS Y TOUCHER (ne pas reproposer) ; noms affichés partout
  en « nom courant · nom savant français » (« Passereaux · Passériformes », « Mésanges · Paridés »), même forme pour
  les grands groupes et l'étage des passereaux. **Noms VALIDÉS le 08/11** : `notes-privees/arbre/NOMS-VALIDES.md`
  (45 ordres, grands groupes, sous-branches, passereaux ; seul changement de Mathis : Charadriiformes = « Limicoles et
  laridés »). Les grands groupes récents n'ont pas de nom français établi : noms descriptifs, à présenter comme tels.
  **Revu le 08/11 (Mathis) : « on fait juste comme AviList » pour l'instant** : la page montre Ordres -> Familles
  -> Genres -> Espèces, dans l'ordre d'AviList v2026, SANS grands groupes ni étage des passereaux (noms gardés
  pour plus tard). **Maquettes faites** : `notes-privees/maquettes/arbre/` (A liste dépliable, B colonnes, C arbre
  dessiné ; données réelles par `outils/build/_arbre-donnees.mjs`). Mathis a montré un CLADOGRAMME de manuel
  (branches dessinées, un trait par embranchement, une image par feuille) : **maquette D** ajoutée. Arbre de
  Stiller réduit aux 45 ordres (`_cladogramme-ordres.mjs`, 44 noeuds, tout binaire) : ses feuilles tombent
  EXACTEMENT dans l'ordre AviList. Choix de Mathis : un trait sur CHAQUE noeud, « même approximatif » (marqué
  discuté quand la source hésite) ; silhouettes **PhyloPic** (`_phylopic-ordres.mjs`, 45/45, espèces vivantes
  seulement, domaine public sauf 3 CC BY et 1 CC BY-SA, crédits dans `silhouettes/credits.json`). Branches
  discutées : soutien < 0,95 dans 63K.tre (Hoazin 0,88 ; Strisores 0,90). D validé par Mathis (« cherche les traits »).
  **44 traits écrits** (`notes-privees/maquettes/arbre/traits.json`, sources Wikipedia EN téléchargées par
  `_wiki-clades.mjs` dans `notes-privees/arbre/wiki-clades/`) : 12 donnés par la source, 11 approximatifs, **21
  « ADN » sans aucun trait visible dans les sources lues** (Columbaves, Otidimorphes, Pélécanimorphes…). Placement
  des traits : sur la branche d'ARRIVÉE de chaque point (3e règle ; les deux premières faisaient chevaucher), numéro
  + liste sous l'arbre quand ça ne tient pas, bulle au toucher au téléphone. **Creusé (Mathis : « creuse »)** avec
  **Sangster et al. 2022** (Avian Research 13:100027, cosigné par Mayr, CC BY-NC-ND : résumer, ne pas recopier),
  PDF téléchargé par Mathis (ScienceDirect et core.ac.uk bloquent les robots), dans `notes-privees/arbre/sources/` ;
  extraits par `_sangster-apomorphies.mjs`, reportés par `_traits-sangster.mjs` (19 traits revus : Néoaves = mâles
  sans pénis, casoars+kiwis = aile sans pouce, manchots+pétrels = narines en tube chez l'embryon…). Bilan : 12
  source, 16 approx, **16 ADN** dont 4 que la revue déclare sans aucun trait connu ; les 12 autres sont des noeuds
  qu'elle ne traite pas (sous-groupes des engoulevents/martinets, noeuds sans nom). Piste restante pour eux :
  Chen et al. 2019 (Vanescaves, morphologie). Reste : avis de Mathis, puis phrases des ordres.

## CHANTIER EN COURS DANS UNE AUTRE CONVERSATION (demandé le 07/11) : le site au téléphone
Mathis trouve l'affichage téléphone « pas adapté et pas très utilisable », sur **tout le site**. Ce qui
gêne, ses trois réponses : **trop d'infos à l'écran** (serré, on ne sait pas où regarder, beaucoup de
défilement), **des choses coupées** (textes tronqués, tableaux qui débordent, éléments hors écran), et
**ça ressemble à un site d'ordi** (il voudrait que ça se manie comme une appli de téléphone). Pas cité :
« difficile à toucher » (les cibles de 44 px sont déjà faites).
Méthode prévue :
1. Constat : chaque onglet en largeur téléphone (375 px, `isMobile:true`, démo locale), captures et liste
   de ce qui est coupé ou débordant, mesuré (scrollWidth, textes tronqués), dans `notes-privees/`.
2. Maquettes avant de toucher au code (CLAUDE.md global) : 2 ou 3 directions pour la navigation (barre
   d'onglets en bas ? écrans plein écran ?) et pour alléger une page type. Il choisit.
3. Puis page par page, vérifié au téléphone et à l'ordinateur (l'affichage souris ne doit pas bouger).
**Avancement 07/11** : étape 1 faite (`notes-privees/chantier-telephone/CONSTAT.md`). Barre du bas choisie
par Mathis : **Classement, Birdydex, Carte, Quiz, Plus** (Plus : Ma liste, Trophées, Fil, Photos, Tchat,
Profil, Requêtes, À propos, guide, thème, déconnexion ; ses pastilles additionnent celles qu'il contient).
**v1015 (08/11) : étape 3a EN LIGNE** : choix de Mathis sur la maquette : haut A (logo fin collé), texte à
100 % (zoom 1 sous 700 px), pages à plat. Barre du bas + page Plus, Fil/Photos/Tchat en pages, guide redirigé,
ronds recentrés au doigt (banc pastilles), ordinateur identique au pixel (_ref-ordi.mjs, bruit des photos et
tuiles mis à part). Essai : outils/verif/_essai-barre-tel.mjs (390/360, clair/sombre). À faire vérifier par
Mathis sur iPhone : clavier (barre cachée, pas de zoom), barre Safari, appli installée. Reste 3b, page par
page : tableau du Classement (défile de côté, « Qui a vu quoi » 40 écrans), grille du Birdydex, cartes des
Trophées, liste de Ma liste dans sa boîte, boutons de couche de la Carte sur 2 lignes, boîte du Tchat.
Toujours pas de réponse sur ce qu'il a vu COUPÉ sur son iPhone.
**3b (08/11)** : maquette de toutes les pages d'un coup, à faire choisir : `notes-privees/maquettes/telephone-pages/`
(Ma liste A/B, Classement A/B, Birdydex A/B/C, Trophées A/B, Carte A/B, Tchat A/B ; CSS de chaque version dans
la page). Captures : `notes-privees/chantier-telephone/pages/` (outils/verif/_capture-maquette-pages.mjs).
**v1016 (08/11) EN LIGNE**, choix de Mathis : Ma liste A (carré teinté des icônes GARDÉ, il l'a demandé), Classement A
mais « Qui a vu quoi » en TABLEAU comme à l'ordinateur (pas les cartes), Trophées A, Carte B, Tchat A
(_chatEnBas). Essai : outils/verif/_essai-pages-tel.mjs. **v1017** : Birdydex C (3 colonnes même à 360 px, nom 14 px, sans latin ni numéro). Chantier téléphone 3b FINI ;
reste seulement ce que Mathis verra sur son iPhone (clavier, barre Safari, appli installée).
Déjà fait au téléphone, à ne pas défaire : Carte sans tiroir, panneau dessous (v1006) ; carte en `svh`
(v1009) ; ronds de rareté à 24 px (v1006) ; bloc `@media (pointer: coarse)` en fin de styles.css.

## Décidé le 07/11
- **v1014** : rayon des grappes selon le zoom (40 px jusqu'au zoom 5, 34 jusqu'à 8, 28 jusqu'à 11, puis 24 ; 45 partout avant), Mathis : des points qui ne se touchaient pas étaient regroupés. Mesuré sur la démo (outils/verif/_essai-rayon-grappes.mjs, ANCIEN=45 pour comparer) : grappes de points séparés 63 -> 45 au zoom 7, 44 -> 26 au zoom 8, 6 -> 1 au zoom 9.
- **v1013** : en arrivant sur la Carte, une fenêtre « Que veux-tu voir sur la carte ? » propose Vu récemment,
  La ligue ou Hotspots, avec un petit dessin et une phrase chacun (maquette B, trois lignes, choisie par
  Mathis : `notes-privees/maquettes/choix-carte/`). Une fois par CHARGEMENT du site (simple variable
  `_ctChoixFait`, pas de stockage : recharger la remontre, passer par le Birdydex non). Choisir = cliquer la
  pastille de la couche ; fermer laisse la carte vide comme avant. Pas montrée par « Voir en grand » de la
  fiche, ni pendant le guide (proposée à sa fermeture si on est sur la Carte).
- **v1012** : au doigt, toucher la carte pour refermer la bulle d'un point (ou d'une grappe, d'un hotspot)
  ne choisit plus le pays, la région ou la réserve en dessous (Mathis sur iPhone). L'état se lit au
  `pointerdown` : au clic, Leaflet a déjà fermé l'infobulle (mouseout simulé). Essai :
  `outils/verif/_essai-fermer-bulle-tel.mjs`.
- **v1009** : hauteur de la carte au téléphone en `svh` au lieu de `dvh`. En défilant sur iPhone, la carte
  sautait puis se remettait : `dvh` suit la barre d'adresse de Safari, qui se replie et revient. Le doigt
  qui déplace la carte en voulant défiler ne gêne PAS Mathis (deux doigts proposés, refusé). Non vérifiable
  dans nos tests (pas de barre de Safari) : à confirmer par Mathis sur son iPhone.
- **v1007** : thème JOUR par défaut partout (le site suivait l'appareil, donc nuit sur un téléphone en
  sombre) ; le choix du bouton est gardé (`mb-theme`), relu dans le script en tête d'index.html.
- **v1010 : « Tous les cochages » RETIRÉ de la Ligue (choix de Mathis).** Il marchait (essai démo enrichie : 1 333 -> 3 999 points, ordinateur et doigt), mais
  il n'a presque rien à montrer : sauvegarde du 04/10, 7 membres sur 11 sans aucune observation multiple
  (liste de vie eBird = une ligne par espèce) ; il faut l'export MyEBirdData complet, et 20 obs au plus
  par espèce (`saveMyList`). « Regrouper les points » a repris la ligne « Afficher ». Celui de la carte
  de la fiche espèce (`smShowAllObs`) retiré aussi en v1011, à sa demande.
- **v1008** : `styles.css` porte le même `?v=` qu'app.js (voir CLAUDE.md, Déployer). Mathis a vu sur iPhone,
  juste après la v1006, le panneau de la Carte invisible et la Légende remontée : nouvel app.js avec
  l'ancien CSS gardé 10 min en cache. Rejoué avec `outils/verif/_essai-legende-tel.mjs` (ANCIEN_CSS=...).
- **v1006** : au téléphone, PLUS DE TIROIR sur la Carte (« pas trop utilisable », il passait sur la carte et
  se refermait mal, Mathis sur iPhone). La carte garde sa pleine hauteur (choix de Mathis), le panneau
  (onglets, Filtres, liste) vient DESSOUS dans la page, comme une colonne ; une observation ou un hotspot
  touchés dans la liste ramènent la carte à l'écran (`_ctMontreCarteTel`). Le bouton « Filtres » du
  tiroir (v1003) a disparu avec lui. Essai : `outils/verif/_essai-carte-tel.mjs`.
- **v1006, ronds de rareté au doigt** : 24 px d'écran au lieu de 44 (« bcp trop gros »), partout (Carte,
  Birdydex) ; une zone invisible (::after) les élargit à 37 px sous le doigt, 16 px d'écart entre eux. Le
  banc accessibilite mesure cette zone, seuil 37 (choix de Mathis). Pas fait : les ronds du Classement
  (#tierChips, dans un menu) gardent 6 px d'écart, zones qui se chevauchent un peu.
- **Banc pastilles corrigé** : ses huit positions étaient des huitièmes de px CSS, jamais une période
  entière de pixel d'appareil ; son verdict dépendait de la hauteur de ce qui est au-dessus. Il pose
  maintenant des huitièmes de pixel d'appareil (`--pas`). Trois ronds décentrés qu'il cachait ont été
  recentrés (filtres X/P/N à 20, `.feed-pas` 1,5 px, colonne Rareté au doigt).
- **v1000 à v1004** : interrupteur « Regrouper les points » dans les Filtres de la Ligue. ÉTEINT par
  défaut (tous les points, écartés en spirale au même lieu, comme avant le 23/10) ; le choix est gardé
  par appareil (`localStorage` `mb-ligue-grappes`). Choix de Mathis : un ami qui préfère tous les points
  n'a rien à toucher. v1000 avait glissé la ligne dans « Rareté » (correctif appliqué sans contexte
  avec `git apply --unidiff-zero`) : pour commiter un diff filtré, garder le contexte.
- **v1005** : une fois cadrée, la Carte ne bouge plus quand un filtre change (elle recadrait sur tous
  les points de la ligue, donc le monde) ; `_ctCadre` ne recadre qu'au premier cadrage ou avec
  `force` (choix d'une espèce). La v1004 n'était pas en ligne avant : publication GitHub tombée en
  délai dépassé après trois poussées rapprochées, repartie avec la v1005.

Historique complet jusqu'au 30/10 :
`archives/en-cours-jusqu-au-2026-10-30.md` (y chercher un mot plutôt que le lire en entier, 85 000 jetons).
Ce fichier se remplace à chaque fin de tâche : quelques lignes, pas un journal.

## Reste ouvert
- **Tickets de l'Ornithèque encore ouverts : les deux du Quiz, « en réserve »** (qg#65 cris bonus, qg#57 quiz photo).
- **En attente de réponse :** Cornell (22/10), LPO (23/10). Effacer l'historique des deux dépôts attend Cornell.

## Décidé le 04/11 (en ligne)
- **v998** : les tables de rareté se lisent par `_cleRef` (alias des noms latins eBird d'octobre 2026) ;
  le Troglodyte mignon reçu en « Nannus troglodytes » ne sort plus « Étranger ». Le Fil donne la
  rareté du PAYS de chaque observation (`realTierPays`), le filtre de rareté suit ; une espèce vue
  dans deux pays peut y paraître avec deux paliers, voulu par Mathis.
- **v999** : ligne « Birdydex de » en tête des Filtres du Birdydex (placement et libellé choisis par
  Mathis) ; non mémorisée, et une espèce ajoutée ramène à son propre Birdydex.

## Décidé le 03/11
- **Ticket qg#74 fait et fermé (v997)** : Retour du navigateur entre onglets (entrées d'historique `{vue}`, seuls les
  vrais clics en ajoutent ; la fiche garde son propre retour), remontée en haut à chaque onglet, objectifs des
  trophées avec le vrai seuil (`_auSingulier` pour les seuils de 1), fenêtre `demander()` à la place de
  confirm/prompt/alert pour les suppressions (pas pour les deux confirmations admin), flèche « › » dans le fondu
  des onglets au téléphone (choix de Mathis : garder le défilement), « Toutes les régions », `latinAff()` pour
  les noms latins affichés (les tables restent en minuscules), « Chercher une espèce » partout. Mois de la fiche
  à 32 px écrits au doigt seulement (52 donnait une colonne plus haute que la carte).
- **Audit + critique Impeccable, corrigés et en ligne (v996) :** rapport `notes-privees/impeccable-2026-11-03.md`,
  captures avant/après dans `notes-privees/audit-2026-11-03-captures/`. Birdydex et Trophées ouverts au clavier,
  verdict du Quiz annoncé et focus gardé au clavier (pas au doigt : le clavier du téléphone se rouvrirait),
  gris pâles à 97 % de `--ink-3` (4,6:1 au pire), couleurs fixes du Quiz et des boutons rouges éclaircies en
  sombre, `<main id="contenu">` + lien « Aller au contenu » (passe par app.js : la démo a un `<base href="../">`),
  onglet annoncé et titre du navigateur, fiche et Trophées à 14 px (13 px en capitales).
- **Choix de Mathis :** mot de rareté du Fil GARDÉ dans sa couleur vive (point de couleur et mot assombri refusés,
  ne pas reproposer) ; étiquettes de l'en-tête de la fiche à 11,5 px au téléphone (14 px sur ordinateur).
- Restent sous 14 px exprès : graduations du graphique en barres, étoiles, attribution Leaflet, icônes emoji,
  pourcentage de l'en-tête de carte (13 px, le banc entete veut le même corps que le nom en capitales).

## Décidé le 01/11
- **Film de présentation, SUJET CLOS (ticket 39) :** en ligne sur l'écran de connexion et sur la page L'Ornithèque du portfolio (à la place de la carte du monde), avec le lien « Crédits ». 86 s, **muet par choix de Mathis** après trois mélanges écoutés, ne pas reproposer de son. Version web 10,4 Mo (1080p), maître 4K `.onetake/4k/film.mp4` hors dépôt. Fabrication : `docs/VIDEO-DEROULE-V2.md`, puis `outils/onetake/rendu-final.py`, `montage-v2.py --final`, `film-web.py`. Ne pas relancer `v2-recent.py` ni `v2-scenes.py` sans raison : la première retire un autre chant au quiz et de nouvelles observations.

## Décidé le 31/10
- **Anneaux du classement, SUJET CLOS (v993, ticket 61) :** or, argent, bronze sur l'avatar des 3 premiers au nombre d'espèces.
  Avatar du Profil 96 px et centré, au-dessus du texte au téléphone. Emojis d'avatar retirés : image ou initiale. Boutique, graines,
  missions et cadres dessinés abandonnés après essai sur la démo, ne pas reproposer (archives : `notes-privees/maquettes/boutique/`).
- Essai de la méthode qa-only (sans gstack, trop lourd) et critique Impeccable : `notes-privees/essai-qa-only/`. Les 8 bugs
  corrigés (v991). Suites (v992) : sons du Quiz vérifiés dans Chrome (ils marchent ; seul le navigateur intégré les bloque) et
  message si un chant ne vient pas ; noms des listes plus faciles à toucher ; en-tête de fiche replié en descendant au téléphone ;
  trophées à gagner en cartes creuses ; erreur « _leaflet_pos » réglée (0 sur 24 fiches, 11 sur 12 avant).
  Indices du Quiz (15 pictos) : laissés affichés d'office, choix de Mathis, ne pas reproposer.
- « Densité habitat » retirée de la carte Traits (v990).
- Empreinte morphologique sur les fiches (carte Traits, v982) : radar arrondi choisi par Mathis, en proportions du
  poids. Autres radars (membres, quiz, présence, cycle de vie) maquettés dans `notes-privees/maquettes/radar/`, non retenus.
  Lignes de morphologie retirées (v983), « Patte » pour le tarse (v984), comparaison aux oiseaux du monde (v987).
- Mesures Avonet complétées (v986) : feuilles BirdLife et BirdTree pour les noms du site, plus les genres renommés
  (`outils/build/avonet-renommes.mjs`, même famille exigée) ; 657 oiseaux de plus, aucune mesure d'avant modifiée.
  v989 : 32 renommés de plus, chacun prouvé par GBIF (15) ou iNaturalist (17). SUJET CLOS par Mathis (31/10) : le reste
  (2 oiseaux de France, ~400 étrangers, surtout disparus ou séparés) ne se rouvre pas sans source nouvelle.
- Taille comparée par silhouettes : abandonnée, maquette dans `notes-privees/maquettes/taille-silhouettes/`.

## Décidé le 30/10
- **Clé et données eBird : on ne fait rien, on réagira en cas de problème** (choix de Mathis). Pas de mail à eBird,
  pas de nouvelle clé, rien retiré. La clé du compte reste lisible dans l'historique public, et
  `data/countries/*/freq48/` reste très proche du format d'origine interdit (`docs/carte-donnees.md`). À rouvrir si
  eBird écrit, si la clé est coupée ou si des refus inexpliqués apparaissent. Ne pas présenter ces données comme autorisées.
- Lien INPN des réserves supprimé pour de bon (v980), plus à remettre. Le champ `i` de `data/reserves-fr.json`
  reste, sans usage.
- Migration sur iPhone, trophées et progression du quiz : bons pour Mathis (« oui c bon », 30/10).
  Hotspots slovènes : 49 carrés lus, 0 erreur.
- Ronde d'hiver : dernière ligne grisée des parcours (`PARCOURS_BIENTOT`), Sittelle ajoutée à la ligne qui
  avait déjà les 5 autres. Mathis la reprendra à son tour ; à trancher alors : cris seuls, ou cris puis chants.
