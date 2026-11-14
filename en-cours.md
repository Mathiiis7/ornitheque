# Où on en est (2026-11-07)

Dernière version : v1108 / app.js?v=680 (13/11, météo sur la Carte). Prochaine : v1109 / 681.
- **v1108** : météo Open-Meteo (CC BY 4.0, sans clé, non commercial < 10 000 demandes/jour) et lever du soleil sur
  la Carte. Panneau : ligne repliée sous le nom de la zone (région, département, zone dessinée ; rien pour un pays),
  3 jours au dépli ; bulle d'un hotspot : 3 colonnes en pied. Un jour cliqué montre ses heures (lever - 1 h à
  coucher + 1 h). Maquettes : `notes-privees/maquettes/meteo/`. Essai : `outils/verif/_essai-meteo.mjs [ordi|tel] [dossier]`.
- **v1107** : TJ-X01~ (districts de subordination républicaine, absents d'eBird) fondu dans TJ-DU, où eBird range
  leurs sites ; contours ?v=20261111c. Seul pays dans ce cas (régions à code provisoire vérifiées le 11/11).
- **v1106** : continents et monde reprennent les seuils d'un pays (le Tichodrome était 4 dans le monde, 5 au mieux
  dans un pays) ; seuils.json retiré, Birdydex des continents régénéré, `_concordance-birdydex-continents.mjs` 0 écart.
TROPHEES_VERSION = 6 (à monter à chaque trophée unique neuf). Uniques en ligne le 11/11 : Fixation béton (huppe),
Spider-Man (tichodrome, agrandi x 1,12), Aquaman (cincles), Matuidi Charo (vautours, v1105) ; huppe décalée
(VITRINE_DECALAGE). Essai : `outils/verif/_essai-unique.mjs <sauvegarde> <captures> <membre> <trophée>`.
Plus aucun trophée en attente. Corvidés, flamant, rollier + guêpier ABANDONNÉS (11/11), « Seul au monde » (top 3 des espèces
exclusives) ABANDONNÉ (14/11), à ne plus reproposer. Détail : fin de THEMES.md.

- **v1100 (0254dfa8)** : un trophée neuf de la vitrine arrive « à débloquer » (avant : compté d'office comme vu) ;
  `_VT_REMIS` a remis limicoles et échassiers à 0 une fois. Essai : `outils/verif/_essai-remis.mjs`.
- **v1101 (60f92002)** : dans le palmarès, toucher la course d'un autre coche ses oiseaux dans la liste du dessous.
  Essai : `outils/verif/_essai-clic-course.mjs`.

- **v1099 (11/11, f820893b) : deux trophées de la ligue EN LIGNE**, « Les Chevaliers de la Table ronde » (limicoles,
  œdicnèmes compris) et « Le Penseur » (hérons, ibis, spatules, cigognes, grues, bihoreaux compris). Niveaux :
  `outils/build/_niveaux-limicoles.mjs`, `_niveaux-echassiers.mjs`. Chionis, thinocores et
  pédionome restent hors des limicoles (Mathis, 11/11). Détail : fin de `notes-privees/trophees/THEMES.md`.

- **v1097 (11/11, 0c109a97) : Sahara occidental recoupé à 27°40' N** (Natural Earth le donnait au Maroc à l'ouest du mur) :
  `outils/build/sahara-occidental.mjs`, pays, continents, régions du Maroc, surfaces et Birdydex des continents régénérés.

- **v1087 (11/11, 89582f30)** : scène du zoom posée dès le clic (écran vide pendant le téléchargement en ligne) ;
  Birdydex : vignettes en srcset (240/250 px) + decoding async, pas de survol pendant le défilement. Mesures :
  `outils/verif/_mesure-defilement-birdydex.mjs [port] [ralenti] [ordi|tel]`, `_trace-defilement-birdydex.mjs`.
  Défilement validé par Mathis le 11/11 au soir (voir v1091) : plus rien à faire.

- **v1085 (11/11, f6a52d86)** : clic de zone réparé (cassé depuis v1078, tous pays) ; zones sans liste eBird
  hachurées (`listes_zones.json`, `outils/build/listes-par-zone.mjs`) ; zoom en couches CSS. Mesure :
  `outils/verif/_mesure-transitions.mjs [port] [ralenti]`.
- **v1086 (11/11, 89ed756d) : zones muettes réglées.** 118 zones sans fréquence (bar chart < 500 octets jeté au
  téléchargement = zone sans liste) : hachurées « aucune donnée » toute l'année. Vérifié via le relais
  (`_zones-muettes.mjs`, `_zones-hotes.mjs`, résultats dans `notes-privees/zones-muettes.json`, `zones-hotes.json`) :
  53 sans liste depuis 2019, 6 avec 1-2 listes, 60 jamais visitées ; Louxor, Damas, Akkar, Honiara, Lankaran
  fondus dans leur zone hôte (ALIAS_MONDE / ALIAS_GB). Sheki-ville, Sämkir, Sissili, Cankuzo : un seul site, laissés.
  Le relais refuse sans en-tête Origin du site (`http://localhost:8765` accepté).

- **v1089-v1090 (11/11) : Birdydex par continent et Monde, « comme un pays » FAIT.** Choisis dans le sélecteur du
  Birdydex (« voir le Birdydex », choix de Mathis), sans toucher au pays du site (`_pkdxContinent`, non enregistré). Liste calculée
  d'avance : `data/birdydex-continents/` par `outils/build/birdydex-continents.mjs`, avec les fonctions de la fiche
  (0 palier différent sur 4 984 couples ; 0 sur 1 475 avec les pays du monde déjà lus, v1090) ; À RÉGÉNÉRER si les données des pays changent (CLAUDE.md). Échappés
  isolés qu'aucune grille de pays ne montre écartés (139 en Europe) ; accidentelles = régulière dans aucun pays.
  Une case ouvre la fiche sur le même continent. Europe 1 002 cases, Monde 10 922. Essai :
  `outils/verif/_essai-birdydex-continent.mjs` ; mesure `_mesure-birdydex-monde.mjs` : Monde 1,2 s à l'ordinateur,
  3,5 s au téléphone ralenti 4 fois (fil bloqué 2 s) - à alléger seulement si Mathis le trouve lent.
  v1091 : grille en blocs, body:has() retirés (Monde au téléphone /4 : 9,9 s -> 0,35 s). v1092 : seuils de paliers propres
  à chaque continent et au monde (seuils.json, _palierEtendu), répartis comme un pays moyen (choix de Mathis).
  v1093 : vitrine, un trophée débloqué le reste (niveau vu ne redescend plus). v1094 : pays sous 1 000 listes eBird
  (data/listes-pays.json, 46 pays) : repère ⚠ dans le sélecteur, phrase sous la carte, poids allégé dans les continents.
  Bulbul de Chine 3 % au monde : mesure gardée (Chine = 7 % des terres, 44 % de ses listes) ; question close.
  v1095 : 13 pays sans rareté (PAYS_SANS_RARETE : moins de 200 listes ET aucune espèce propre ; Nauru, Corée du
  Nord, Mali, Afghanistan gardés) : « trop peu de listes », carte hachurée, Birdydex sans palier, hors continents.
  v1096 : Fil et « Qui a vu quoi » aussi (realTierPays : « Trop peu de listes »). Le score du Classement ne lit que la France.
  Défilement du Birdydex : VALIDÉ par Mathis le 11/11 au soir (« plus fluide, c'est bon »), après la v1091. Clos.

- **v1082-v1083 (11/11) : rareté par continent ET du monde**, surface plafonnée à 10 % (choix de Mathis parmi sept
  calculs, `notes-privees/rarete-continent/`) ; pour le monde, l'Antarctique ne compte que pour une bande côtière de
  10 km (`COTE_AQ_KM`, carte-continents.mjs → `data/aires-pays.json`). Calcul unique `_rareteEtendue`. Colonne des
  mois colorée, pourcentage dans l'entête, pastille sur les titres du sélecteur. Essai :
  `outils/verif/_essai-rarete-continent.mjs [port]`.

- **v1081 (11/11) : tour des onglets de la ligue dans les 241 pays FAIT** (`outils/verif/_tour-pays-ligue.mjs`,
  compte rendu en fin de `docs/audit-pays-2026-11-10.md`). Classement, Qui a vu quoi, Fil, Trophées, Quiz : tout
  bon ; seul défaut corrigé, AC / CS (Océanie) et CP (Amérique du Nord) absents de CONTINENTS_7. Les pays sont
  désormais contrôlés partout : données, zones, Birdydex, fiche, ligue.

- **v1079-v1080 (10/11) : zoom sans coupure** (`_oqTransition`, scène posée sur le bloc, copie des deux cartes sous
  une même caméra, fondu court) ; espèce jamais notée = carte grise gardée. Le monde passe en Natural Earth (choix
  de Mathis, Equal Earth « écrasé en haut » ; comparaison dans `notes-privees/essai-zoom/projections.png`).

- **v1078 (10/11, commit 4ad2b544) : zoom monde / continent / pays dans la fiche.** Pays hors du continent (rangement
  du sélecteur, `_continentDuPays`) en transparence ; clic sur un pays = zoom puis sa carte ; clic sur le monde = zoom
  sur son continent ; bouton sous les mois pour remonter. `monde.json` garde les cadres des continents. Essai :
  `outils/verif/_essai-zoom-carte.mjs [port]`, captures dans `notes-privees/essai-zoom/`.

- **v1077 (10/11) : exotiques des pays TRANCHÉ**. `inject-exotic-per-country.mjs` relancé sur tous changerait 45
  étiquettes (liste : `notes-privees/exotiques-a-trancher.md`) : 39 pour Jersey, Guernesey, Man, Svalbard, Gibraltar
  (absents du site, sans effet) et 6 visibles. Choix de Mathis : seul le Cygne tuberculé du Royaume-Uni devient
  sauvage (eBird ne le marque introduit que dans 3 régions sur 20) ; Bernache du Canada GB, Oie des neiges GB, Oie
  naine et Tarin US, Flamant des Caraïbes IT gardent leur étiquette. NE PAS relancer le script sur tous sans revoir ça.
- **22 pays sans effort par zone** (Hongrie, Lettonie…) : ils ont les fréquences par région, seul le poids des mois
  vient du pays. Mesuré sur 172 pays : 13 % des couples zone-espèce changent d'un cran, 0,3 % de plus. TRANCHÉ par
  Mathis le 10/11 : on garde la rareté par région, rien à changer, ne pas reproposer sans fait nouveau.
- **Limites des sources des pays : SUJET CLOS (Mathis, 10/11), ne plus en parler.** ~55 territoires d'un bloc sans
  régions, 6 territoires aux zones eBird non dessinables (Porto Rico…), Libye sans contours, 22 pays au calendrier
  national. Pas encore fait : un tour pays par pays du Classement, du Quiz et des Trophées (l'audit couvrait
  données, zones, Birdydex et fiche).

- **v1074-v1075 (10/11, pays)** : une espèce à 0 % tous les mois n'est plus présente (103 couples, France
  comprise, accord de Mathis) ; Monténégro avec ses 48 quinzaines (`build-rarity-me-quinzaines.mjs --quinzaines`).
  GitHub Pages a expiré 3 fois sur la v1075 (« Timeout reached », rien côté site) ; la v1076 l'a emportée.

- **v1073 (10/11, conversation des pays) : audit des 242 pays**, compte rendu dans `docs/audit-pays-2026-11-10.md`
  (corrigé / limites des sources). Fréquences rares gardées (arrondi), noms latins ramenés aux noms du site
  (`noms-du-site.mjs`), 37 noms français ajoutés, formes Guyana / Équateur / Érythrée / Moscou remises en place,
  noms de zones réparés. Outils : `_audit-pays.mjs`, `_zones-sites.mjs`, `_tour-pays.mjs`.

- **v1071-v1072 (10/11, conversation des pays)** : v1071 (875ae3b0) = pourcentages des pays du monde dans le
  sélecteur de la fiche (morceaux especes-monde arrondis à 2 chiffres significatifs, plus à 4 décimales ; effort
  mensuel des 193 pays injecté), carte de répartition jusqu'à 80° S (Antarctique), aire iNaturalist bien placée
  (`_carteCadreAffiche` : Leaflet coupe à 85,05°, 79 aires glissaient). v1072 (499a43f7) = drapeaux :
  Ashmore-et-Cartier et mer de Corail -> australien, Clipperton -> français (`DRAPEAU_DU_PAYS`) ; drapeaux locaux
  de l'outre-mer GARDÉS (choix de Mathis). Rattachements : JE/GG/IM dans GB, SJ dans NO depuis septembre, rien
  d'autre à rattacher ; Gibraltar retiré en septembre (4e0c8483), toujours absent.

- **v1065 (10/11, vitrine)** : déblocage allégé au téléphone (`_vitrineLueurTel`, copie dorée floue en fondu, plus de
  filtre animé ; 58 i/s au processeur /4 contre 35). Ordinateur inchangé à l'œil. La v1064 avait échoué deux fois chez
  GitHub (« Timeout reached » au déploiement) ; une vieille relance de la v1064 (run 42830341430) restait en file :
  si le site revient à v1064, redemander une construction (`gh api -X POST repos/Mathiiis7/ornitheque/pages/builds`).

- **v1064 (10/11, conversation « vitrine »)** (commit 7009eb3c, ses seuls morceaux, indexés par greffe sur HEAD) :
  Écologue 400 « Écologue expert » (cabane d'affût) et 500 « Écologue de légende » (guide relié d'or), en « ? ».
  Déblocage sans saccade : animation figée (`.vt-prepare`) jusqu'aux dessins, pastilles après l'animation, stats
  calculées une fois par rendu (`_statsDe`). Mesuré : clic 206 → 66 ms (700 → 150 au processeur /4), 60 i/s.
  RESTE (proposé à Mathis, pas fait) : au processeur ralenti, l'effet flou + lueur animé sur le trophée
  (`vt-materialise`, filtre sur la toile) coûte encore ~35 i/s ; une version en fondu d'une copie pré-floutée le
  rendrait léger, à faire seulement s'il le veut (l'animation est son choix du 08/11).
  IMAGES ATTENDUES de Mathis (« plus tard ») : Écologue 400 (cabane d'affût), 500 (guide relié d'or). 200 = longue-vue
  (v1068), 300 = téléobjectif (v1070, ?v=642, commit bac4e3a0), en ligne. Une image se branche par `ecologue-<n>.png`
  dans assets/trophies/themes/ecologue/ et le seuil `n <= 300` de l'entrée Écologue.

- **v1062 (10/11, conversation « vitrine ») : EN LIGNE** (commit 061cc19d, seulement ses morceaux d'app.js : le
  palmarès et `EXOTIQUES_ZONES_MAJORITAIRES` restent dans le dossier). Kimono = costume lilas (rouge gardé dans
  notes-privees/trophees/images/kimono/) ; Écologue 100 « Apprenti écologue » (jumelles), 200 « Écologue confirmé »
  et 300 « Écologue chevronné » en « ? » (images de Mathis à venir : longue-vue sur trépied, téléobjectif) ;
  Terroir = plateau fromages-charcuterie gagné à 11 régions sur 13 (`TERROIR_SEUIL`), calques rangés dans
  `archives/terroir-calques/` (planche taillée dans le vrai contour : `_planche-exacte.mjs`, `_contour-france.mjs`) ;
  Bourriche d'huître = tout le bassin d'Arcachon (`_surBassinArcachon`), toutes les observations.

- **v1060 (10/11, conversation des pays) : 193 PAYS DU MONDE EN LIGNE** (commit 07efe417, seulement mes
  morceaux d'app.js ; palmarès et vitrine restent dans le dossier). Le Maroc l'était depuis v1055.
  Schéma « deux étages », recette et pièges : `docs/ajouter-un-pays.md`. Chaque pays du monde a
  `data/countries/xx/pays.json` (lu à la demande) ; le sélecteur lit `data/especes-monde/`. app.js +14 Ko gz,
  site publié ~124 -> 277 Mo. 50 pays sans zones (d'une pièce, comme Malte). Vérifié : 11 bancs sur la
  version indexée ; Japon, Inde, Groenland en local, ordinateur et téléphone.
  Le banc photos flanchait par moments sous charge (6/8 avec mes morceaux, 6/6 sans) : non reproduit sur
  machine calme ; à surveiller.
  v1061 (c94bad9a) : outre-mer, Bonaire, Christmas, Cocos... tracés à part sur la Carte (carte-pays.mjs,
  TERRITOIRES) ; ALIAS_MONDE dans simplify-regions-multi.mjs : 52 zones sans contour restent (Libye,
  Somaliland, Vietnam, Qatar : découpages qui ne se recouvrent pas) ; gélule ANNÉE à 88 px.
  Les vignettes grises des pays du monde sont VOULUES (espèces non vues : pas de photo téléchargée).
  v1063 (06b1fd22) : codes décalés VN/TZ/KR corrigés, geoBoundaries pour 12 pays (GB_MONDE, ALIAS_GB),
  fusion des morceaux pour tous les pays du monde, EXOTIQUES_ZONES_MAJORITAIRES étendu. Restent 15 zones
  avec listes sans forme (Libye, Qatar, Songwe, îles) : aucune source n'a ce découpage.
  v1066 (9033f437) : OpenStreetMap pour Songwe, Daman et Diu, North Abaco, Aldabra, Perseverance, Şəki
  (osm-zones-monde.mjs) ; Qatar en frontières APPROCHÉES d'après ses sites eBird (zones-approchees.mjs,
  accord de Mathis) ; Libye impossible (2 sites eBird). v1067 (c787da85) : îles des pays du monde dans
  carte-pays.json (1:10 M pour les îles absentes du 1:50 M, et en entier pour l'Antarctique et 50 archipels),
  mesuré par outils/verif/_precision-contours.mjs : 8 633 -> 1 543 sites à plus de 10 km (mer, territoires
  disputés, îlots sous la résolution d'une carte mondiale : c'est la limite).
  v1069 (c5e4d85f) : carte de fiche d'une pièce pour les 49 pays sans zones tracées (simplify --sans-zones),
  Antarctique en vue polaire, fiche de Porto Rico & co sur les chiffres nationaux. Toutes les observations
  eBird sont rattachées par le code eBird, jamais par nos contours (ils ne servent qu'au clic).
  RESTE : inject-exotic-per-country.mjs lancé sur
  tous changerait 43 étiquettes ailleurs. Cookie eBird : `node outils/build/cookie-ebird.mjs`.

- **v1054 (08/11)** : sources de l'arbre repliées sous un lien « Sources » (`<details class="arb-credits">`).

- **ARBRE PHYLOGÉNÉTIQUE : FINI (Mathis, 08/11), ne pas rouvrir sans nouvelle demande.** v1053 : « 0 / N » quand on n'a vu aucune espèce d'un groupe (pas pour qui n'a
  pas de liste) ; familles à 330 px et genres à 280 pour que ce nombre tienne. Zoom de l'arbre seul (`_arbreZoom`,
  CSS zoom sur `.arb-clado`, 0,4 à 2) : Ctrl + molette, pincer à deux doigts ; le point visé reste sous le curseur.
(v1051 = menu sans émojis, conversation voisine.)

- **v1052 (08/11, conversation de l'arbre)** : avec un pays choisi, chaque case de l'arbre compte les espèces de
  ce pays (vues / présentes), la bulle du nombre garde le chiffre mondial. Réparé au passage : depuis la photo des
  familles (v1048), le nom ne se raccourcissait plus et poussait le nombre hors de la case ; familles à 280 px au
  téléphone (à 190, 58 noms sur 179 étaient coupés).

- **v1050 (08/11, conversation de l'arbre)** : photos des genres et des espèces. Genre : l'espèce de sa famille
  s'il la contient, sinon sa plus observée sur iNaturalist (`outils/build/_photos-genres.mjs`, un classement par
  famille, `gph` dans `data/arbre.json?v=20261108g`, 2 329/2 379), sinon sa première espèce. Espèce : sa propre
  photo (décorative pour le lecteur d'écran). Genres à 250 px pour que le plus long nom tienne avec la photo.

- **v1049 (08/11, conversation de l'arbre)** : plus de point à la racine des familles d'un ordre (la phrase de
  l'ordre le dit déjà, choix de Mathis) ; traits ajoutés aux phrases des Martinets et colibris et des Chouettes.
  `data/arbre.json?v=20261108f`. (Arbre déclaré fini par Mathis le 08/11 : rien à poser.)

- **10/11, v1059 (06d3b716)** : Écologue 100 « Apprenti ornithologue », nouvelle image du kimono, kimono après Bourriche.
  **Palmarès : codé en partie par sa conversation (fermée), NON commité, dans le dossier de travail** (app.js :
  _vitrinePalmaresHtml, dates d'arrivée dans _vitrineCases ; styles.css : .vt-palm-*). Mathis ne l'a pas encore vu.
  Au commit : HEAD + ces zones seulement (les 193 pays de « Nouveaux pays » sont aussi non commités) ; versions
  libres après v1059 / 631.
- **Vitrine des trophées EN LIGNE le 10/11 (v1056, commit a094f89f)** : étages Exploits / ligue / uniques / Fun, Terroir
  en plateau, votes à 1. Chacun arrive avec 0 trophée et débloque un par un ; premier passage muet dans le Fil
  (TROPHEES_VERSION = 2). Reste : t-shirt d'Écologue 200 (« ? »). Palmarès fait en LOCAL (10/11), à valider par Mathis puis à mettre en ligne
    avec le kimono (nouvelle image, après Bourriche) : versions v1058 / 630 au plus tôt (v1057 / 629 = Nouveaux pays ; la session « frontières de la Carte » vise aussi
    v1058 : le premier qui pousse la prend et prévient l'autre). Trois sessions touchent app.js : n'indexer que ses zones. Les 16 familles de l'ancienne grille : abandonnées (10/11).
  Historique ci-dessous (ancien titre : essai local).
- **Refonte des trophées : VITRINE en ESSAI LOCAL sur le vrai site (08-09/11), NON COMMITÉE, rien en ligne.**
  Décisions et détails : `notes-privees/trophees/THEMES.md` (lire la fin).
  - Code : `renderVitrine()` et `_vitrine*` en fin de `renderTrophies` (app.js) ; bloc « Vitrine des
    trophees (ESSAI LOCAL) » et suivants en fin de styles.css ; images dans `assets/trophies/themes/`.
    L'ancienne grille est masquée, pas supprimée. Les 11 bancs sont conformes.
  - Ce qu'on voit : une ligne qui défile, en ébène, un spot par trophée gagné. Pas de socle, pas de
    pointillés. Nom sur une plaque or champagne, bulle courte au survol de la plaque. Animation
    « Poussière d'or ». Trophées « à débloquer » : scintillement, plaque, pastille dorée, défilement.
  - Contenu : Armée d'aigles royaux (aigles, buses, busards, milans, éperviers, autours, balbuzard) et
    Oiseaux de nuit (nom provisoire), 3 étapes chacun selon la place au podium, plus les 11 uniques.
    Progression retirée pour le moment.
  - Essais sans compte : `outils/verif/_essai-attente.mjs`, `_essai-selecteur.mjs`, `_essai-vitrine-site.mjs`.
  - Au 09/11 : Armée d'aigles royaux (nouvelle image, aigles seuls : aigles, buses, busards, milans, éperviers,
    autours, balbuzard) ; The Dark Knight (oiseaux nocturnes : chouettes, hiboux, engoulevents, œdicnèmes,
    bihoreaux) ; égalité = trophée partagé, plaque or/argent/bronze selon la place ; nouveau Pic noir.
    Découpe des images : outils/build/_niveaux-aigles.mjs, _niveaux-chouettes.mjs.
  - Plus tard le 09/11 : image d'Oiseau pélagique, Pic noir rétréci, Calao éclairci, « Happy Feet » revenu
    (table `_troNomActuel` pour qu'un renommage ne passe pas pour un trophée neuf). « Oiseau pélagique » devient
    « Vendée Globe », « Grand ratite » devient « La Tête dans le sable ». Puis Pic noir pic noir pic noir, Jazz Club (jaseur). The Dark Knight devient La Garde de Nuit. Nouveau
    trophée de ligue « La Bande à Picsou » (canards, oies, cygnes ; 3 niveaux). Détail : fin de THEMES.md.
  - 10/11 : trophée de ligue des mouettes dans la vitrine (famille Goélands, mouettes, sternes, sans labbes ;
    3 niveaux : posée, + les deux de droite, + celle de gauche). Nom : « Les 40 Voleurs ».
  - 10/11 : toucher un trophée ouvre la liste de ses oiseaux (monde / France, ceux de la personne cochés) ;
    l'essai « comme si gagné » est passé sur un bouton « Essai ».
  - 10/11 : bas de page retiré partout (tout est dans À propos) ; liseré blanc des aigles retiré.
    Noms : Le Boucher (pie-grièche), Jacquot (perroquet), Batman (engoulevents), Poids plume (colibri),
    Cyrano (toucan), Cyrano(céros) (calao, avec les parenthèses), tous dans _troNomActuel. Tous les trophées de la vitrine ont leur nom.
  - 10/11 : nouveau trophée unique « Gargantua » (pélican) et catégorie « Exploits » avec « Magellan »
    (5 continents sur 7, table CONTINENTS_7). Le site local n'écrit plus d'annonces dans le vrai Fil.
    Anciens trophées (notes-privees/trophees/anciens-trophees.md) : progression reprise (Écologue 100 à 500,
    Terroir, National Geographic en Exploits ; Marco Polo retiré), images provisoires. À faire : images de
    Mathis (t-shirts, Terroir, NatGeo), puis trancher les 16 familles d'oiseaux.
    Trophées en pause repris en Exploits sauf Wallaby (kimono, Nécrophile, Gros Bébé par 1 vote, Sam d'office, vote dans la
    fenêtre ; Bourriche d'huître). Images de Mathis sauf le kimono (ancien badge rond). Vitrine sur plusieurs étages (un par catégorie, chacun défile), étage « Fun » (Nécrophile, Gros Bébé, Bourriche). Anciens votes repris. Au passage en vrai : Bourriche,
    Magellan, Gargantua s'annonceraient dans le Fil pour tous ceux qui les ont déjà.
  - 10/11 soir : Terroir en calques (planche de France, un aliment par région, PDF de Mathis), Écologue 100 « Ça jacasse »
    et 200 « ? », National Geographic à 100 photos, étage Fun privé (absent de la démo), Nécrophile sans « Le »,
    molette bloquée sur les étages. Détail : fin de THEMES.md. Seul le kimono garde son ancien badge.
  - Reste : les autres thèmes (noms, images), le palmarès (décidé, pas fait), puis le passage en vrai (commit
    et mise en ligne, avec les versions à monter : v1056 / ?v=628 au plus tôt, v1055 / 627 pris par le Maroc le 10/11 ;
    index.html, demo/index.html et service-worker.js du dossier de travail portent déjà 627 / v1055, à remonter).

- **v1048 (08/11, conversation de l'arbre) : photos des familles + pays de l'arbre.** Chaque famille a la photo
  de l'espèce de son ordre si elle la contient, sinon de sa plus observée sur iNaturalist
  (`outils/build/_photos-familles.mjs` → `notes-privees/maquettes/arbre/photos-familles.json` → `ph` dans
  `data/arbre.json?v=20261108e` ; 249/250, Mohoidae sans espèce). Les photos ne se cherchent qu'à l'approche de
  l'écran. Bouton pays (`#arbrePays`, propre à la page, « Tous les pays » par défaut, `mb-arbre-pays`) : ce qui n'a
  aucune espèce dans le pays (règle du Birdydex, `_countryHasSpecies`) passe à 32 % d'opacité, case et branche.

- **v1040 (08/11, conversation de l'arbre) : page « L'arbre des oiseaux » EN LIGNE**, menu ⚙ (Plus au téléphone,
  choix de Mathis). Cladogramme des 45 ordres de la maquette D : `renderArbre()` dans app.js (avant renderPokedex),
  bloc « L'arbre des oiseaux » de styles.css (avant les schémas communs), `#viewArbre` dans index.html. Données
  `data/arbre.json?v=20261108` (85 Ko, chargé à l'ouverture seulement ; MONTER le ?v= après régénération par
  `outils/build/arbre-donnees.mjs`), silhouettes `assets/silhouettes/` (235 Ko). Un ordre touché : phrase + familles
  (vues/total) ; une famille : genres (ordre AviList) puis espèces de FR_NAMES, les siennes cochées, fiche au toucher.
  Branches : jusqu'à 60 px, moins si la page est étroite (1 024 px débordait) ; traits écrits sur leur branche
  d'arrivée, sinon numéro + liste ; zones de toucher de 44 px. Points orange : exception notée dans la charte.
  Alias des deux ouettes ajoutés dans SCI_ALIAS (la note « à glisser » est faite).
- **v1041 EN LIGNE (conversation de l'arbre) : phrases des familles + nouveau nom.** Relu et validé par Mathis. Les 221 familles des ordres à
  plusieurs familles ont leur phrase (`notes-privees/maquettes/arbre/phrases-familles.json`), relecture en deux
  fichiers : `notes-privees/arbre/PHRASES-FAMILLES-LOT1.md` (78 hors passereaux) et `-LOT2.md` (143 passereaux) ;
  sources `notes-privees/arbre/wiki-familles/` (`_wiki-familles.mjs`, 20 titres par demande). Famille seule dans son
  ordre = phrase de l'ordre. **La page s'appelle désormais « Arbre phylogénétique »** (choix de Mathis, menu, titre,
  Plus ; `data-view="arbre"` inchangé). data/arbre.json?v=20261108b. Prochaine demande de Mathis : l'arbre doit se PROLONGER À DROITE (familles, puis genres, espèces) au lieu du panneau, déplié seulement au clic.
- **v1047 (conversation de l'arbre) : points entre familles + photos des ordres.** 180 embranchements entre familles
  recherchés (_noeuds-familles, _wiki-pages, _phrases-traits, _traits-familles -> traits-familles.json, relecture
  notes-privees/arbre/TRAITS-FAMILLES.md) : 15 traits sourcés, 165 ADN (Mathis : « tout en ADN » pour les 5 douteux).
  Point gris = ADN, aussi sur les 12 nœuds ADN entre ordres. data/arbre.json?v=20261108d. Photo ronde de « l'espèce
  la plus connue » de chaque ordre à la place de la silhouette (ARBRE_PHOTOS, vérifiée par _photos-ordres.mjs ; la
  silhouette reste en attendant). Styles d'essai (métro, organique, encre, nuit) essayés puis retirés : arrondi gardé.
  Étude à télécharger si Mathis veut aller plus loin : Mayr 2011 (limicoles, doi 10.1111/j.1096-3642.2010.00654.x).
- **v1046 (conversation de l'arbre) : glisser + style « arrondi », traits dans les bulles.** Glisser l'arbre à la
  souris en tenant le fond (box.onpointerdown, zoom 0,85 compensé : 350 px de souris = 412 px de défilement). Mathis a
  comparé trois styles en local et choisi « arrondi » (coudes adoucis, noms en pastilles grises) et les traits
  SEULEMENT dans les bulles : plus de traits écrits sur les branches ni de numéros (32 branches sur 44 ne font qu'un
  étage ; il aurait fallu ~3 000 px). Sélecteur d'essai, _arbreStyle, foreignObject et liste numérotée retirés.
- **v1042 EN LIGNE (conversation de l'arbre) : l'arbre pousse à droite.** Validé par Mathis en local : plus de panneau ; ordre -> familles avec les VRAIES branches de Stiller (_familles-arbres.mjs
  -> familles-arbres.json -> o.arbre dans data/arbre.json ; 43 familles absentes en pointillé, « place non
  publiée »), famille -> genres -> espèces en râteau, chaque étage au clic (_arbreOuverts). Le nom reste EN HAUT de
  son bloc (centré, les Passereaux tombaient au milieu de 143 familles) ; ordinateur : ce qui pousse part à droite du
  nom ; téléphone : en retrait dessous. Phrase au-dessus des branches, hauteur selon le texte. À MOI dans le diff :
  app.js (bloc « Arbre phylogénétique »), bloc CSS de l'arbre dans styles.css (PAS le hunk tchat/bas de page vers
  la ligne 4526, ni « Merlin / eBird » dans index.html et demo : autre conversation), data/arbre.json (?v=20261108c),
  outils/build/arbre-donnees.mjs, outils/build/_familles-arbres.mjs.

- **v1035-v1037 (08/11)** : fiche au téléphone : flèches et croix 44 px alignées ; « Où et quand », debout, mois
  en grille AU-DESSUS de la carte, carte pleine largeur ; Répartition en aspect-ratio 10/7 (plus de gris) ;
  échelle du graphique des mois au PINCEMENT à deux doigts (choix de Mathis, pas de boutons). Carte : suggestions
  de recherche en rond chiffré + X/P/N du pays ouvert, rien sans pays, et sans pays tous les oiseaux du monde.

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
- **FAIT en v1040 (accord de Mathis, 08/11)** : deux lignes dans `SCI_ALIAS` d'app.js,
  `'neochen jubata': 'oressochen jubatus'` (Ouette de l'Orénoque) et `'chloephaga melanoptera': 'oressochen melanopterus'`
  (Ouette des Andes). AviList v2026 les nomme ainsi, l'API eBird dit encore Oressochen le 08/11
  (`outils/build/_ouettes-ebird.mjs`) ; sans alias, le jour où eBird suit, elles sortiraient en anglais au palier 10.
  Les 3 autres renommées (brachycope, humblotia, thryorchilus) y sont déjà.
- **v1019** : Classement au téléphone : les 4 colonnes de droite REVIENNENT et défilent de côté, rang, joueur et nombre
  figés (choix de Mathis) ; barème des tris sur toute la largeur ; filtres de Qui a vu quoi rangés, 10 ronds sur une
  ligne ; X/P/N à 19 px (plus petits que les chiffres, 24). Essais : _essai-classement-tel.mjs, _essai-filtres-qui.mjs.
- **v1018** : la pastille de version des admins (#adminBuildStamp) cachée au téléphone, gardée à l'ordinateur.

## CHANTIER FINI (demandé et clos le 08/11) : l'arbre de l'évolution des oiseaux
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
  qu'elle ne traite pas (sous-groupes des engoulevents/martinets, noeuds sans nom). **Puis (« continue les
  recherches »)** : Chen & Field 2020 (Vertebrate Zoology, CC BY, PDF via le dépôt de Cambridge,
  `notes-privees/arbre/sources/chen-field-2020.*`) pour Vanescaves, Sedentaves, Letornithes, et Wikipédia
  (Owlet-nightjar) pour Daedalornithes (`_traits-chen.mjs`). Bilan final : 12 source, 20 approx, **12 ADN** = 4
  déclarés sans trait par Sangster (n20, n21, n25, n36), 5 noeuds propres à Stiller 2024 que personne ne traite
  (n9, n15, n17, n19, n23), et Columbaves, Otidimorphes, outardes+coucous (rien trouvé ; le livre de Mayr
  « Paleogene Fossil Birds » a un chapitre Columbaves, payant). MDPI (Chen et al. 2019) bloque les robots.
  **Phrases des 45 ordres écrites** (`notes-privees/maquettes/arbre/phrases-ordres.json`, relecture dans
  `notes-privees/arbre/PHRASES-ORDRES.md`), tirées de l'intro Wikipedia EN de chaque ordre (`_wiki-ordres.mjs`,
  textes dans `notes-privees/arbre/wiki-ordres/`), reformulées ; affichées au clic sur un ordre dans la maquette D.
  Suite faite : phrases relues, familles écrites et validées (v1041), page en ligne (v1040). Chantier FINI le 08/11.

## CHANTIER FINI (07/11 au 08/11, v1015 à v1017) : le site au téléphone
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
Mathis sur iPhone : clavier (barre cachée, pas de zoom), barre Safari, appli installée.
**3b (08/11)** : maquette de toutes les pages d'un coup, choisie par Mathis : `notes-privees/maquettes/telephone-pages/`
(Ma liste A/B, Classement A/B, Birdydex A/B/C, Trophées A/B, Carte A/B, Tchat A/B ; CSS de chaque version dans
la page). Captures : `notes-privees/chantier-telephone/pages/` (outils/verif/_capture-maquette-pages.mjs).
**v1016 (08/11) EN LIGNE**, choix de Mathis : Ma liste A (carré teinté des icônes GARDÉ, il l'a demandé), Classement A
mais « Qui a vu quoi » en TABLEAU comme à l'ordinateur (pas les cartes), Trophées A, Carte B, Tchat A
(_chatEnBas). Essai : outils/verif/_essai-pages-tel.mjs. **v1017** : Birdydex C (3 colonnes même à 360 px, nom 14 px, sans latin ni numéro). Chantier téléphone 3b FINI ;
iPhone (clavier, barre Safari, appli installée) : bon pour Mathis le 11/11 (« c bon »). Plus rien d'ouvert.
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
