# Cartes de répartition et de migration : par quoi remplacer Status & Trends

Recherche du 2026-10-01. Point de départ : les conditions de Cornell (version du 30/10/2023, section
« Websites, web-based platforms, mobile applications ») interdisent tout usage des données
Status & Trends sur un site sans accord écrit, y compris les cartes qu'on en dérive.

Aujourd'hui : 4 367 espèces ont une carte de répartition (2 898 Status & Trends, 1 469 GBIF à
500 observations au plus), 304 ont l'animation de migration (toutes Status & Trends).

## La trouvaille : les observations eBird elles-mêmes sont libres, via GBIF

Cornell publie ses observations brutes sur GBIF sous le nom « EOD - eBird Observation Dataset » :
**1,78 milliard d'observations, licence CC BY 4.0** (vérifié sur l'API GBIF, jeu
`4fa7b334-ce0d-4e88-aaae-2e0c138d049e`). CC BY 4.0 autorise l'affichage et la transformation,
y compris sur un site, à condition de citer. Les conditions restrictives de Status & Trends
portent sur les MODÈLES de Cornell, pas sur ces observations.

On peut donc fabriquer nos propres cartes à partir des mêmes données de terrain qu'eBird, mais
sans le modèle statistique de Cornell.

### Testé

- **Cartes GBIF à la demande** (`/v2/map/occurrence/adhoc/`) : acceptent un filtre par MOIS et
  par jeu de données. Testé sur l'Hirondelle rustique, eBird seul : en janvier l'Afrique, l'Inde
  et l'Asie du Sud-Est, en juin l'Europe et la Sibérie. La migration se voit. Sans compte.
- **Cartes GBIF classiques** (`/v2/map/occurrence/density/`) : ignorent le mois (même image à
  l'octet près pour mai et décembre). Inutilisables pour la migration.
- **Téléchargement SQL GBIF** : une seule requête peut compter les observations par espèce, par
  mois (ou par semaine via le jour de l'année) et par case de grille, pour toutes les espèces
  d'un coup. Fonctions de grille disponibles : `GBIF_EQDGCode`, `GBIF_EEARGCode`,
  `GBIF_ISEA3HCode`... Demande un compte GBIF gratuit (à créer par Mathis), fonction encore
  « expérimentale », résultat en TSV zippé. Pas encore testé faute de compte.

### Ce que ça donne, honnêtement

- **Couverture** : toutes les espèces vues dans eBird, donc bien au-delà des 2 898 de Cornell.
- **Le défaut** : des comptes bruts suivent les observateurs, pas les oiseaux. L'Europe et les
  États-Unis paraissent pleins, l'Afrique et la Sibérie clairsemées. Status & Trends corrige ce
  biais par un modèle ; nous non.
- **La parade** : diviser, case par case et mois par mois, le nombre d'observations de l'espèce
  par le nombre total d'observations d'oiseaux dans la case. On obtient une fréquence de
  signalement, la même idée que les bar charts d'eBird. Les cases vides restent vides : pas
  d'extrapolation dans les zones jamais visitées.
- **Citation** : CC BY 4.0 + règles GBIF, citer le DOI du téléchargement, ou créer un
  « derived dataset » GBIF (DOI) quand les données viennent de l'API sans téléchargement.

### Essai sur dix espèces (2026-10-01)

Cartes « à la demande » GBIF, eBird seul, 2015-2025, cases de 1,40625° (≈ 155 km), 12 mois.
Fréquence = observations de l'espèce / observations de tous les oiseaux, case par case.
Hirondelle rustique, Cigogne blanche, Martinet noir, Guêpier, Huppe, Rougegorge, Aigle royal,
Bécasseau maubèche, Faucon d'Éléonore, Abroscope à face noire (sans Status & Trends).

- **Temps** : 3 min pour les dix, avec 6 demandes en parallèle. GBIF coupe des connexions dès
  qu'on insiste : il a fallu des reprises et redescendre à 2 en parallèle.
- **Bruit** : sans correction, les cases peu visitées sortent en rouge vif (3 hirondelles sur
  20 observations). Corrigé en regroupant chaque case avec ses 8 voisines et en ramenant vers la
  médiane de l'espèce tant que l'effort regroupé est sous ~300 observations.
- **Résultat** : les grandes lignes concordent avec Status & Trends (aires, hivernage africain ou
  indien, retour en Europe l'été). Plus grossier (155 km contre 3 à 9 km), l'Afrique et la Sibérie
  restent clairsemées, et il reste quelques points isolés d'égarés.
- **Piège taxonomique** : le Sizerin blanchâtre donne 0 observation, eBird l'a fusionné en 2024
  avec le Sizerin flammé. Il faudra croiser avec la taxonomie eBird, pas seulement GBIF.
- **Passage à l'échelle** : à ce rythme, ~10 000 espèces prendraient des dizaines d'heures en
  cases quatre fois plus fines. La voie réaliste est le téléchargement SQL (une requête pour
  tout), qui demande un compte GBIF.

- **Cases trop grosses, et pourquoi** : les cartes « à la demande » ignorent `squareSize`. Elles
  regroupent par géohash, dont la taille ne dépend que du zoom : ≈ 1,4° jusqu'au zoom 3 compris,
  ≈ 0,35° seulement au zoom 6 (tuiles de 2,8°, des milliers par mois et par espèce). Un essai
  à 40 km par cette voie a donné une carte en pointillés : impasse, mesurée le 2026-10-01.
  Le rendu fondu (interpolation entre centres de cases) efface l'escalier à l'œil, pas le flou.
  Pour descendre à 15-30 km : téléchargement SQL avec `GBIF_EQDGCode` (0,25° ou 0,125°).

Script et planches : `notes-privees/essai-cartes/` (comparaison côte à côte, servie en local).

## Les autres pistes

| Source | Ce que c'est | Sur notre site ? | Verdict |
|---|---|---|---|
| GBIF, eBird seul (EOD) | observations eBird, monde | oui, CC BY 4.0, citer | **retenu** |
| GBIF, toutes sources | + iNaturalist, INPN, musées | oui, mais licences mêlées (dont CC BY-NC) | possible, plus compliqué à citer |
| BirdLife / NatureServe | polygones d'aire, >10 000 espèces | demande par formulaire (5 à 10 jours), non commercial ; cartes dérivées admises si « transformatives », données brutes jamais | bon complément pour l'aire, pas de saisons fines |
| OpenObs (INPN) | observations françaises, maille 10 km | oui, Licence ouverte Etalab | France seule ; pas d'API, export de 2 millions de lignes max |
| EBBA2 | atlas européen des nicheurs | une partie ouverte, le reste sur accord de l'EBCC | nicheurs seuls, pas de migration |
| EuroBirdPortal | animations hebdo, ~600 espèces, Europe, 30 km | visionneuse gratuite ; données sur accord | **un lien** vers leur page, pas de copie |
| Status & Trends | modèles Cornell | accord écrit obligatoire | à retirer ou à faire autoriser |

Non vérifié dans le détail (à creuser si besoin) : Movebank (suivis GPS, licence propre à chaque
étude), atlas de migration EURING (reprises de bagues).

## Recommandation

1. Fabriquer cartes de répartition et cartes mensuelles de migration à partir des observations
   eBird via GBIF, en fréquence de signalement, pour toutes les espèces.
2. Tester d'abord sur une dizaine d'espèces bien connues (migratrices, sédentaires, rares) et
   comparer à l'œil avec Status & Trends avant de tout générer.
3. Garder le lien EuroBirdPortal en complément pour l'Europe à la semaine.
4. Le mail à Cornell devient inutile si le résultat est satisfaisant.

## Ce qui a été fait (2026-10-05)

Générateur : `outils/build/cartes-gbif.mjs` (33 min, 6 passes sur le zip). Sortie dans le dépôt
`ornitheque-data/cartes/`, manifeste copié dans `data/cartes-index.json`.

- **Données** : téléchargement SQL GBIF, eBird seul, depuis 2015, espèce × mois × case de 0,25°
  (DOI 10.15468/dl.c7y4kg) ; espèces sans donnée eBird : autres sources (DOI 10.15468/dl.rb9sut).
  Les codes de case sont le coin sud-ouest ; les lignes d'une même espèce arrivent mélangées.
- **Résultat** : 10 896 cartes, 10 660 tirées d'eBird (fréquence corrigée de l'effort) et 236 de
  présence seule. 39 espèces ont trop peu d'observations pour une carte. 82,7 Mo en tout.
- **Format** : par espèce, une grille de 1 pixel par case en niveaux de gris (32 rangs), rognée sur
  l'aire, colorée et passée en Mercator par le navigateur. En PNG couleur, la même chose pesait
  2,7 Go, au-dessus du plafond de 1 Go de GitHub Pages.
- **Échelle** : rangs calculés mois par mois (choix de Mathis). Avec des rangs communs aux 12 mois,
  juillet était tout vert pour le rougegorge, qu'on signale moins l'été.
- **Trous** : une case jamais visitée au milieu de l'aire est comblée si au moins 5 de ses 8
  voisines sont occupées. Un simple lissage faisait déborder les cartes en mer.
- **L'animation** passe de 52 semaines (Status & Trends, 304 espèces) à 12 mois, pour toutes.

Suite, recherche du 2026-10-21 sur les zones vides : `docs/cartes-combler-les-trous.md`.

## Refaites le 2026-10-21 : toutes les bases GBIF

Décidé par Mathis : une seule source, la plus complète, utilisable sans accord à demander. Les cartes
passent en **CC BY-NC 4.0** (licence d'ensemble du téléchargement : pas d'usage commercial).

- **Données** : téléchargement SQL GBIF du 2026-10-21, **DOI 10.15468/dl.vnrtqk**, oiseaux depuis
  2015, observations humaines, incertitude <= 10 km : 76 millions de lignes, 10 367 jeux,
  1 777 millions d'observations dont 1 485 d'eBird (qui s'arrête fin 2024 sur GBIF). Les espèces
  sans donnée eBird gardent leur carte de présence tirée de 10.15468/dl.rb9sut.
- **Règle de mélange**, validée par Mathis sur 23 espèces (page `notes-privees/maquettes/melange/`) :
  eBird et les atlas d'Afrique (SABAP2, Kenya, Nigeria), tous des listes complètes, dans un même
  calcul ; les observations isolées (iNaturalist, Observation.org...) seulement là où les listes ont
  moins de 30 observations, ramenées à l'échelle des listes ; mois voisins pour les cartes
  mensuelles. Le détail est en tête de `outils/build/cartes-gbif.mjs`.
- **Contrôle** : le générateur redonne les 23 cartes de la page à la case près (année) et au
  compte près (12 mois).

### Ajouté après la validation, sur la génération complète

| Quoi | Pourquoi (mesuré) |
|---|---|
| Un atlas est aussi écarté pour un oiseau qu'il note **plus de 4 fois** autant qu'eBird | Les atlas gardent d'anciens noms : leurs Flamants roses allaient au Flamant des Caraïbes (Afrique du Sud colorée), leurs Hérons à bec jaune à l'Aigrette intermédiaire d'Asie, leurs oies domestiques à l'Oie cendrée (65 fois eBird). Entre 2 et 4 fois, ce sont de vrais oiseaux discrets (cisticoles, rousserolles). 200 espèces ont un atlas écarté. |
| Un trinôme dont la sous-espèce est devenue espèce chez eBird va à cette espèce | « Corvus corone cornix » (1,07 million d'observations isolées) allait à la Corneille noire, qui gagnait 1 668 cases, en Russie entre autres. 256 noms changent d'espèce, tous des observations isolées, tous de vraies séparations. |
| Pas de carte pour les 173 espèces éteintes selon eBird | Un Dronte de Maurice, un Grand Pingouin, un Eider du Labrador sortaient de spécimens de musée. |
| Les espèces sans observation eBird ici gardent leur carte de présence d'avant | Par la règle, le Faucon taita passait de 23 cases à 3, le Râle à miroir de 10 à 1. |
| Carte de présence d'après les listes seules pour une espèce qui en a trop peu pour la règle (37 espèces) | Avec les observations isolées, l'Ara canindé, qui ne vit qu'en Bolivie, couvrait 870 cases de large (oiseaux de zoo). |

### Résultat

- **10 935 cartes** (10 896 avant, aucune perdue) : 10 662 par la règle, 236 de présence d'avant,
  37 de présence d'après les listes. 106,2 Mo d'images (82,7 avant).
- **+6,8 % de cases colorées** au total ; 1,4 % des cases d'avant disparaissent, surtout 1 à 4 cases
  d'espèces rares d'îles (le filtre de précision à 10 km). Aucune espèce ne perd plus de la moitié de
  ses cases.
- **Teinte iNaturalist** recalculée (règle des 80 %) : 5 501 espèces (5 528 avant), 66 perdues
  surtout en Afrique australe, où l'atlas étend la carte au-delà de l'aire iNaturalist.

### Limites connues, non corrigées

- **Noms regroupés dans les autres bases** (le binôme seul, sans sous-espèce) : le Pipit de
  Nouvelle-Zélande reçoit des pipits d'Australie (424 cases ajoutées), le Mérion de Lambert des
  mérions de l'intérieur australien (455). Mesuré : part des cases bien observées où les isolées
  voient l'oiseau et jamais les listes, 91 % et 75 % ; mais de vrais oiseaux discrets sont au même
  niveau (Chouette de Tengmalm 69 %, Grand Tétras 61 %, Râle des genêts 54 %). Pas de seuil propre,
  donc pas de garde-fou.
- **Perroquet robuste** : SABAP2 y range aussi le Perroquet à cou brun, à 2,1 fois eBird, sous la
  borne de 4.
- **Chouette lapone** : un seul point, près d'Ottawa. eBird ne publie presque rien d'elle sur GBIF
  (sans doute une espèce protégée des curieux, non vérifié).
- **Oiseaux de cage** : comme avant, des cases isolées loin de l'aire (Coq bankiva, Paon bleu,
  Perruche ondulée).

Contrôles et mesures (hors dépôt) : `notes-privees/essai-cartes/tout/verif/` - `comparer23.mjs`
(générateur contre la page validée), `avant-apres.mjs` (cases par espèce), `noms-sous-especes.mjs`
(noms qui changent d'espèce), `fabrique-mesure.mjs` (part des isolées sans les listes),
`nettoyer-cartes.mjs` (images sans carte). Journal de la génération (87 min) :
`notes-privees/essai-cartes/generation-tout.log` ; détail par espèce : `tout/cartes-bilan.json`.
