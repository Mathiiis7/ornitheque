# Notre propre modèle de répartition : le plan

Décidé par Mathis le 2026-10-21 : après le téléchargement GBIF « toutes bases » et la teinte iNaturalist
temporaire, **essayer** des cartes pleines, sur le principe de Status & Trends, mais publiables.
Premier essai le 2026-10-22, sur 4 espèces : voir « Essai du 2026-10-22 » en fin de document.

**ARRÊTÉ le 2026-10-23 par Mathis : on garde la teinte iNaturalist.** Le modèle ne la bat pas sur les espèces
ordinaires, et n'apporte presque rien là où elle manque. Pourquoi : dernière section, « Le modèle contre l'aire
iNaturalist ».

## Le principe, sans jargon

Une carte d'observations reste vide là où personne n'observe. Un modèle apprend, sur les cases où il y a
des observateurs, dans quels milieux l'oiseau est présent ou absent : climat, végétation, relief. Il devine
ensuite les cases où personne ne va, d'après leur milieu. C'est ce que fait Status & Trends avec eBird,
et c'est pour ça que ses cartes n'ont pas de trous.

Deux garde-fous, tirés de ce qu'on a déjà vu :
- **ne pas prédire n'importe où** : l'aire iNaturalist remplit le Sahara pour le bulbul parce que le modèle
  extrapole loin des observations. On limitera la prédiction à une zone plausible (par exemple l'aire
  iNaturalist élargie, ou les régions où l'espèce a déjà été vue), et on montrera ce qui est estimé ;
- **apprendre les absences sur des listes complètes** : une case visitée sans l'espèce ne dit quelque chose
  que si l'observateur notait tout. eBird, SABAP2, le Nigeria et le Kenya donnent ces listes ; les
  observations isolées (photos) ne servent qu'à la présence.

## Les données

| Quoi | Source | Licence (lue à la source le 2026-10-21) | Taille |
|---|---|---|---|
| Observations | GBIF toutes bases, DOI 10.15468/dl.vnrtqk | CC BY-NC 4.0 (ensemble) | 2,5 Go, déjà demandé |
| Climat | CHELSA V2.1, moyennes 1981-2010, 19 variables « bio » | CC0 1.0 (page du jeu sur chelsa-climate.org) | 115 Mo (bio1) à 655 Mo (bio12) par variable, mesuré ; on n'en prendrait que 6 à 8 |
| Végétation | MODIS MCD12C1 v6.1, occupation du sol, 0,05° | sans restriction (NASA, à relire sur la page LP DAAC avant de télécharger) | à relever |
| Relief | ETOPO 2022, NOAA, 60 secondes d'arc | **pas trouvée** : à vérifier avant de s'en servir | à relever |
| Écarté | WorldClim | redistribution interdite | - |

Chaque téléchargement demandera l'accord de Mathis, avec le nom du fichier et sa taille.

## Les étapes

1. **Essai sur les 23 espèces** du rapport `docs/cartes-combler-les-trous.md` (bulbul, corbeau pie,
   tisserin, mésange, huppe, migrateurs...) : un modèle par espèce, à l'année d'abord, puis par mois pour les
   migrateurs. Comparaison à l'œil avec nos observations et l'aire iNaturalist, sur une maquette comme celles
   de `notes-privees/maquettes/`.
2. **Mesurer le temps de calcul** sur ce portable pendant l'essai, et seulement ensuite estimer le tout
   (10 896 cartes). Aujourd'hui : inconnu.
3. **Choisir l'affichage avec Mathis** : la prédiction en couleurs comme une vraie fréquence, ou en teinte
   à part « estimé par un modèle ». La teinte iNaturalist disparaît alors.
4. **Tout générer**, publier dans `ornitheque-data` d'abord, puis ce dépôt.

## Les risques connus

- Les oiseaux rares, avec très peu de cases de présence : le modèle n'apprend rien de solide. Garder alors la
  carte d'observations seule.
- Les oiseaux marins : climat et végétation terrestres ne disent rien de la mer. À traiter à part.
- Les saisons : une carte par mois demande assez d'observations chaque mois ; sinon, l'année seule.
- La durée : estimée à une ou deux semaines de travail en tout.

## Essai du 2026-10-22 : 4 espèces, carte de l'année

Choix de Mathis avant l'essai : montrer les deux affichages côte à côte (teinte à part « estimé », et mêmes
couleurs que les observations) ; accord pour les téléchargements ci-dessous. Maquette :
`notes-privees/maquettes/modele/` (http://localhost:8765/notes-privees/maquettes/modele/). Scripts et mesures :
`notes-privees/essai-cartes/modele/` (hors dépôt).

### Les couches (téléchargées, puis ramenées à nos cases de 0,25°)

| Couche | Source, licence | Téléchargé | Ce qu'on en garde |
|---|---|---|---|
| Climat, 6 variables : température moyenne, max de l'été, min de l'hiver, pluie annuelle, saisonnalité des pluies, durée de la saison de végétation | CHELSA V2.1, 1981-2010, CC0 | 1,3 Go, empreintes MD5 vérifiées | moyenne des 30 x 30 pixels de chaque case, 4 Mo par variable ; fichiers bruts effacés |
| Paysage, 11 classes (arbres, arbustes, prairies, cultures, bâti, sol nu, neige, eau, zones humides, mangroves, lichens) | ESA WorldCover 2021 v200, CC BY 4.0 | 199 Mo : seul l'aperçu réduit (562 x 562, ~590 m) des 2 651 tuiles COG, au lieu de 124 Go | part de chaque classe par case, 46 Mo |

Pièges rencontrés : le serveur de CHELSA bride chaque connexion à 0,25 Mo/s (d'où des morceaux de 8 Mo, 8 à la
fois) ; CHELSA couvre aussi la mer, sans valeur vide (la terre vient donc de WorldCover) ; sa pluie plafonne à
6 553,5 mm (codage sur 16 bits), seulement dans les régions les plus arrosées (58 cases de terre) ; l'empreinte
d'un gros fichier est celle d'un dépôt en morceaux de 5 Mio ; un `sh` arrêté par l'outil de tâches survivait et
téléchargeait en parallèle (fichiers verrouillés, EBUSY). Préparation commune, mesurée : 168 s (WorldCover) +
216 s (climat).

### La méthode

Forêt aléatoire (paquet R `ranger`, installé dans `notes-privees/essai-cartes/modele/r-lib`), une par espèce,
sur les 17 couches. GBIF ne publie que des comptes par case et par mois, pas les listes une à une : on travaille
case par case. Présence : au moins 2 observations dans les listes complètes de l'année (eBird et les atlas que
garde `cartes-gbif.mjs`). Absence : aucune, avec au moins 300 observations d'oiseaux dans ces listes. Le reste
n'apprend rien ; les observations isolées n'entrent pas (noms mélangés, poules domestiques). Apprentissage et
prédiction limités à 1 000 km d'une présence ; la maquette montre 250, 500 et 1 000 km. Une case n'est
« estimée » que si elle est vide sur notre carte et n'est pas une absence sûre. Seuil présence / absence :
celui qui maximise sensibilité + spécificité. Contrôle : validation croisée par blocs de 5° x 5° (5 groupes),
chaque case jugée par un modèle qui n'a rien vu de son bloc. Couleurs de la version « mêmes couleurs » : une
seconde forêt apprend le rang (1 à 32) de la vraie carte et le devine pour les cases estimées.
La distance à la présence la plus proche est calculée en JavaScript (1,4 s pour la Pie) : `terra::distance`
donnait la même chose (0,05 % d'écart) en 69 s, intenable pour 11 000 espèces.

### Résultats (cases de 0,25°, limite de 250 km sauf mention)

| | Pie bavarde | Merle noir | Bulbul des jardins | Coq bankiva |
|---|---|---|---|---|
| Cases colorées aujourd'hui | 21 246 | 19 645 | 6 215 | 4 893 |
| Présences / absences apprises | 12 931 / 5 448 | 13 730 / 2 649 | 4 058 / 4 285 | 2 885 / 42 682 |
| Note de la validation (AUC) | 0,966 | 0,959 | 0,957 | 0,904 |
| Cases des listes retrouvées sans les avoir vues : modèle / aire iNaturalist | 93,7 % / 0 % (aire cassée) | 88,3 % / 97,3 % | 88,4 % / 97,4 % | 81,5 % / 100 % |
| Absences sûres que la méthode remplit : modèle / iNaturalist | 13,4 % / 2,6 % | 9,9 % / 27,1 % | 9,7 % / 6,7 % | 17,0 % / 99,9 % |
| Cases ajoutées : modèle à 250 / 500 / 1 000 km | 22 401 / 31 335 / 38 958 | 3 729 / 3 810 / 3 819 | 15 961 / 19 617 / 20 785 | 6 964 / 9 962 / 12 927 |
| Cases ajoutées par la teinte iNaturalist du site | aucune (refusée) | 27 527 | 23 218 | aucune (refusée) |
| Temps du modèle (sans la préparation) | 13,8 s | 7,1 s | 6,5 s | 59,2 s |

L'aire iNaturalist n'est pas jugée hors bloc : elle a été calculée avec des observations des mêmes endroits, la
comparaison l'avantage.

Contrôles tirés des défauts connus :
- **Bulbul, cœur du Sahara** (18-30° N, 5° O-25° E) : le modèle y ajoute 44 cases à 250 km, 395 à 500 km, 819 à
  1 000 km ; la teinte iNaturalist 162. D'où la limite de 250 km par défaut dans la maquette.
- **Merle, Scandinavie et Finlande** : cases des listes retrouvées 82,8 % (modèle) contre 90,4 % (aire).
- **Pie, Europe continentale** : 93,8 % retrouvées ; l'aire iNaturalist du fichier n'en contient aucune.
- **Pie, Sibérie au-dessus de 60° N** (60-180° E) : 8 cases de listes la notent, aucune absence sûre ; le modèle
  l'y met dans 2 060 cases à 250 km, dont 655 entre 65 et 70° N. Extrapolation sans contrôle possible. En
  Fennoscandie (5-32° E), les listes la notent bien dans 371 cases entre 65 et 70° N (`verif-nord.mjs`) : le
  modèle reporte sans doute ce climat sur la Sibérie.
- **Coq, hors Asie du Sud et du Sud-Est** : les listes eBird le notent dans 1 398 cases (poules domestiques ; le
  nom brut ne les distingue pas chez eBird). Le modèle ajoute 2 407 cases hors d'Asie à 250 km, surtout en Amérique
  du Sud ; l'aire iNaturalist couvre 444 600 cases hors d'Asie.

### Temps de calcul pour tout générer

30 espèces tirées au hasard (graine fixe, `echantillon.mjs`) : le modèle prend 0,5 s par espèce en médiane, 1,9 s
en moyenne, 27 s au plus (Barge hudsonienne) ; la préparation de l'espèce (effort, carte actuelle, aire
iNaturalist, distances) 0,3 s en médiane, 0,5 s en moyenne, 2,7 s au plus. 8 sur 30 ont moins de 20 présences ou
20 absences : pas de modèle, carte d'observations seule. Sur les 22 autres, 18 ont une note d'au moins 0,8 ;
4 restent faibles (0,32 à 0,74), des oiseaux d'îles avec peu de cases. Extrapolé aux 10 662 cartes tirées des
listes : environ 7 h, une nuit avec les espèces très répandues (jusqu'à une minute chacune), plus la relecture
du téléchargement GBIF. **Stockage** : la grille de travail d'une espèce pèse 19 Mo (huit tableaux mondiaux) ;
10 662 espèces feraient environ 200 Go, plus que les 128 Go libres. Un générateur complet devra travailler espèce
par espèce sans garder ces grilles (l'essai les a effacées : il reste 220 Mo, dont 70 Mo de couches).

### Ce qui resterait à faire si Mathis continue

1. **Pas de prédiction là où les données manquent autour** : contre la Pie en Sibérie du Nord. À mesurer sur les
   4 espèces. Les cartes de Cornell laissent aussi des cases sans estimation (« cells that are NA represent areas
   where we didn't produce model estimates », vignette « status » du paquet ebirdst) ; leur règle exacte n'a pas été
   lue (FAQ de science.ebird.org inaccessible le 2026-10-22).
2. **Écarter d'office un modèle faible** (note sous un seuil à fixer) : l'espèce garde ses observations seules.
3. **Les oiseaux domestiques** (Coq, Pigeon biset, Oie cendrée...) : une règle à part, à décider avec Mathis.
4. **Les mois**, pour les migrateurs : un modèle par mois, ou l'année seule.
5. **Un générateur sans fichiers intermédiaires par espèce** (voir « Stockage » plus haut).
6. Puis l'affichage (teinte à part ou mêmes couleurs), choisi par Mathis sur la maquette, et la génération
   complète.

**Décidé par Mathis le 2026-10-22, après la maquette** : continuer, comme une expérience. « Je veux que tu sois
critique et que tu trouves des solutions », en se renseignant sur la façon dont ce genre de modèle est construit
pour adapter notre méthode. Affichage préféré, confirmé une seconde fois : la teinte à part.

## Revue critique d'après la méthode de Cornell (2026-10-22, suite)

Sources lues à la source : Fink et al. 2020, « Modeling avian full annual cycle distribution and population
trends with citizen science data », Ecological Applications 30(3), DOI 10.1002/eap.2056 (préprint bioRxiv 251868 v2,
CC BY-NC) ; le guide « Best Practices for Using eBird Data » v2.0 (ebird.github.io/ebird-best-practices), chapitres
« Environmental Variables » et « Encounter Rate ». Le site science.ebird.org n'était pas lisible d'ici.

### Ce que fait Cornell, et ce que ça dit de notre premier essai

| Cornell (Status & Trends) | Notre premier essai | Ce qu'on en tire |
|---|---|---|
| Effort de chaque liste dans le modèle (durée, distance, observateurs, type de liste, indice d'expérience de l'observateur) ; carte prédite pour une liste standard | Effort ignoré ; une case peu visitée comptait si l'oiseau y était noté, jamais s'il ne l'était pas | **Biais** : dans les endroits peu visités, le modèle n'apprenait que des présences. Corrigé : log de l'effort de la case comme variable, cases de 30 observations ou plus des deux côtés, carte à 300 observations |
| Des centaines de modèles locaux (AdaSTEM : 100 découpages décalés et tournés, carrés plus petits là où les données sont denses) ; un modèle seulement avec 50 listes et 10 détections ; « Ensemble average estimates were not made in areas of low data density » | Un modèle mondial, limité par la distance | Essayé : 8 découpages, carrés de 40° puis 20° |
| Pas de climat : paysage MODIS (19 classes, part, plus grande tache, densité de taches et de lisières) dans 2,8 km, altitude, orientation | Climat CHELSA + part des 11 classes WorldCover dans la case de 28 km | Le climat permet au modèle mondial de recopier la Laponie sur la Sibérie. Gardé (nos cases sont 10 fois plus grandes, et on n'a pas l'altitude) |
| Seuil au Kappa (article) ; le guide recommande la courbe MCC-F1 | Seuil qui maximise sensibilité + spécificité | Seuil au coefficient de Matthews (MCC) |
| Sous-échantillonnage spatial, présences et absences à part ; forêt « équilibrée » | Une ligne par case (équivalent), poids équilibrés | Inchangé |

### Ce que donnent les corrections (mêmes cases pour toutes, mesures hors bloc)

**Correction du 2026-10-22** : les notes des versions « effort », « locaux », « accord » de ce tableau sont jugées sur
des prédictions qui connaissaient l'effort réel de chaque case, alors que la carte est tirée à 300 observations. Elles
sont trop flatteuses, et leurs cases ajoutées trop peu nombreuses. Voir « Pourquoi la version corrigée ne comblait plus
les vides », en fin de document. Les 4 espèces de ce tableau, très répandues, en souffrent peu (la carte montrée y
retrouve 92 % des cases notées).

Mesure : cases bien visitées (300 observations ou plus) où l'oiseau est noté au moins 2 fois ou jamais, à 1 000 km
au plus d'une présence. Une case qu'une version ne prédit pas compte comme non teintée (une première comparaison
les écartait, ce qui favorisait les modèles locaux : 58 % des cases du Coq ne comptaient plus). Note = coefficient
de Matthews (0 = hasard, 1 = parfait). Cases ajoutées à 250 km d'une présence.

Chaque version choisit son seuil autrement (le premier essai sur sensibilité + spécificité, les autres au MCC) : la
note est donc donnée **au meilleur seuil de chaque version** sur ces mêmes cases, pour ne pas flatter les nouvelles
(à son propre seuil, le premier essai avait 0,81 / 0,72 / 0,78 / 0,37). L'AUC, qui ne dépend d'aucun seuil, est
donnée aussi ; elle bouge peu, parce que les absences lointaines et faciles la dominent.

| | Premier essai | + effort | + locaux 40° | + locaux 20° | **Accord effort + locaux 20°** | Aire iNaturalist |
|---|---|---|---|---|---|---|
| Note Pie (AUC) | 0,82 (0,969) | 0,84 (0,972) | 0,89 (0,986) | 0,90 (0,987) | **0,87** | cassée |
| Note Merle (AUC) | 0,75 (0,962) | 0,77 (0,968) | 0,84 (0,984) | 0,86 (0,982) | **0,82** | 0,76 |
| Note Bulbul (AUC) | 0,78 (0,954) | 0,80 (0,960) | 0,84 (0,977) | 0,86 (0,975) | **0,84** | 0,89 |
| Note Coq (AUC) | 0,43 (0,901) | 0,46 (0,919) | 0,58 (0,912) | 0,61 (0,894) | **0,56** | 0,01 |
| Pie, Sibérie au-dessus de 60° N (60-180° E) : cases ajoutées | 2 060 | 111 | 1 675 | 1 054 | **64** | - |
| Bulbul, cœur du Sahara : cases ajoutées | 44 | 13 | 0 | 43 | **1** | 162 |
| Coq, hors Asie du Sud et du Sud-Est : cases ajoutées | 2 407 | 206 | 33 | 19 | **17** | - |
| Coq, Asie du Sud et du Sud-Est : cases des listes retrouvées (sur 1 617) / cases ajoutées | 94 % / 4 557 | 70 % / 1 354 | 77 % / 1 470 | 74 % / 827 | **63 % / 675** | 100 % / - |
| Cases ajoutées : Pie / Merle / Bulbul / Coq | 22 401 / 3 729 / 15 961 / 6 964 | 11 352 / 3 046 / 14 495 / 1 560 | 21 814 / 3 900 / 13 747 / 1 503 | 19 615 / 5 587 / 13 145 / 846 | **11 050 / 2 833 / 12 497 / 692** | 0 / 27 527 / 23 218 / 0 (teinte du site) |

- **L'effort** est la correction qui retire le plus d'extrapolations : la Sibérie du Nord tombe de 2 060 à 111
  cases, le Coq hors d'Asie de 2 407 à 206, sans règle à part pour les poules. Hypothèse, non vérifiée : là où l'on
  note rarement les poules, elles ne pèsent plus.
- **Mais le Coq n'est pas réglé** : le même effet rétrécit son aire sauvage. En Asie du Sud et du Sud-Est, l'accord
  ne retrouve plus que 63 % des cases des listes, contre 94 % au premier essai. Sans doute parce qu'il est discret,
  rarement noté même là où il vit (le guide de Cornell le dit des espèces difficiles à détecter : leur taux de
  rencontre peut être bien plus bas que leur présence réelle). À vérifier sur d'autres oiseaux discrets.
- **Les modèles locaux** donnent la meilleure note, mais devinent de nouveau loin des données : un carré qui a assez
  de données d'un côté prédit sur toute sa surface, côté vide compris. Cornell a la même règle (50 listes et 10
  détections par carré) ; l'article ne dit pas s'il ajoute un autre garde-fou.
- **L'accord des deux** (notre règle : une case n'est teintée que si les deux modèles la donnent) garde l'essentiel
  de la note et retire ces extrapolations. Retirées ne veut pas dire fausses : personne n'observe au nord de la
  Sibérie. C'est la version la plus prudente : elle écarte 92 à 99 % des cases où l'oiseau n'est jamais noté.
  Retenue pour la maquette, **choisie sur ces 4 espèces et sur des contrôles choisis ici** : à vérifier sur
  l'échantillon de 30 espèces, où les modèles locaux laissent parfois une grande part des cases sans prédiction
  (71 % pour la Rémiz couronnée).
- La note de l'aire iNaturalist n'est pas hors bloc (elle a vu ces cases) : sur le Bulbul, elle reste au-dessus.

### Ce que coûte la version corrigée

Mêmes 30 espèces tirées au hasard que pour le premier essai, les deux modèles de l'accord : 3,2 s par espèce en
médiane, 10,7 s en moyenne, 213 s au plus (Barge hudsonienne, migratrice des deux Amériques), plus 0,5 s de
préparation ; 8 sur 30 sans modèle. Les 4 espèces de la maquette : Bulbul 33 s, Merle 89 s, Pie 173 s, Coq 536 s.
Extrapolé aux 10 662 cartes tirées des listes : **environ 33 h** (7 h pour le premier essai), chiffre fragile : une
seule espèce fait 2/3 du total de l'échantillon. La validation par blocs prend environ les trois quarts du temps des
modèles locaux (Pie : 117 s sur 151) ; elle ne sert, en production, qu'à fixer le seuil : la faire sur moins de blocs
ou moins de découpages diviserait le temps (non mesuré).

Scripts : `modele2.R` (variantes `effort` et `local`, `TAILLE0=20 MAX_CASES=1500` pour les carrés de 20°),
`maquette2.mjs` (comparaison et images, version `accord`), `temps2.mjs`.

## Vérification sur d'autres oiseaux (2026-10-22, soir)

**Correction du 2026-10-22** : même défaut que plus haut. La règle « jamais moins de 85 % des cases notées » était
vérifiée sur des prédictions à l'effort réel ; sur la carte réellement montrée (modèle mondial, tirée à 300
observations), elle n'en retrouvait que 57 % en médiane sur le second tirage. Voir la dernière section.

Demandée par Mathis après la revue critique. Trois jeux : les 30 espèces tirées au hasard (`echantillon/`), 4 oiseaux de
contrôle choisis pour mettre le modèle en difficulté (`controles/` : Fou de Bassan, marin ; Martinet noir, migrateur ;
Pigeon biset, domestique et sauvage ; Engoulevent d'Europe, discret et nocturne), puis 30 autres espèces jamais vues
pendant le réglage (`echantillon2/`, graine 20261023, aucune en commun avec le premier tirage). Scripts : `verifier.sh`,
`verifier2.sh`, `bilan-versions.mjs`.

### L'accord strict ne comblait plus rien chez les espèces ordinaires

Sur les 30 espèces au hasard (22 avec un modèle ; les 8 autres ont moins de 20 présences ou 20 absences), médianes :

| | Premier essai | + effort | + locaux 20° | Accord strict | Souple | Souple, seuil à 85 % | **Règle retenue** |
|---|---|---|---|---|---|---|---|
| Note (MCC au meilleur seuil) | 0,42 | 0,47 | 0,53 | 0,51 | 0,47 | 0,44 | **0,45** |
| Cases notées retrouvées | 87 % | 70 % | 70 % | 60 % | 67 % | 82 % | **84 %** |
| Cases ajoutées à 250 km | 759 | 160 | 107 | 85 | 86 | 643 | **643** |

- La note monte un peu, mais dès la correction de l'effort, le modèle ajoute 5 fois moins de cases : la teinte
  disparaîtrait pour la plupart des espèces. Exemple : *Prodotiscus insignis*, 2 062 cases au premier essai, 2 avec
  l'accord strict.
- Deux causes, la seconde mesurée : (1) hypothèse, dans les forêts que personne ne visite, « peu d'effort » et « ce
  milieu » vont toujours ensemble : le modèle impute en partie l'absence d'observations au milieu ; (2) le seuil au
  meilleur MCC punit fort les fausses présences quand l'oiseau est rare. Les modèles locaux, eux, se taisent sur 30 à
  70 % des cases bien visitées de ces espèces.
- **Souple** : l'accord là où les modèles locaux se prononcent, le modèle mondial seul ailleurs. Ne suffit pas (86).
- **Seuil à 85 %** (chaque modèle retrouve 85 % des cases notées bien visitées) : remet 643 cases, mais serre trop les
  espèces répandues (Merle : 147 cases ajoutées contre 2 833).
- **Règle retenue (« garanti85 »)** : souple, avec pour chaque modèle le plus bas des deux seuils (meilleur MCC, ou
  85 % retrouvées) : jamais moins de 85 % des cases notées. Sur les 4 espèces de la maquette, elle redonne la version
  souple : Pie 0,85, Merle 0,81, Bulbul 0,84 ; Sibérie du Nord 108 cases, Sahara 1. Coq : 0,48, 88 % de son aire
  sauvage retrouvée (63 % avec l'accord strict), 468 cases hors d'Asie (2 407 au premier essai, 17 avec l'accord
  strict).

### Les 4 oiseaux de contrôle (règle retenue contre premier essai)

| | Note | Cases notées retrouvées | Cases ajoutées à 250 km |
|---|---|---|---|
| Fou de Bassan | 0,69 -> 0,73 | 95 % -> 81 % | 1 532 -> 140 |
| Martinet noir | 0,77 -> 0,81 | 89 % -> 87 % | 35 835 -> 13 056 |
| Pigeon biset | 0,61 -> 0,69 | 80 % -> 88 % | 31 002 -> 12 688 |
| Engoulevent d'Europe | 0,40 -> 0,53 | 78 % -> 81 % | 15 598 -> 1 990 |

La note monte pour les quatre, avec un remplissage bien plus prudent. Le Fou de Bassan perd des cases notées retrouvées :
nos couches ne décrivent que la terre, un oiseau marin n'a que les cases côtières pour apprendre.

### Bug corrigé en route

Pour une espèce du second tirage, toutes les présences tombaient dans le même groupe de validation : le modèle d'un pli
n'en voyait aucune, ranger retirait le niveau « oui » et le calcul s'arrêtait. `predireOui()` (modele.R, modele2.R)
rend alors 0 : sans présence apprise, le modèle ne peut rien trouver.

### Le second tirage : la règle ne tient qu'à moitié

30 espèces jamais vues pendant le réglage (25 avec un modèle). Médianes :

| | Premier essai | + effort | Accord strict | **Règle retenue** |
|---|---|---|---|---|
| Note (MCC au meilleur seuil) | 0,47 | 0,54 | 0,56 | **0,51** |
| Cases notées retrouvées | 86 % | 67 % | 59 % | **81 %** |
| Cases ajoutées à 250 km | 1 333 | 137 | 133 | **257** |

- La règle retenue fait mieux que le premier essai pour 13 espèces, moins bien pour 6 (Traquet à tête grise 0,60 ->
  0,35, Paruline à ventre doré 0,26 -> 0,10, Alapi à sourcils jaunes 0,34 -> 0,24, Ortalide de Wagler 0,41 -> 0,31,
  Thinocore de d'Orbigny, Synallaxe pâle), autant pour 6 (écart de 0,02 ou moins).
- Surtout, elle ajoute **5 fois moins de cases** que le premier essai, et aucune pour plusieurs espèces (Synallaxe pâle,
  Inca céleste, Sporophile noir et blanc). Sur le premier tirage, elle en ajoutait presque autant (643 contre 759) : la
  règle avait été réglée sur ces espèces-là.
- **Bilan honnête** : le gain clair est sur les espèces très répandues (les extrapolations de la Pie en Sibérie et du
  Bulbul au Sahara disparaissent, la note monte). Pour les espèces ordinaires, le modèle corrigé de l'effort ne comble
  pas vraiment les vides : c'est le problème à traiter avant toute génération complète. Piste : la confusion entre
  « peu d'effort » et « milieu peu visité » (hypothèse 1 plus haut), à vérifier en regardant, espèce par espèce, ce que
  le modèle prédit dans les cases jamais visitées.

### Pistes suivantes, par ordre d'intérêt

1. **Comprendre pourquoi le modèle corrigé ne comble plus les vides des espèces ordinaires** (second tirage), avant
   tout le reste.
2. **Les oiseaux marins** : une couche « distance à la côte » ou la mer elle-même, sinon garder la teinte iNaturalist
   ou rien pour eux.
3. **Fixer le seuil sans tout revalider** (temps divisé, à mesurer), puis remesurer le temps.
4. **L'altitude** (Cornell s'en sert) : un téléchargement de plus, à demander à Mathis.
5. **Les mois** pour les migrateurs : l'effort compte encore plus mois par mois.

## Pourquoi la version corrigée ne comblait plus les vides (2026-10-22)

Second tirage, 25 espèces avec un modèle. Trois modèles mondiaux côte à côte, mêmes couches et mêmes forêts
(`diag-effort.R`, `diag-effort.mjs`) : v0 (premier essai) ; A (les étiquettes de la version effort, où les cases de 30 à
300 observations sans l'oiseau deviennent des absences apprises, mais sans la variable effort) ; B (la version effort).
Cases ajoutées à 250 km, au même seuil garanti85 pour les trois :

| | v0 | A | B |
|---|---|---|---|
| Cases ajoutées, médiane (total) | 1 412 (70 431) | 1 052 (56 567) | 798 (36 915) |
| dont cases jamais visitées, total | 44 706 | 37 846 | 27 253 |

- **La mémoire du modèle final** (une absence apprise qui se reconnaîtrait elle-même au moment de tirer la carte) : presque
  rien. En prenant pour chaque case apprise la prédiction d'un modèle qui n'a pas vu son bloc, B passe de 12 702 à
  12 862 cases (+1 %).
- **Les nouvelles étiquettes** (v0 -> A) : -20 %.
- **La variable effort** (A -> B) : -35 %, et presque toute la chute des espèces vidées : Synallaxe pâle 153 -> 0, Inca
  céleste 157 -> 0, Sporophile noir et blanc 485 -> 2, Grive dama 2 035 -> 254.
- Contrôle abandonné : la part des cases ajoutées où une observation isolée (iNaturalist...) note l'oiseau. Ces cases
  sont déjà sur nos cartes : 0,2 à 0,4 % des cases ajoutées, quelle que soit la version. Ça ne départage rien.

### La cause : le seuil et la carte ne parlaient pas du même effort

`modele2.R` réglait le seuil sur des prédictions hors bloc faites à l'effort RÉEL de chaque case bien visitée : 1 500 à
2 000 observations d'oiseaux en médiane, et 14 000 à 22 000 dans les cases où un oiseau discret est noté (Sporophile,
Inca, Synallaxe, Petit-duc à mèches noires, Cotinga vert et noir). Il tirait ensuite la carte à 300 observations. Pour
ces oiseaux, « noté 2 fois sur 300 observations » est rare même là où ils vivent : la carte restait bien plus sévère que
le seuil ne le croyait. Mesuré hors bloc sur la carte réellement montrée par le modèle mondial (`diag-std.R`,
`diag-std.mjs`) : **57 % des cases notées retrouvées, pas 85 %** (médiane du second tirage ; 54 % sur les 4 oiseaux de
contrôle ; 92 % sur les 4 espèces très répandues de la maquette, qui en souffraient peu).

Espèce par espèce (`diag-causes.mjs`), la perte vient du réglage du seuil pour 17 espèces sur 25, des nouvelles
étiquettes pour 3 (Thinocore de d'Orbigny, Méliphage bruyant, Ortalide de Wagler) ; 3 ne perdent presque rien et 2 n'ont
pas de modèle utile (note nulle : Ligéa aux yeux rouges, Paruline à ventre doré).

Le même modèle, avec un seuil réglé sur des prédictions au même effort que la carte, toutes les versions retrouvant
85 % des cases notées :

| Carte tirée à (observations) | 300 | 1 000 | 3 000 | 10 000 | v0, sans effort |
|---|---|---|---|---|---|
| Cases ajoutées, médiane | 1 287 | 1 314 | 1 437 | 1 475 | 1 412 |
| Cases jamais visitées ajoutées, total | 44 732 | 45 722 | 47 586 | 47 055 | 44 706 |
| Absences sûres teintées à tort, médiane | 30 % | 27 % | 28 % | 24 % | 27 % |
| Note (MCC), médiane | 0,37 | 0,42 | 0,42 | 0,41 | 0,43 |

- **L'hypothèse de la veille ne tient pas** (« peu d'effort » confondu avec « ce milieu », qui laisserait vides les
  milieux jamais visités) : réglé correctement, le modèle effort remplit autant de cases jamais visitées que le premier
  essai (45 722 contre 44 706).
- **Le revers** : à sensibilité réelle égale, le modèle mondial avec l'effort ne fait pas mieux que le premier essai
  pour les espèces ordinaires (note 0,42 contre 0,43 ; 27 % d'absences sûres teintées pour les deux). La note qui
  « montait » dans les tableaux plus haut venait en partie de ce que le modèle connaissait l'effort réel de chaque case,
  ce que la carte ne sait pas d'une case jamais visitée.
- **Ce qui reste à l'effort, modèle mondial seul, carte à 1 000** : Pie au nord de la Sibérie 68 cases (premier essai
  2 060), Bulbul au cœur du Sahara 5 (44). Mais Coq hors d'Asie 3 285 (2 407) : les modèles locaux de la règle
  garanti85 devront le contenir.
- **Choix** : carte à 1 000 observations (`EFFORT_STD=1000`), seuil réglé sur des prédictions hors bloc au même effort
  (`ETALON=carte` dans `modele2.R`). Retenu pour sa note médiane (0,42, à égalité avec 3 000) et parce qu'il ajoute un
  peu moins de cases. Pas sur le contrôle de la Pie en Sibérie, qui saute d'un effort à l'autre (778, 68, 261, 445
  cases à 300, 1 000, 3 000, 10 000).

### La vérification qui tranche, critères fixés avant de regarder

`verifier-L.sh` refait la règle garanti85 (modèle mondial et modèles locaux de 20°) avec ce réglage, et la compare au
premier essai au même seuil (`v0g85`, ajouté à `maquette2.mjs`). Jeux : un troisième tirage de 30 espèces jamais vues
(`echantillon3/`, graine 20261024, aucune des 60 précédentes), les 4 espèces de la maquette, les 4 oiseaux de contrôle,
le second tirage.
- La version corrigée **gagne sur les espèces ordinaires** si, en médiane sur le troisième tirage : note au moins 0,03
  au-dessus du premier essai, pas plus d'absences sûres teintées, et au moins la moitié de ses cases ajoutées.
- Les extrapolations doivent rester **bien en dessous du premier essai** : Pie au nord de la Sibérie (2 060), Bulbul au
  Sahara (44), Coq hors d'Asie (2 407).
- Sinon, le dire franchement : le seul gain de l'effort serait de contenir les extrapolations des espèces répandues,
  pour environ 5 fois le temps de calcul (33 h contre 7 h). Ce serait un choix pour Mathis.

### Résultat (nuit du 2026-10-22 au 23)

Troisième tirage, 24 espèces avec un modèle, médianes (`bilan-L.mjs echantillon3-L1000.json`) :

| | Premier essai, même seuil | Corrigée (carte à 1 000) |
|---|---|---|
| Note (MCC) | 0,38 | 0,40 |
| Cases notées retrouvées | 85 % | 82 % |
| Absences sûres teintées à tort | 24 % | 19 % |
| Cases ajoutées à 250 km | 486 | 353 |

Critère de la note **pas atteint** (+0,02 pour +0,03 demandé) ; les deux autres, oui. Sur les espèces ordinaires, la
version corrigée est un peu plus prudente, pas meilleure.

Les 4 espèces de la maquette, très répandues (`bilan-L.mjs maquette-L1000.json donnees.json`) :

| | Premier essai, même seuil | Corrigée |
|---|---|---|
| Note, médiane | 0,78 | 0,82 |
| Absences sûres teintées à tort, médiane | 22 % | 12 % |
| Pie, nord de la Sibérie : cases ajoutées | 2 323 (2 060 à son propre seuil) | 68 |
| Bulbul, cœur du Sahara | 41 (44) | 1 |
| Coq, hors Asie du Sud et du Sud-Est | 3 127 (2 407) | 1 984 |
| Coq, son aire sauvage : cases ajoutées | 4 757 | 4 168 |

- Pie et Bulbul : les débordements disparaissent. Coq : 18 à 37 % de moins seulement, surtout des poules domestiques ;
  la règle à part pour les oiseaux domestiques reste à décider. L'ancienne règle n'en mettait que 468 hors d'Asie, mais
  elle vidait aussi les cartes des oiseaux ordinaires.
- **Bilan** : la correction vaut pour les espèces répandues (note +0,04, deux fois moins de cases teintées à tort,
  débordements retirés) et ne change presque rien pour les autres. Coût : environ 33 h de calcul pour tout générer,
  contre 7 h. **Choix de Mathis (2026-10-23) : la version corrigée** (garanti85, carte à 1 000 observations, seuil
  réglé au même effort).
- Confirmé ensuite, médianes, premier essai au même seuil contre corrigée : second tirage (25 espèces) note 0,43 ->
  0,46, absences sûres teintées 23 % -> 20 %, cases ajoutées 1 504 -> 1 139 ; 4 oiseaux de contrôle note 0,69 -> 0,69,
  teintées 24 % -> 16 %, ajoutées 33 339 -> 27 129 (Fou de Bassan 650 -> 376, Pigeon biset 41 163 -> 32 614).
  Partout la même chose : un peu plus prudente, cases retrouvées 82 % contre 85 %.

Deux cas limites corrigés en route dans `modele.R` et `modele2.R` (troisième tirage, *Ptilinopus greyi*, oiseau d'îles) :
un pli de validation sans aucune case faisait s'arrêter ranger (« sample_fraction too small ») ; l'apprentissage des
couleurs du premier essai aussi, avec moins de 10 cases colorées.

## Le temps de calcul (2026-10-23)

La validation par blocs prend 79 % du temps de la version corrigée (troisième tirage) et ne sert qu'à régler les seuils.
Essai d'une validation allégée (3 groupes de blocs au lieu de 5, 4 découpages au lieu de 8, 100 et 50 arbres au lieu de
250 et 100 ; `verifier-temps.sh`, `comparer-validation.mjs`). La graine est désormais refixée avant la carte : la carte
ne dépend plus de la validation, seuls les seuils changent (vérifié : 0 carte différente entre deux passages identiques).
Les deux versions sont jugées avec les mêmes prédictions hors bloc, celles de la validation complète.

| | Troisième tirage, complète -> allégée | 4 espèces de la maquette |
|---|---|---|
| Temps de validation | 202 s -> 51 s | 1 034 s -> 110 s |
| Cases ajoutées, médiane | 370 -> 347 | 10 023 -> 11 593 (+11 %) |
| Note (MCC), médiane | 0,40 -> 0,32 | 0,82 -> 0,82 |
| Contrôles | - | Pie Sibérie 68 -> 155 ; Bulbul Sahara 0 -> 0 ; Coq hors Asie 1 613 -> 1 492 |

**Refusée.** Les médianes des cases retrouvées et teintées à tort tiennent (81,6 -> 82,9 %, 19,3 -> 18,9 %), mais les
espèces à petite aire deviennent instables : Cotinga à queue fourchue 133 -> 647 cases ajoutées, Organiste à ventre brun
53 -> 306, Brève iris 85 % -> 43 % des cases notées retrouvées, Manakin à col blanc 81 % -> 53 %. Les critères fixés
avant (cases ajoutées à ±10 % et contrôles à peu près inchangés) ne tiennent pas sur la maquette.

**Le temps total, réestimé sur les trois tirages** (`temps3.mjs`) : 10,7 s par espèce (premier tirage), 15,2 (second),
17,4 (troisième, machine chargée par d'autres sessions), 8,6 (le même troisième tirage refait la nuit) : **27 à 53 h**
pour les 10 662 cartes selon la charge de la machine, et non 33 h. Le même calcul prend deux fois plus de temps quand
d'autres sessions font tourner leurs bancs.

**Une piste sans effet sur les cartes** : un calcul n'occupe en moyenne que 2,3 des 12 fils du processeur (584 s de
processeur pour 257 s d'horloge). Faire tourner plusieurs espèces à la fois (`FILS=3`) irait plus vite sans changer une
case. Limite : 7,6 Go de mémoire, 1 Go libre quand les autres sessions tournent.

Mesuré (`verifier-parallele.sh`, troisième tirage calculé deux fois coup sur coup) : une espèce à la fois 317 s, trois à
la fois (`FILS=4` chacune) 200 s, soit **1,6 fois plus vite**, avec des fichiers de résultats **identiques à l'octet**
(48 sur 48 : ranger tire ses arbres d'après la graine, quel que soit le nombre de fils). Mémoire : 586 Mo au plus pour
le calcul des modèles locaux de la Pie, l'une des espèces les plus lourdes (`memoire-r.ps1`, dans le dossier de
travail de la session). Mesure faite avec d'autres sessions en marche et 1 Go libre : sur une machine libre, le gain
devrait être plus grand (non mesuré).

**Bilan du temps** : environ **17 à 33 h** pour toutes les cartes avec trois espèces à la fois (27 à 53 h une à la
fois), à lancer quand l'ordinateur ne sert à rien d'autre. La validation allégée est écartée.

## Les oiseaux marins (2026-10-23)

Choix de Mathis. Le modèle n'apprend et ne prédit que sur la terre (5 % de terre au moins dans la case, d'après
WorldCover) : une case de pleine mer n'existe pas pour lui. Mesuré (`diag-mer.mjs`) : il ne voit pas 25 à 74 % des
cases où un oiseau marin est noté (pleine mer, et bords de côte à moins de 5 % de terre, où même la Pie est notée dans
216 cases) ; une partie de la mer reste sans climat CHELSA (jusqu'à 411 cases notées pour l'Océanite de Wilson).

Essai : `MER=1` dans `modele2.R` fait entrer les cases de mer (climat CHELSA connu, 100 % d'eau pour WorldCover) et une
couche de plus, la distance à la côte (`couche-cote.mjs`, calculée sur nos couches, sans téléchargement). Version
corrigée choisie par Mathis (règle garanti85, carte à 1 000 observations), sans la mer (`-T`) et avec (`-M`), sur
12 oiseaux marins (`marins/` : Fulmar boréal, Puffin des Anglais, Océanite de Wilson, Albatros à sourcils noirs, Fou de
Bassan, Mouette tridactyle, Frégate superbe, Fou brun, Macareux moine, Guillemot marmette, Macreuse noire, Océanite
tempête). Puis le troisième tirage et les 4 espèces de la maquette avec la mer, contre leur version sans la mer déjà
faite (`-R5`, mêmes réglages). Calcul : `verifier-mer.sh` ; lecture : `comparer-mer.mjs` (cases de contrôle prises sur
la terre et la mer, une case de mer comptant « pas de teinte » pour le modèle sans la mer, puisque c'est ce que montrerait
la carte). Lancé une première fois à 1 h 48, coupé par la mise en veille de l'ordinateur, relancé à 11 h 38.

**Critères fixés avant de regarder** (médianes) :
- **Oiseaux marins**, avec la mer contre sans : note au moins 0,05 au-dessus ; au moins 70 % des cases notées en mer
  retrouvées ; absences sûres teintées à tort en mer pas plus nombreuses que pour l'aire iNaturalist (qui a vu ces cases :
  elle est avantagée) ; sur terre, cases retrouvées et teintées à tort à 2 points près.
- **Oiseaux terrestres** (troisième tirage et maquette), avec la mer contre `-R5` : note à 0,02 près ; cases retrouvées et
  teintées à tort sur terre à 2 points près ; cases ajoutées sur terre à 10 % près ; cases ajoutées en mer pas plus de 5 %
  de leurs cases ajoutées (la Pie notée sur 216 bords de côte ne doit pas se mettre à teinter la mer) ; débordements à peu
  près inchangés : Pie au nord de la Sibérie 68 (au plus 100), Bulbul au cœur du Sahara 0 (au plus 5), Coq hors d'Asie
  1 613 (au plus 1 800). Ces trois chiffres de référence sont ceux de `-R5`, retrouvés par `comparer-mer.mjs . -R5 -R5`.
- Si les marins gagnent et les terrestres tiennent : la mer pour tous. Si les terrestres se dégradent : la mer pour les
  seuls oiseaux marins, ce qui demande une règle pour les reconnaître (choix pour Mathis). Si les marins ne gagnent pas :
  garder pour eux la teinte iNaturalist, ou rien.

### Résultat (calcul de 11 h 38 à 12 h 19)

Les 12 oiseaux marins, médianes (`comparer-mer.mjs marins -T -M`) :

| | Sans la mer | Avec la mer | Aire iNaturalist |
|---|---|---|---|
| Note (MCC) | 0,48 | 0,62 | - |
| Cases notées en mer retrouvées | 0 % | 94 % | 99 % |
| Absences sûres teintées à tort en mer | 0 % | 43 % | 44 % |
| Cases notées sur terre retrouvées | 81 % | 77 % | 84 % |
| Absences sûres teintées à tort sur terre | 6 % | 4 % | 6 % |
| Cases ajoutées à 250 km, terre / mer | 1 301 / 0 | 836 / 23 489 | - |

- Note en hausse pour les 12, de +0,07 (Macreuse noire) à +0,30 (Océanite de Wilson, 0,14 -> 0,44). Critères de la note,
  des cases en mer et des fausses teintes en mer : tenus. En mer, le modèle fait moins de fausses teintes que l'aire
  iNaturalist pour 7 espèces (Mouette tridactyle 42 % contre 77 %, Frégate superbe 8 % contre 31 %), nettement plus
  pour 3 (Albatros à sourcils noirs 57 % contre 20 %, Macreuse noire 55 % contre 26 %, Océanite de Wilson 77 % contre
  45 %), à 2 points près pour les 2 autres (Fulmar boréal, Macareux moine).
- **Critère manqué sur terre** : 4 points de cases retrouvées en moins (81 -> 77 %), pour 2 permis ; Océanite de Wilson
  82 -> 62 %, Albatros 80 -> 68 %. Explication probable, non vérifiée : la garantie des 85 % porte sur toutes les cases
  notées à la fois ; la mer, facile, en fournit beaucoup, et le seuil peut monter aux dépens des cases de côte.

Les oiseaux terrestres, médianes (`comparer-mer.mjs echantillon3 -R5 -M` et `. -R5 -M`) :

| | Troisième tirage (24) sans -> avec | Maquette (4) sans -> avec |
|---|---|---|
| Note (MCC) | 0,40 -> 0,41 | 0,81 -> 0,83 |
| Cases notées sur terre retrouvées | 82 -> 82 % | 92 -> 93 % |
| Absences sûres teintées à tort sur terre | 19 -> 17 % | 12 -> 8 % |
| Cases ajoutées sur terre | 370 -> 293 (-21 %) | 10 023 -> 13 606 (+36 %) |
| Cases ajoutées en mer | 0 -> 2 | 0 -> 99 |
| Pie, nord de la Sibérie | - | 68 -> 1 013 |
| Bulbul, cœur du Sahara | - | 0 -> 0 |
| Coq, hors Asie du Sud et du Sud-Est | - | 1 613 -> 15 082 |

- **Les terrestres ne tiennent pas** : cases ajoutées hors des 10 %, et deux débordements multipliés. La note et les
  fausses teintes, elles, s'améliorent un peu.
- **Pie en Sibérie** : 1 013 cases, toutes sur terre. Le seuil du modèle mondial tombe de 0,55 à 0,40 (mesuré) ;
  probablement parce que la mer apporte quantité d'absences faciles et que le meilleur seuil du MCC descend, mais
  `MER=1` change trois choses à la fois (cases de mer, distance à la côte, bords de côte à moins de 5 % de terre), non
  séparées. Et les modèles locaux, muets presque partout là-haut,
  y parlent désormais (5 954 cases de terre au-dessus de 60° N et 60° E, contre 989 ; sans doute parce que la mer donne
  assez de cases aux carrés de 20° de la côte, non vérifié) et sont d'accord : 752 de ces cases sont teintées par l'accord des deux (5 avant).
- **Coq hors d'Asie** : sur terre, il baisse (1 613 -> 1 136) ; les 13 946 autres cases sont EN MER, autour des îles et
  des côtes où les poules sont notées (21 760 cases de mer ajoutées en tout).
- Oiseaux terrestres qui se mettent à teinter la mer : Brève iris 660 cases (pour 368 sur terre ; oiseau de forêt
  d'Australie), Colombe de Buckley 277, Tyranneau à tête brune 173. Le Courlis d'Alaska, qui hiverne sur les îles du
  Pacifique, en gagne 10 071, et sa note double (0,14 -> 0,30).

**Verdict** : la mer pour tous, non. Pour les oiseaux marins, le modèle avec la mer bat nettement celui d'aujourd'hui,
mais il ne fait que **jeu égal avec l'aire iNaturalist** que le site montre déjà : en mer 94 % des cases notées
retrouvées contre 99 %, 43 % de fausses teintes contre 44 % ; sur terre 77 % contre 84 %, 4 % contre 6 % (iNaturalist
est avantagée, elle a vu ces cases). Ce qui départagerait les deux n'est pas mesuré : le modèle fait-il mieux là où
iNaturalist est faible (son aire trop courte en Scandinavie, par exemple) ?

Deux voies, choix pour Mathis :
- **Garder la teinte iNaturalist pour les oiseaux marins** : rien à calculer, aussi bonne sur ces mesures.
- **La mer pour les seuls oiseaux marins** : 15 % de calcul en plus pour eux, les 4 points perdus sur la côte à rendre,
  et une règle pour les reconnaître. Règle possible : la part de leurs cases notées qui sont en mer, de 11 % (Macreuse
  noire) à 51 % (Océanite de Wilson) pour les 12 marins, de 0 à 8 % pour les 28 terrestres (Coq 5 %, Ptilope de Grey
  8 %), sauf le Courlis d'Alaska (28 %), que la mer aide aussi. Un seuil à 10 % les séparerait tous, mais il a été choisi
  APRÈS avoir vu ces 40 espèces : à vérifier sur des oiseaux de côte qui ne vont pas au large, là où il peut se tromper
  (Goéland argenté, Grand Cormoran, Sterne pierregarin, Bécasseau sanderling, Huîtrier pie, Aigrette garzette).

Temps : 1 685 s pour les 12 marins avec la mer, contre 1 465 sans (+15 %, même calcul, mêmes conditions).

## Le modèle contre l'aire iNaturalist (2026-10-23)

Mathis doute que le modèle vaille la peine. La question qui tranche : fait-il mieux que l'aire iNaturalist, elle-même
un modèle (Geomodel, entraîné sur toutes les observations d'iNaturalist) ? Mêmes cases de contrôle sur terre que plus
haut, version choisie (`-R5`), lu dans `comparer-mer-M.json` :

| | Troisième tirage (24 espèces ordinaires) | Maquette (4 espèces répandues) |
|---|---|---|
| Cases notées retrouvées : modèle / iNaturalist | 82 % / 91 % | 92 % / 98 % |
| Absences sûres teintées à tort : modèle / iNaturalist | 19 % / 16 % | 12 % / 27 % |
| Espèces où le modèle fait mieux / moins bien / pareil | 6 / 15 / 3 | 3 / 1 / 0 |

(Espèce par espèce : cases retrouvées moins cases teintées à tort, à 3 points près.) L'aire iNaturalist est avantagée,
elle a vu ces cases ; mais l'écart sur les espèces ordinaires est trop net pour venir de là seul.

- **Espèces répandues** : le modèle fait mieux, et répare les ratés d'iNaturalist (la Pie absente d'Europe dans le
  fichier, le Coq teinté partout).
- **Espèces ordinaires**, le gros des 10 662 cartes : iNaturalist fait mieux.
- **Oiseaux marins** : à égalité.
- **Là où iNaturalist n'a rien** : 6 981 aires pour 10 662 cartes, donc au moins 3 681 espèces sans teinte. C'est le seul
  endroit où le modèle apporterait du neuf. Dans le troisième tirage (30 espèces au hasard), 7 n'ont pas d'aire
  iNaturalist (`aireInat` nul dans `echantillon3/especes.json`) : 5 n'ont pas assez d'observations pour un modèle (2 à
  15 cases notées), et les 2 autres en ont un faible (Érione à front bleu, 31 cases, note 0,05 et 69 % d'absences
  sûres teintées à tort ; Shama bridé, 55 cases, 0,24 et 46 %). Les espèces sans aire sont celles qu'on observe peu,
  et c'est justement là que le modèle n'apprend rien.

**Décision de Mathis (2026-10-23) : arrêter, garder la teinte iNaturalist.** Écartés : le modèle pour les seules espèces
répandues (une règle pour les reconnaître et un calcul à part) et la
suite de l'expérience (oiseaux domestiques, altitude, mois), que rien ne désignait pour combler l'écart. Pour y revenir,
la mesure à battre est le tableau ci-dessus, sur le troisième tirage.

**Fichiers de l'essai supprimés le 2026-10-23 à la demande de Mathis** : `notes-privees/essai-cartes/modele/` (1 932
fichiers, 5,33 Go : scripts, couches CHELSA et WorldCover ramenées à nos cases, grilles, résultats, brief
`POUR-REPRENDRE.md`), envoyé à la Corbeille de Windows. Les noms de scripts cités dans ce document n'existent donc plus ;
ce document garde les méthodes et les chiffres. La maquette `notes-privees/maquettes/modele/` (70 fichiers, 750 Ko)
a suivi le même jour, à la Corbeille aussi : les liens vers http://localhost:8765/notes-privees/maquettes/modele/ ne
mènent plus nulle part.
