# Nouvelle page Carte : quelles données, et comment le site peut s'en servir

Recherche du 2026-10-23, faite pour la refonte de la page « Carte » (demande de Mathis : garder le principe
de la carte des amis, ajouter hotspots et observations récentes, contours de pays et de régions cliquables).
Quatre couloirs menés en parallèle : bases mondiales, France, reste de l'Europe, sites officiels. Les rapports
complets, avec chaque adresse lue, chaque sonde et ses chiffres, sont hors dépôt dans
`notes-privees/recherche-carte/` (`1-bases-mondiales.md`, `2-france.md`, `3-europe.md`,
`4-sites-officiels.md`, scripts dans `scripts-1/` à `scripts-4/`). Les cartes de répartition ne sont pas
traitées ici : voir `docs/sources-donnees-oiseaux.md`.

Aucun compte créé, aucun formulaire, aucun message envoyé, aucun mur anti-robot contourné.

## La règle qui a tranché

Le site est statique (GitHub Pages) : chaque appel part du navigateur du visiteur. Une source n'est
utilisable **en direct** que si elle répond en cross-origin (en-tête `Access-Control-Allow-Origin`) sans clé
secrète. Toutes les sondes ont envoyé `Origin: https://mathiiis7.github.io` et lu cet en-tête : c'est mesuré,
pas tiré des documentations. Une source sans cet en-tête peut encore servir **en fichier** préparé chez nous
dans `data/`, si sa licence permet de publier un dérivé. La ligne de licence reste celle du 2026-10-21 :
CC BY-NC au plus fermé, et attention aux clauses « partage à l'identique » (SA, ODbL) et « pas de
modification » (ND).

## Ce qui est utilisable

### Observations récentes (en direct, au clic sur une zone)

| Source | Où elle compte | Fraîcheur | Zone interrogée par | Licence | Remarque |
|---|---|---|---|---|---|
| **eBird API v2** | partout ; seule source ouverte en France | moins d'une heure après la saisie | code de région : `FR`, `FR-ARA`, département `FR-PDL-85` (pas `FR-85`), ou cercle de 50 km | conditions **non lues** (page bloquée) | `recent/notable` pour les raretés (20 % non validées, à marquer), `recent?sppLocale=fr` pour les espèces |
| **Artportalen (WFS)** | Suède | le jour même | boîte, comté, commune | CC0 (jeu GBIF), mention « Artportalen, SLU Artdatabanken » | filtrer `datasetName='Artportalen'` (il mélange de l'iNaturalist) ; dates en UTC qui reculent d'un jour ; pas de tri serveur |
| **Artskart** | Norvège | le jour même | comté (`countys[]=42`) | CC BY 4.0 | 10 à 24 s au premier appel |
| iNaturalist API v2 | complément partout, pour les photos | médiane 6,6 jours | boîte, cercle, `place_id` | une licence par observation, filtrable (`license=cc0,cc-by,cc-by-nc`) | v2 avec `fields=` : 450 octets par observation, contre 43 Ko en v1 |

Pourquoi la Suède et la Norvège : eBird y pèse 5 et 7 % des observations publiques. Le 22/10, eBird avait
40 listes pour toute la Suède, Artportalen 380 observations pour la seule Scanie. Ailleurs, eBird fait 77 à
91 % (Espagne, Portugal, Royaume-Uni, Suisse, Grèce) et le reste est fermé.

eBird en France reste modeste : 195 listes le 22/10 (Royaume-Uni : 1 026).

### Hotspots

| Source | Ce qu'elle donne | Accès | Licence | Poids |
|---|---|---|---|---|
| **Hotspots eBird** | 18 066 sites en France, nombre d'espèces de tous les temps, dernière visite ; au clic : espèces jamais vues et vues ces 30 jours | en direct, par département | conditions non lues | Vendée : 83 Ko, 13 Ko pour les sites actifs sur 30 jours. **Jamais la France d'un coup** (4,57 Mo, jusqu'à 30 s) |
| **ZPS Natura 2000** (+ Emerald hors UE) | les oiseaux qui justifient la protection de chaque site, avec saison (nicheur, hivernant, passage) et effectifs | fichier dans `data/` (le service EEA répond aussi en direct) | CC BY 4.0 | 392 ZPS françaises : 103 Ko compressés ; 5 231 ZPS de l'UE : 915 Ko |
| **Réserves naturelles, Conservatoire du littoral, Ramsar (France)** | contours et noms des lieux où l'on va observer | WFS de la Géoplateforme IGN en direct, ou fichier simplifié | Licence Ouverte (mention « Muséum national d'Histoire naturelle ») ; Ramsar CC BY 4.0 | 186 RNN brutes : 4,4 Mo, à simplifier |
| Birdingplaces.eu | 10 818 sites rédigés (957 en France), note de qualité, saison conseillée | copie dans `data/` (pas de CORS) | **CC BY-NC-ND** : titre tel quel, auteur, lien ; ni traduire ni résumer | page source 7,3 Mo |
| Observatoires OpenStreetMap | 806 affûts en France | fichier dans `data/`, **séparé** | **ODbL** (le fichier reste sous ODbL) | presque jamais de nom (0 sur 34 dans la Somme) |

Pour les ZPS, deux choses à écrire à l'écran : c'est la liste des espèces qui ont justifié la protection, pas
un inventaire, et les espèces sensibles en ont été retirées. Les sous-espèces (5 034 lignes) se ramènent à
l'espèce, comme pour GBIF.

### Contours cliquables

Le site a déjà les contours des 244 pays (`data/countries/`), des régions de 52 pays
(`data/regions-*-simplified.json`) et des départements (`data/departements-fr-simplified.json`). Un clic se
traduit tel quel en code eBird, à une table près pour les départements (`FR-PDL-85`). Les ZPS et les
réserves n'ont pas de code de région : le rattachement se fait une fois, au moment de générer le fichier, en
croisant chaque site avec nos contours.

## Ce qui est fermé, et pourquoi

- **Faune-France et tout VisioNature** (faune-xxx.org, ornitho.ch/.it/.de/.at/.lu/.cat/.eus, migraction) : la
  meilleure source française, à jour le jour même, mais pas de CORS, une API en OAuth avec clé secrète (donc un
  serveur), et des CGU (28/01/2025) qui interdisent scraping, produits dérivés et même liens profonds sans
  convention avec la LPO et Biolovision.
- **Observation.org** (46 % des oiseaux de France sur GBIF en 2025) : pas de CORS, API réservée aux
  « applications approuvées ». Demanderait un serveur et un accord.
- **GBIF pour le récent** : 2 semaines à 2 mois de retard, et aucune donnée eBird depuis 2025.
- **Oiseaux de France (LPO), atlas GeoNature régionaux** : pas de CORS, droits réservés ; les atlas ont un à
  deux ans de retard.
- **Trektellen** : « not open data », Cloudflare. **Rare Bird Alert, BirdGuides** : payants.
  **DOFbasen** : pages HTML seules. **laji.fi** : jeton à ne pas révéler, et surtout de l'iNaturalist.
- **IBA/KBA (BirdLife), WDPA** : leurs conditions interdisent de rediffuser les contours, même simplifiés.
- **API de l'INPN** : ouverte (CORS, Licence Ouverte), interrogeable par code INSEE, mais aucune observation
  chargée au 23/10. L'INPN annonce ses outils de consultation pour fin 2026 : **à retester à ce moment-là**.

## Ce qui a résisté (à lire par Mathis dans son navigateur)

1. **Les conditions de l'API eBird** (`birds.cornell.edu/home/ebird-api-terms-of-use/`), bloquées pour la
   troisième fois, **lues par Mathis et collées le 2026-10-23** (version du 19/10/2021) :
   - usage permis : non commercial, « websites, web-based platforms » cités nommément (2.1). Notre cas.
   - attribution (3) : citer « eBird.org » partout où les données s'affichent, avec un lien vers eBird.org.
   - **pas de copie en fichier** : on ne peut télécharger qu'une seule copie sur un seul appareil, pour usage
     personnel (2.3), et il est interdit de faire un miroir des sites de l'API (5.1). Les hotspots eBird se
     lisent donc **en direct**, jamais depuis `data/`.
   - **« You will not share your API key(s) with any third party »** (2.5). Le jeton public d'`app.js`
     (décision du 2026-09-28, voir CLAUDE.md) va contre cette phrase. **Tranché le 2026-10-23 : un petit
     relais** (Cloudflare Worker ou fonction Vercel, gratuit) garde la clé en secret, appelle eBird à la place
     du visiteur et met les réponses en cache quelques minutes. Le site reste sur GitHub Pages. À faire au
     moment de construire la Carte.
   - ne pas nuire à la stabilité des serveurs (2.2) : compter et mettre en cache les appels.
   - toutes les données de l'API relèvent en plus des « eBird Data Access Terms of Use », **non lues**.
   - les conditions générales du Cornell Lab (23/10/2024, collées par Mathis le même jour) le confirment :
     ne pas reproduire, distribuer ni « re-post on another site » leur contenu sans accord écrit (II.2), pas
     de miroir, mais faire des liens vers leurs services (II.4).
2. **Le plafond eBird** : 500 requêtes par heure et 25 par 5 secondes, lu dans les en-têtes. **Compté par
   CLÉ** (mesuré le 2026-10-23 : 25 appels par le relais et 25 en direct au même instant, sur 50 hotspots jamais
   demandés, donnent 26 réussites en tout, pas 50). C'est donc 500 par heure pour tous les visiteurs ensemble,
   avant comme après le relais : la nouvelle Carte doit étaler ses appels (file d'attente dans `_ebFetch`,
   reprise après un 429) et ne rien charger en rafale. L'ancienne « Top hotspots » en lance 200 d'un clic.
3. Conditions d'iNaturalist, de GBIF et d'Observation.org (pages anti-robot). Les licences d'iNaturalist et de
   GBIF ont été lues par leurs API, fiche par fiche.
4. Non lus : conditions d'ornitho.it, .at, .lu, .cat, .eus ; quotas de l'API Artportalen avec clé ; fiches IBA
   (le site de BirdLife interdit les robots d'IA) ; comptes des espèces des ZNIEFF (serveur en 429) ; OpenObs
   (hors service) ; Biodiv'Pays de la Loire (pas de réponse) ; BirdGuides, Dutch Birding, Tarsiger,
   rarebirdspain (refus ou page vide).

## À l'affichage

- `detail=full` d'eBird donne nom et prénom des observateurs, et la moitié des listes sont sur des lieux privés
  dont le nom est souvent une adresse : à montrer avec retenue.
- Chaque source affichée a sa mention : eBird, « Artportalen, SLU Artdatabanken », « Artsdatabanken /
  Artskart », auteur et licence de chaque observation iNaturalist, « Natura 2000, Agence européenne pour
  l'environnement (CC BY 4.0) », « Muséum national d'Histoire naturelle », Ramsar CC BY 4.0,
  « © les contributeurs d'OpenStreetMap ».
