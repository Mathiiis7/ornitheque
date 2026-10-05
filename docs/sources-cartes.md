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
