# Ajouter un pays

Recette reconstituée le 2026-11-09 à partir de ce que porte un pays complet (la Namibie) et des
commits d'ajout (Australie 521f8b45, Europe entière 8eb3a564, cartes par zone 20201996, régions
LU/MK/MD 492f1601, frontières 0e730565). Elle se fait **étape par étape pour tous les pays du lot**,
pas pays par pays. À corriger au premier passage (Maroc) partout où elle se trompe.

Un pays est **fini** quand, en local, sur ordinateur et au téléphone : il apparaît dans le sélecteur
avec son drapeau et son continent, sa rareté s'affiche, ses régions se choisissent dans la fiche,
sa carte des exotiques par zone n'est pas vide, et il se clique sur la Carte avec ses zones.

## Ce que le Maroc a appris (2026-11-09)

Quatre scripts avaient vieilli sans que personne le voie, corrigés au premier passage :
- `inject-rarity-multi-country.mjs` ne sert plus pour un pays nouveau : ses tables ne vivent plus
  dans app.js. C'est **`verser-pays.mjs XX`** qui les verse dans les deux fichiers de `data/`.
- `scrape-ebird-exotic.mjs XX` réécrivait son fichier avec le seul pays demandé (les 53 autres
  effacés) : il repart maintenant du fichier existant.
- `inject-exotic-per-country.mjs` ne parcourait que les pays déjà connus et cherchait les
  fréquences dans app.js. Il prend maintenant les pays en argument (**toujours le passer** : lancé
  sur tous, il changerait 43 étiquettes d'autres pays, question à trancher à part).
- `download-bar-charts-regional.mjs` lit les zones d'un pays nouveau chez eBird et le cookie dans
  `EBIRD_COOKIE_FILE`.

Et deux pièges :
- `build-freq48-par-zone.mjs` refait TOUS les pays : il a remis Melilla (ES-ML), retirée exprès.
  Après lui, `git status data/countries` et annuler ce qui n'est pas le nouveau pays.
- Le scrape national des exotiques a rendu 0 au premier passage, 13 au second (page pas finie) :
  un 0 se relance avant d'y croire.

## 0. Avant de commencer

- Cookie eBird d'une session connectée (les bar charts l'exigent) : `node outils/build/cookie-ebird.mjs`
  ouvre une fenêtre, on s'y connecte, il écrit `C:\Users\mathi\Documents\.ebird-cookie.txt`. Le
  passer en `EBIRD_COOKIE_FILE=...` à tous les scripts.
- Jeton `EBIRD_API_KEY` dans `Documents\.Renviron` pour l'API.
- Les scrapers qui lisent la page HTML refusent le mode invisible : fenêtre visible. 0 espèce en
  `headless` ne dit rien sur la zone (skill `donnees-ebird`).
- Écarter un pays trop petit pour faire un Birdydex (précédent : Vatican, Monaco, Saint-Marin,
  Liechtenstein, Andorre écartés).

## 1. Les zones

- Liste des zones demandée à eBird, jamais à `zones-agregees.json` :
  `https://api.ebird.org/v2/ref/region/list/subnational1/XX.json`.
- Une liste non vide ne prouve pas que les zones portent des données (Malte : 68 conseils à 0 espèce).
- Trop de petites zones : les regrouper (`zones-agregees.json`, puis `zones-regroupees.mjs`).
- Vérifier que les données eBird et le contour dessiné couvrent la même surface (territoires
  disputés, îles, enclaves).

## 2. Les bar charts (cookie)

- `outils/build/download-bar-charts-regional.mjs XX` : national + chaque zone, 2019-2026. Ajouter
  le pays et ses zones dans `REGIONS`.
- Facultatif : `outils/build/download-bar-charts-par-annee.mjs` (national année par année, liste
  `PAYS`), pour `compter-annees-presence.mjs` (`ANNEES_PRESENCE`). Seuls 16 pays l'ont (09/11) ; le
  Maroc ne l'a pas, comme les 37 pays européens ajoutés le 2026-09-26.

## 3. Rareté et fréquences

- `releve-dates-barcharts.mjs` d'abord (date de chaque fichier téléchargé), sinon le suivant s'arrête.
- `build-rarity-multi-country.mjs XX` (listes `COUNTRIES` et `REGIONS`). Contrôler les noms non
  appariés : seuls des « sp. », hybrides et « X ou Y » doivent rester.
- `verser-pays.mjs XX` : vers `data/rarity_pays.json` et `data/freq_monthly_pays.json`.
  **Monter leur `?v=` dans app.js** (`freq:` et `rarete:`).
- `inject-rarity-multi-country.mjs XX` met à jour `EFFORT_MENSUEL_PAR_PAYS`.
- `data/countries/xx/` : `freq_48.json`, `freq_by_region.json`, `freq48/` + `freq48_index.json`
  (`build-freq48-par-zone.mjs`), `effort_by_zone.json` (`build-effort-by-zone.mjs`).
- `EFFORT_MENSUEL_PAR_PAYS` dans app.js.

## 4. Exotiques

- National : `scrape-ebird-exotic.mjs XX` (liste `COUNTRIES`, fenêtre visible),
  `build-exotic-per-country.mjs`, puis `inject-exotic-per-country.mjs`.
- Par zone : `scrape-exotic-by-region-multi.mjs` (pays dans `REGIONS`), puis
  **`inject-exotic-by-region.mjs` (liste `CCS`) : obligatoire**, sans lui la carte de statut reste
  vide sans le dire. Contrôle : `etat-injection.mjs`, `etat-exotiques.mjs`, `verifie-zones-vides.mjs`.
- `exotiques-majoritaires.mjs --ecrire`.

## 5. Contours

- `simplify-regions-multi.mjs <ne_admin1.geojson> XX` : `data/regions-xx-simplified.json`.
- `ebird-zones-carte.mjs`, puis `simplify-regions-multi.mjs --carte` : `data/carte-zones/xx.json`.
- `data/carte-pays.json` a déjà les frontières des 234 pays : le pays devient cliquable dès qu'il a
  une rareté.

## 6. Branchements dans app.js

- `COUNTRIES_REG` : entrée `XX` (nom, `flagCode`, `barTier`, `monthly`, `monthlyByRegion`,
  `hasBarchart`).
- `REGIONS_BY_COUNTRY` : zones avec leur nom **en français**.
- `CONTINENT_BY_CC` et le drapeau (beaucoup de pays y sont déjà) : un pays absent tombe dans
  « Autres ».
- Les deux tables de noms avec article (« la Namibie ») : chercher `NA:'la Namibie'`.
- `CT_HORS_EUROPE` si le pays n'est pas en Europe ; `_SM_COUNTRY_BOUNDS` (cadre de la carte).

## 7. Vérifier et publier

- Local (localhost:8765), ordinateur et téléphone, les points de « fini » ci-dessus.
- `node outils/verif/tous.mjs`, juger sur la dernière ligne ; `genere-demo.mjs` si index.html bouge.
- `node outils/build/poids-publie.mjs` avant et après.
- Monter les trois numéros (CLAUDE.md, « Déployer ») ; commiter seulement ses morceaux si un autre
  travail est en cours dans le dossier.
