# Cartes de répartition : combler les trous

Recherche du 2026-10-21. Point de départ : Mathis trouve que certains endroits manquent de données
sur les cartes. Suite de `docs/sources-cartes.md` (comment les cartes actuelles sont faites).
Les scripts de mesure et leurs résultats sont dans `notes-privees/essai-cartes/trous/` (hors dépôt).

## En bref

1. **Les trous ne viennent pas de nos réglages.** Nos seuils ne jettent que 1 à 3 % des cases où
   l'espèce a été vue. Les vides sont des endroits où **personne n'a rien saisi dans eBird**.
2. **Les cartes mensuelles ont 1,7 à 3,4 fois moins de cases que la carte annuelle**, même pour un
   oiseau qui ne bouge pas de l'année. Ça se corrige sans nouvelle donnée (mesuré, section 3).
3. **D'autres bases existent, mais seulement à certains endroits** : Europe du Nord, France, Afrique
   australe, Nigeria, Kenya, Russie. Ailleurs (Chine, Afrique centrale, Amazonie, Moyen-Orient),
   eBird fait déjà 80 à 99 % de ce que contient GBIF : aucune base ouverte ne comblera ces trous-là.
4. **Pour les vrais déserts d'observateurs, la seule voie est une aire de répartition estimée.** La
   meilleure trouvée : les aires d'iNaturalist, en licence libre (CC BY), pour 6 981 espèces
   d'oiseaux. Sur 11 espèces testées, elles contiennent 92 à 99,5 % de nos cases, et multiplieraient
   par 2,5 à 3,6 la surface couverte pour les oiseaux d'Afrique. Avec deux défauts mesurés (section 2c).
5. **Deux décisions reviennent à Mathis** (section 5) : accepter ou non des données « pas d'usage
   commercial », et afficher ou non une aire estimée à côté des observations réelles.

## 1. D'où viennent les trous (mesuré)

Une case de la carte (0,25°, environ 28 km) est vide pour l'une de trois raisons : personne n'y est
passé, quelqu'un y est passé sans noter l'espèce, ou nos seuils ont écarté les observations.
Relecture complète des 45,9 millions de lignes eBird (`diagnostic.mjs`), sur 23 espèces :

| Espèce | Cases où elle a été vue | Écartées par nos seuils | Cases vides voisines : personne n'est passé / passé sans la noter | Carte d'un mois / carte de l'année |
|---|---|---|---|---|
| Bulbul des jardins | 4 800 | 86 (1,8 %) | 9 210 / 2 847 | 35 % |
| Corbeau pie | 5 010 | 163 (3,3 %) | 9 468 / 3 583 | 29 % |
| Tisserin gendarme | 2 969 | 97 (3,3 %) | 6 393 / 3 625 | 30 % |
| Moineau friquet | 20 110 | 311 (1,5 %) | 23 429 / 14 694 | 37 % |
| Mésange charbonnière | 15 204 | 144 (0,9 %) | 9 539 / 5 947 | 58 % |
| Rougegorge familier | 12 908 | 176 (1,4 %) | 6 854 / 6 870 | 55 % |
| Bruant zizi | 3 906 | 36 (0,9 %) | 1 244 / 2 500 | 47 % |

« Cases vides voisines » : cases sans l'espèce à moins de deux cases d'une case affichée.

- **Nos seuils ne sont pas en cause** : les assouplir ne rendrait que 1 à 3 % de cases, surtout des
  oiseaux égarés.
- **Le manque d'observateurs l'est** : autour de l'aire du Bulbul des jardins, il y a trois fois plus
  de cases jamais visitées que de cases visitées sans bulbul.
- **Les cartes mensuelles** n'affichent que 29 à 58 % de la carte annuelle pour des oiseaux
  sédentaires. L'effort d'un seul mois est douze fois plus mince que celui de l'année.

Effort eBird mondial depuis 2015 : 132 954 cases ont au moins une observation, 86 855 en ont 30 ou
plus (le seuil de nos cartes).

## 2. Les données qu'on n'utilise pas encore

### 2a. Déjà sur GBIF : une seule demande de téléchargement de plus

Comptes de l'API GBIF, 21/10/2026, oiseaux depuis 2015 : **1 804 millions d'observations, dont
1 485 millions d'eBird. Il en reste 319 millions ailleurs** : 108 millions en CC BY, 74 millions en
CC0 (domaine public), 136 millions en CC BY-NC (pas d'usage commercial).

Par pays, eBird contre les autres sources : France 5,3 contre 33,0 millions ; Russie 1,1 contre
4,7 ; Afrique du Sud 6,5 contre 18,9 ; Nigeria 0,11 contre 0,67 ; Kenya 2,5 contre 1,4 ;
Chine 3,8 contre 0,4.

**Ce que ça ajouterait, case par case** (`analyse-grilles.mjs`, grilles tirées des cartes GBIF).
Une case compte si elle atteint 30 observations d'oiseaux. Observations humaines seulement : les
balises GPS et les détecteurs, qui ne suivent qu'une espèce, sont écartés.

| Région | Cases avec assez d'eBird | Gagnées avec les sources libres | Gagnées en plus avec le « pas d'usage commercial » | Gain libre | Gain total |
|---|---|---|---|---|---|
| France | 1 604 | 174 | 45 | +11 % | +14 % |
| Europe (hors France) | 12 749 | 2 066 | 1 394 | +16 % | +27 % |
| Afrique subsaharienne | 5 631 | 2 246 | 341 | +40 % | +46 % |
| Russie et Sibérie | 848 | 1 044 | 1 535 | +123 % | +304 % |
| Asie centrale | 997 | 62 | 302 | +6 % | +37 % |
| Chine et Asie de l'Est | 5 054 | 560 | 434 | +11 % | +20 % |
| Australie et Pacifique | 6 485 | 364 | 774 | +6 % | +18 % |
| Amérique du Sud et centrale | 14 502 | 160 | 407 | +1 % | +4 % |
| Afrique du Nord et Sahara | 858 | 36 | 91 | +4 % | +15 % |
| Asie du Sud et du Sud-Est, Moyen-Orient, Amérique du Nord | | | | 0 à 1 % | 1 à 6 % |

Les régions sont des cadres de latitude et de longitude, approximatifs. La part « pas d'usage commercial » est estimée en grosses cases de 1,4° puis répartie : c'est un
ordre de grandeur, pas un compte exact. En France, le gain en cases est faible parce qu'eBird
couvre déjà presque tout le territoire à ce seuil ; le gain y est dans l'épaisseur des données
(six fois plus d'observations), donc des fréquences plus fiables.

**Les jeux qui portent ce gain** (licence lue dans le registre GBIF) :

| Jeu | Zone | Oiseaux depuis 2015 | Licence | Listes complètes ? |
|---|---|---|---|---|
| Southern African Bird Atlas Project 2 (SABAP2) | Afrique australe, 9 pays | 19,0 M | CC BY 4.0 | oui, par case de 9 km, 2 h minimum |
| Nigeria Bird Atlas (deux jeux) | Nigeria | 0,64 M | CC BY 4.0 | oui pour l'un |
| Kenya Bird Map | Kenya | 1,13 M | CC BY-NC 4.0 | oui pour une partie |
| Artportalen | Suède | 49,6 M | CC0 | non |
| Norwegian Species Observation Service | Norvège | 18,3 M | CC BY 4.0 | non |
| DOFbasen | Danemark | 22,2 M | CC BY-NC 4.0 | non |
| Observation.org | monde, surtout Pays-Bas | 54,8 M | CC BY-NC 4.0 | non |
| iNaturalist (validées) | monde, dont 2,7 M en Russie | 34,4 M | CC BY-NC en majorité, licence par observation | non (photos) |
| RU-BIRDS.RU | Russie et voisins | 1,84 M | CC BY-NC 4.0 | non |
| NABU naturgucker | Allemagne | 10,1 M | CC BY 4.0 | non |
| Waarnemingen.be | Flandre, 2015-2018 seulement | 6,0 M | CC0 | non |
| Jeux français de PatriNat : Oiseaux des Jardins, Faune Occitanie, Faune-France « Communes », Sigogne, STOC-EPS | France | environ 29 M (tous jeux PatriNat) | CC BY 4.0 | STOC-EPS seulement |

Pour la France, les jeux PatriNat sur GBIF s'arrêtent presque en 2022 (2,49 M en 2022, 157 000 en
2023, environ 800 en 2024, compté par l'agent de recherche). Plusieurs se recoupent sans doute
(jeux nationaux et régionaux de Faune-France) : il faudra retirer les doublons.

### 2b. Hors de GBIF

| Source | Ce qu'elle apporterait | Conditions (lues à la source) | Verdict |
|---|---|---|---|
| Faune-France en direct (LPO) | la France après 2022, listes complètes comprises | pas de licence : convention écrite, diffusion publique soumise à un vote du comité (guide d'exportation 2020) | **à demander par Mathis**, utile pour la France |
| Oiseaux de France (nouvel atlas LPO) | nicheurs et hivernants, maille 10 km | aucune condition de réutilisation affichée | non vérifié, à demander |
| NBN Atlas (Royaume-Uni, BirdTrack, Garden BirdWatch) | 46 M d'observations 2021-2025, maille 1 km | CC BY-NC 4.0, API publique | le Royaume-Uni est déjà bien couvert par eBird |
| China Bird Report | la Chine | CC BY-NC-SA, et accord écrit obligatoire pour toute copie | accord à demander, réponse incertaine |
| Atlas des nicheurs du Japon 2016-2021 | nicheurs, maille 20 km | CC BY 4.0 | le Japon est déjà bien couvert |
| EBBA2 (atlas européen des nicheurs) | présence des nicheurs, maille 50 km | « Creative Commons » pour la maille 50 km, variante visible seulement avec un compte | grossier, nicheurs seuls |
| ornitho.de, NDFF (Pays-Bas), Avif (Tchéquie) | bases nationales | accord par projet ou licence non nommée | non vérifié |
| WikiAves (Brésil), Kuşbank (Turquie), birds.kz, OSME | | pages de conditions inaccessibles ou absentes | non vérifié |

### 2c. Les aires de répartition estimées

Là où personne n'observe, aucune base n'aidera. Il faut une aire dessinée ou calculée par un modèle.

**iNaturalist Open Range Map : la meilleure piste.**
- Licence **CC BY**, lue sur la page officielle (https://www.inaturalist.org/pages/range_maps, copie
  archivée du 24/04/2026 ; la page en direct est derrière un contrôle anti-robot).
- Mise à jour environ chaque mois. Version 2.34 au 21/10/2026, **6 981 aires d'oiseaux**
  (métadonnées du stockage public, vérifiées). Environ 65 % de nos espèces : estimation de l'agent,
  l'appariement des noms reste à compter.
- Calculées par un modèle (« Geomodel », d'après Cole et al. 2023) à partir des observations
  iNaturalist et de l'altitude, sur des hexagones d'environ 1 770 km².
- Téléchargeables espèce par espèce (un fichier GeoJSON) ou par lots (2 fichiers de 198 Mo pour les
  oiseaux).

Essai sur 12 espèces (`essai-aires-inat.mjs`), comparé à nos cartes annuelles :

| Espèce | Nos cases dans l'aire iNaturalist | Surface couverte si l'on ajoute l'aire jusqu'à 110 km d'une vraie observation |
|---|---|---|
| Bulbul des jardins | 97 % | x 3,1 |
| Corbeau pie | 98 % | x 3,1 |
| Tisserin gendarme | 95 % | x 3,6 |
| Tourterelle maillée | 96 % | x 2,5 |
| Huppe fasciée | 99,5 % | x 2,6 |
| Moineau friquet | 92 % | x 2,1 |
| Pie-grièche écorcheur | 97 % | x 2,1 |
| Grive litorne | 94 % | x 1,7 |
| Mésange charbonnière | 99 % | x 1,8 |
| Bruant jaune | 96 % | x 1,6 |
| Tyran quiquivi | 97 % | x 1,6 |
| Pie bavarde | **0 %** | aire iNaturalist fausse |

« 110 km » veut dire ici 4 cases de 0,25° autour d'une case affichée : 111 km du nord au sud, moins
d'est en ouest loin de l'équateur (environ 55 km à 60° N, pour la Grive litorne).

Deux défauts, vus sur les planches de contrôle :
- **Le modèle extrapole là où personne n'observe.** L'aire du Bulbul des jardins couvre presque tout
  le Sahara. Or au cœur du désert (18-30° N, 5° O - 25° E), GBIF n'a que 14 observations de bulbul,
  toutes années et toutes sources : 13 dans le massif de l'Aïr (Niger), 1 à Adrar (Algérie). Pour
  17 851 observations d'oiseaux en tout dans ce cadre : personne ne peut dire où il vit ailleurs, et
  le modèle remplit ce vide (`verif-bulbul-sahara.mjs`, 2026-10-21). Les descriptions lisibles en
  ligne le disent oiseau des cultures, jardins et palmeraies d'oasis (BRIS, Naturalis) et
  « généralement absent du Sahara et des autres régions arides » (BirdForum, d'après Sibley et
  Monroe) ; l'ouvrage de référence, Birds of the World, est payant et n'a pas été lu. D'où la limite
  à 110 km d'une observation réelle, qui garde 57 % de ce qu'elle ajoute pour le bulbul et coupe le
  centre du désert.
- **Certaines aires sont fausses.** Celle de la Pie bavarde ne contient aucun polygone sur l'Europe
  continentale, mais l'Islande, l'Alaska et Madère. Parade automatique : refuser l'aire d'une espèce
  quand moins de 80 % de nos cases tombent dedans.

Elle déborde aussi sur des cases visitées sans l'espèce (25 052 pour la Huppe) : l'aire est une
enveloppe large, pas une carte de fréquence. Elle doit se lire comme « aire estimée », à part.

**Les autres aires, et pourquoi elles viennent après :**
- **Aires d'habitat de Lumbierres et al. 2022** : 10 651 oiseaux, 100 m, avec nidification et
  hivernage pour 1 816 migrateurs. CC0 affiché sur Dryad, mais Dryad impose le CC0 à tout dépôt, et
  ces cartes dérivent des polygones de BirdLife : droit réel non tranché. 153,6 Go, environ 22 h de
  téléchargement.
- **BirdLife** : la clause 11 de ses conditions interdit une diffusion qui permet de télécharger les
  données, ce que fait tout fichier servi par GitHub Pages ; un dérivé doit être « transformatif »
  (clause 13). https://datazone.birdlife.org/info/dataterms
- **Map of Life** : CC BY-NC, téléchargement massif interdit sans autorisation.
- **Cartes de Wikimedia Commons** : des images, presque toutes redessinées d'après BirdLife.
- **Filtre de BirdNET** : CC BY-NC-SA, la clause « mêmes conditions » s'étendrait à toutes nos cartes.
  À écarter.
- **Poids publiés du modèle SINR** : aucune licence affichée. À écarter.

## 3. Les méthodes qu'on n'a pas testées

**Mois voisins (testé, sans nouvelle donnée).** La carte d'un mois emprunte les observations des
deux mois voisins, avec un poids de moitié, mais seulement dans les cases où l'effort du mois est
faible (sous 300 observations). Résultat sur 23 espèces (`essai-mois-voisins.mjs`) :
- **+10 à +69 % de cases par mois** selon l'espèce, les plus gros gains là où les observateurs sont
  rares : Bulbul +59 %, Corbeau pie +69 %, Mésange charbonnière +29 %,
  Bruant zizi +36 %.
- Contrôle sur les migrateurs, cases affichées en Europe en janvier : Martinet noir 7 avant, 7 après ;
  Pie-grièche écorcheur 2 puis 3 ; Hirondelle rustique 368 puis 466.
- Sans la condition d'effort faible, le Martinet passait de 7 à 49 cases en janvier : la condition
  est indispensable.

**Mailles plus grosses là où l'effort manque (non testé).** Additionner les cases en blocs de 0,5°,
1° ou 2° là où une case seule n'a pas assez d'observations, et prendre la fréquence du bloc. Faisable
avec les données actuelles. Risque : un bloc de 2° avec une seule observation dans un coin.

**Compter des listes plutôt que des observations (non testé).** Vérifié : les fiches eBird sur
GBIF n'ont ni numéro de liste ni protocole, mais elles ont l'observateur et le jour. Une
« pseudo-liste » (observateur + jour + lieu) donnerait un vrai taux de signalement, comme les bar
charts d'eBird. Une petite requête de plus, à faire valider par GBIF d'abord.

**Remplir les cases jamais visitées à partir des voisines visitées (non testé).** Demande un masque
terres et mers, sinon les cartes débordent en mer (déjà constaté). Natural Earth (domaine public)
en fournit un ; à télécharger avec l'accord de Mathis.

**Modèles d'habitat (Maxent, SINR entraîné par nous) : gros chantier.** Une à deux semaines de
travail, temps de calcul inconnu sur ce portable. Climat : CHELSA est en CC0, WorldClim interdit la
redistribution. À garder pour plus tard.

**Écartés** : modèles d'occupation (il faut des visites répétées identifiables), krigeage
(interpole à travers montagnes et bras de mer).

## 4. Les pièges, si on ajoute des sources

- **Un téléchargement GBIF prend la licence la plus restrictive de ses jeux** (annonce GBIF, et un
  téléchargement de 410 jeux noté CC BY-NC dans l'API, constaté par l'agent de recherche) : un seul jeu
  « pas d'usage commercial » rend tout le téléchargement NC. Parade : filtrer la licence dans la
  requête elle-même.
- **Balises GPS et baguage** : ils suivent quelques individus et faussent les fréquences (au Maroc,
  environ 30 % des données d'oiseaux GBIF depuis 2015 sont des goélands balisés). Filtre sur les observations humaines,
  et liste blanche des jeux retenus.
- **Chaque source a ses habitudes** : Oiseaux des Jardins ne voit que des jardins, Observation.org
  et Artportalen surreprésentent les raretés. La fréquence doit se calculer source par source, puis
  se combiner.
- **Doublons** entre jeux nationaux et régionaux de Faune-France.
- **Précision** : écarter les observations dont l'incertitude dépasse 10 km (Faune Occitanie en a
  des dizaines de milliers entre 63 et 70 km).
- **Espèces sensibles** : Artportalen les retire, Faune-France les floute. Elles resteront
  sous-représentées.
- **Birda** : déclaré CC BY-NC sur GBIF alors que ses fiches portent CC BY. À clarifier avant usage.

## 5. Les décisions de Mathis

1. **Accepter des données « pas d'usage commercial » ?** Elles doublent le gain en Russie (+123 % de
   cases sans, +304 % avec) et ajoutent les Pays-Bas, le Danemark, le Kenya et l'Asie centrale.
   Mais les cartes passeraient elles-mêmes sous cette licence. La licence définit le commercial comme
   ce qui vise « principalement » un avantage commercial ou une rémunération : un site personnel
   sans revenu semble en dehors, mais le site sert aussi de portfolio. C'est son nom qui est engagé.
2. **Afficher une aire estimée à côté des observations ?** Par exemple une teinte pâle « aire
   estimée (iNaturalist) » sous les couleurs de fréquence, limitée à 110 km d'une observation
   réelle. La carte gagne beaucoup de surface en Afrique et en Asie, et il faut dire clairement ce
   qui est observé et ce qui est estimé.
3. **Demander l'accès à Faune-France ?** C'est le seul moyen d'avoir la France après 2022. Le
   message partirait de lui.

**Décidé le 2026-10-21** : 1. oui, sources libres et « pas d'usage commercial » ensemble (les cartes
passeront en CC BY-NC) ; 2. une maquette d'abord, sur 3 ou 4 espèces, avec et sans la teinte pâle ;
3. reste ouvert.

**Décidé ensuite, le même jour** (après `docs/sources-donnees-oiseaux.md`) : une seule source, GBIF toutes
bases, en un téléchargement ; puis la teinte iNaturalist en fond, **temporairement** ; puis essayer notre
propre modèle pour des cartes pleines, sur le principe de Status & Trends (« je veux essayer »).

## 6. Recommandation, dans l'ordre

1. **Mois voisins** : aucune nouvelle donnée, aucun risque de licence, +10 à +69 % de cases par
   mois. Le premier à faire.
2. **Une deuxième demande de téléchargement GBIF**, lancée par Mathis comme la première. Contenu :
   les jeux libres de la liste blanche (SABAP2, Nigeria, Artportalen, Norvège, naturgucker,
   waarnemingen.be, PatriNat), observations humaines seulement, licence filtrée, et l'effort en
   pseudo-listes. Plus les jeux NC si la décision 1 est oui.
3. **Les aires iNaturalist en teinte pâle**, si la décision 2 est oui, avec le contrôle automatique
   des aires fausses.
4. **Plus tard, si le besoin reste** : mailles plus grosses, puis un modèle d'habitat.

Avant tout calcul complet, refaire l'essai sur les 23 espèces de ce rapport et comparer à l'œil avec
les cartes actuelles.

## Fichiers de mesure (`notes-privees/essai-cartes/trous/`)

- `diagnostic.mjs` : relit le zip eBird, classe les cases vides, image de l'effort mondial
  (`effort.png`).
- `gbif-pays.mjs`, `facettes-regions.mjs` : comptes par pays et par jeu (API GBIF).
- `gbif-grille.mjs`, `grille-nc.mjs`, `analyse-grilles.mjs` : grilles mondiales par source, gain par
  région, image `sources-30.png`.
- `essai-mois-voisins.mjs` : l'essai des mois voisins.
- `essai-aires-inat.mjs` : la comparaison avec les aires iNaturalist, planches `inat-*.png`.
