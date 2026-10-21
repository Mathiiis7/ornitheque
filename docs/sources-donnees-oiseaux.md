# Sources de données d'oiseaux : ce qui est vraiment accessible

Recherche du 2026-10-21, suite de `docs/cartes-combler-les-trous.md`. Demande de Mathis : chercher plus loin,
« parce que des fois on croit que c'est inaccessible mais en fait si », en France et dans le monde.

Six recherches en parallèle (France, Europe, Afrique et Moyen-Orient, Russie et Asie, Amériques et Océanie,
bases mondiales et aires), environ 175 sources. Le détail (une fiche par source, avec l'adresse lue et la
date) est dans `notes-privees/essai-cartes/sources-recherche/` (hors dépôt). Aucun compte créé, aucun
formulaire, aucun message envoyé. Les points marqués **revérifié** ont été relus à la source après coup.

Ce qui compte pour nous n'est pas seulement « accessible » : c'est **pouvoir publier une carte dérivée en
fichier sur un site public**, sous CC BY-NC (décidé le 2026-10-21). Une clause « partage à l'identique »
(SA) s'étendrait à toutes nos cartes ; une condition maison qui interdit la diffusion en fichier bloque,
comme pour BirdLife et Cornell Status & Trends.

## En bref

1. **Nos cartes s'arrêtent à fin 2024.** GBIF n'a aucune donnée eBird de 2025 ni de 2026 : le jeu eBird y
   est publié une fois par an, la dernière fois le 08/08/2025, et couvre jusqu'au 31/12/2024 (**revérifié** :
   248,7 M de fiches en 2024, 228,7 M en 2023, rien après). Il suffira de refaire notre téléchargement
   quand la prochaine publication arrivera, sans rien demander à personne. La date n'est pas annoncée.
2. **Le fichier complet d'eBird s'obtient sur simple demande** : un compte eBird gratuit et une courte
   description du projet, accord « en général sous 7 jours », mis à jour chaque mois. Il apporte ce que GBIF
   n'a pas : le numéro de liste, le protocole, la durée et la mention « liste complète », donc de vraies
   fréquences, plus 2025 et 2026. Les conditions de Status & Trends disent elles-mêmes qu'elles ne
   s'appliquent pas aux données brutes : l'ancien refus ne vaut pas ici. **Le texte exact des conditions
   eBird n'a pas pu être lu** (la page refuse l'outil) : à lire par Mathis avant de demander.
3. **En Russie, le gain est déjà sur GBIF** (**revérifié**) : depuis 2015, 5,89 M d'oiseaux, dont
   iNaturalist 2,68 M, RU-BIRDS.RU 1,75 M et eBird seulement 1,15 M (19 %). Les deux premiers sont sous des
   licences qui nous vont. Il suffit de les mettre dans le deuxième téléchargement GBIF. Une question de
   méthode reste à trancher (plus bas).
4. **L'atlas africain ABAP se lit librement**, sans compte (**revérifié** : l'API répond), avec des listes
   complètes et le temps passé, y compris pour des pays absents de GBIF (Tanzanie, Ouganda, Ghana, Liberia,
   Sierra Leone, Gambie, un peu RD Congo et Tchad). Mais les volumes sont petits (1 970 listes en Tanzanie,
   95 au Tchad) et **aucune licence des données n'est écrite** : il faut leur écrire.
5. **BirdLife n'est peut-être pas fermé** (**revérifié**) : la clause 11 interdit de rediffuser les données
   « dans leur format d'origine » ; la clause 13 dit qu'un produit dérivé doit être « transformatif » et
   original, « sinon » il faut un accord écrit. Une grille de 28 km croisée avec nos observations pourrait
   l'être. Ce n'est pas un oui : une question à poser par écrit.
6. **Trois aires libres de plus** : Amazonie (Rego et al. 2023, aires de sous-espèces, CC0, **revérifié**),
   aires d'habitat mondiales (Lumbierres et al. 2022, CC0, **revérifié** : deux des sept auteurs, Butchart
   et Donald, sont de BirdLife, ce qui réduit le doute sur leur droit), Europe des nicheurs (EBBA1 de 1997 en
   CC BY sur GBIF, **revérifié** ; rapportage européen « Article 12 » 2013-2018, maille 10 km, CC BY 4.0,
   **revérifié**).
7. **Là où personne n'observe, rien d'ouvert n'existe hors de GBIF** : Afrique centrale, Sahara, Amazonie,
   Nouvelle-Guinée, Chine intérieure, Mongolie, Moyen-Orient. Dans ces zones, eBird fait 95 à 97 % de GBIF
   (Brésil, Amazonas, Papouasie). Les seules voies y restent les aires estimées.

## Ce qui change pour nos cartes, dans l'ordre

| Quoi | Ce que ça apporte | Qui | Où on en est |
|---|---|---|---|
| Mois voisins | +59 % de cases par mois pour le bulbul, sans nouvelle donnée | moi | prêt (`docs/cartes-combler-les-trous.md`) |
| Deuxième téléchargement GBIF | Russie et Sibérie, Afrique australe, Nigeria, Kenya, Scandinavie, Australie (Birdata, 9,1 M depuis 2015) | je prépare, Mathis lance | à faire ; filtres ci-dessous |
| Refaire le téléchargement eBird quand 2025 arrive sur GBIF | 2025 et 2026 (environ 250 M de fiches par an) | Mathis lance | attendre la publication |
| Fichier complet d'eBird | vraies fréquences (listes complètes), mois à jour | Mathis : compte et formulaire | lire d'abord les conditions |
| Aire iNaturalist en teinte pâle | surface x 1,6 à 3,1 | moi | maquette faite |
| Aires en plus (Amazonie, Europe) | aires plus justes là où iNaturalist se trompe | moi | plus tard |
| Messages | voir la liste plus bas | Mathis | rien d'envoyé |

**Pour le deuxième téléchargement GBIF**, ce que les recherches ont appris :
- ne garder que les observations humaines (`basisOfRecord = HUMAN_OBSERVATION`) : au Sahel et au Sahara,
  le reste de GBIF hors eBird, ce sont surtout les balises GPS de quelques oiseaux européens (au Mali, au
  moins 87 781 points sur 110 374 fiches), et elles font 32 % des oiseaux GBIF de Bulgarie ;
- écarter par jeu le baguage (TIPU, Operation Baltic) et les postes de comptage fixes (Batumi Raptor Count) ;
- au Nigeria, le jeu « Adhoc Records » contient en fait des listes complètes de 2016 à 2025, en double avec
  le jeu « Full Protocol » pour 2016-2021 : à dédoublonner ;
- Faune-France sur GBIF (5,08 M de lignes, 2017-2021, CC BY) donne une ligne par espèce, par commune et par
  année : inutilisable pour une fréquence, à écarter ; Faune-Occitanie, lui, donne des observations précises
  (3,86 M, 2016-2022, CC BY) ;
- iNaturalist sur GBIF ne contient que les licences CC0, CC BY et CC BY-NC : sur 34,8 M d'oiseaux validés
  depuis 2015, seuls 5,7 M sont CC0 ou CC BY. Sans la décision CC BY-NC, iNaturalist serait presque perdu ;
- xeno-canto y est aussi, en CC BY-NC, à jour (**revérifié**).

**La question de méthode, à trancher par Mathis** : iNaturalist, RU-BIRDS ou Observation.org sont des
observations isolées (une photo, une espèce), pas des listes complètes. Les additionner aux listes eBird
change le sens du total « tous les oiseaux de la case » : là où les photographes visent les espèces voyantes,
celles-ci paraîtraient plus fréquentes qu'elles ne sont. On peut les garder à part (une fréquence par source,
puis les combiner) ou ne s'en servir que pour la présence là où eBird manque. À décider avant de calculer.

## Messages à envoyer, par Mathis

Classés par ce qu'ils peuvent rapporter. Les contacts sont dans les fichiers de recherche.

1. **BirdLife** : notre grille de 28 km, croisée avec nos observations, est-elle un produit dérivé
   « transformatif » au sens de la clause 13 ? Dans le même message, l'usage des aires de Lumbierres et al.
2. **ABAP (Université du Cap)** : publier sur GBIF les pays qui n'y sont pas encore, comme pour le Nigeria
   en CC BY ; sinon, sous quelle licence reprendre les listes par l'API.
3. **LPO, Faune-France et Faune-Guyane** (un seul courrier) : un extrait flouté qui ne sort pas brut, en
   demandant explicitement le **mois** (leur floutage habituel remplace la date par l'année). La Guyane
   touche l'Amazonie : c'est le seul vrai trou français. Le code de 2014 de Faune-Guyane prévoit des accès
   spéciaux pour une synthèse non lucrative, à condition d'être soi-même contributeur.
4. **Sibecocenter (Novossibirsk)** : leurs deux jeux sibériens (CC BY-NC) sont figés sur GBIF depuis mai 2020 ;
   demander une mise à jour.
5. **WABDaB (Afrique de l'Ouest)** : environ 57 000 observations vers 2015 au Niger, au Tchad et au Burkina,
   dont une partie seulement sur GBIF ; licence inconnue, contact peut-être périmé.
6. **EBBA2** : créer un compte gratuit, seulement pour lire la variante exacte de la licence (des indices
   pointent vers SA ou NC).
7. Priorité basse : China Bird Report (accord écrit obligatoire, et licence SA à faire lever), EuroBirdPortal
   (chaque portail partenaire peut refuser, et ni l'Ukraine, ni la Biélorussie, ni le Caucase n'en font
   partie), EcoRegistros (Argentine, reproduction interdite sans accord).

## Par zone

### France
- **La France n'est pas un trou**, sauf la Guyane.
- **Le vide après 2022 n'est pas un manque de données.** Le site national de l'inventaire naturaliste
  (INPN) a été hors service du 26 juillet 2025 au 22 juillet 2026 après une cyberattaque du Muséum ; le
  portail de téléchargement OpenObs doit revenir « dans les prochains mois » et les données de l'inventaire
  « d'ici la fin de l'année » (**revérifié** sur la page d'accueil de l'INPN). Des jeux Faune-France 2022 et
  2023 existaient dans cet inventaire : à regarder quand OpenObs reviendra (licence ouverte annoncée,
  forme des données inconnue).
- **Oiseaux de France est fermé** : son API publique sert les mailles des atlas, mais ses conditions
  interdisent toute réutilisation « sans autorisation expresse et préalable de la LPO ».
- **L'API VisioNature (Biolovision) n'ouvre rien de plus** : elle suit les droits du compte.
- Ouvert et publiable : Faune-Occitanie (voir plus haut), Clicnat (Picardie, 1,00 M, CC BY), Vigie-Nature
  (STOC, SHOC, Oiseaux des jardins) et comptages Wetlands jusqu'en 2021-2022, Observation.org (1,44 M depuis
  2015, CC BY-NC), le Grand Est en données ouvertes sans compte ; SILENE (PACA) visait les données ouvertes
  pour juin 2026, à revérifier.

### Europe hors France
- Trous mesurés sur nos grilles : Russie d'Europe (environ 3 100 cases sous le seuil), Ukraine 32 %,
  Biélorussie 29 %, est de la Turquie 25 %, Azerbaïdjan 21 %. La Roumanie, les Balkans, la Grèce, la Hongrie,
  la Tchéquie et les pays baltes n'en sont pas (0 à 14 %).
- Russie d'Europe : RU-BIRDS (1,57 M) et iNaturalist (1,91 M) font 77 % des observations humaines de la zone,
  contre 20 % pour eBird. Déjà sur GBIF.
- Ukraine : une dizaine de jeux de l'UNCG sur GBIF en CC BY, souvent anciens ou locaux ; UkrBIN a une clause
  « mêmes conditions » qui a l'effet d'un SA, et rien sur GBIF.
- La Turquie passe désormais par eBird (96 % de ses observations humaines) : Kuşbank ne compte plus à part.
  eBird Pologne a été lancé le 3 juin 2026.
- Fermés ou à usage unique : Tiira (Finlande, 30,9 M), MAP (Hongrie, 130 861 listes complètes), ornitho.de,
  ornitho.pl, NDFF (Pays-Bas, payant d'après un document de 2017).
- Surprise : OpenBirdMaps (Roumanie), 2,48 M d'observations hors GBIF, réutilisation permise par la
  plateforme ; mais la Roumanie n'est pas un trou.

### Afrique et Moyen-Orient
- ABAP par son API (voir « En bref ») ; SABAP2 (25,7 M sur 9 pays), Nigeria et Kenya déjà sur GBIF.
- Afrique centrale, Sahara, Sahel : rien d'ouvert. Des livres (Gabon 2026, Cameroun 2019), un atlas de
  Mauritanie en ligne dont le domaine ne répond plus, la base WABDaB (voir les messages).
- Moyen-Orient : OSME n'a pas de base d'observations (ce n'était pas un mur, il n'y a rien) ; les Émirats
  versent tout à eBird depuis 2011 ; l'atlas des nicheurs d'Arabie (ABBA) donne des cartes espèce par espèce,
  sur demande, pour un usage non commercial, maille 0,5°.

### Russie et Asie
- Russie : voir « En bref ». À l'est de 60° E depuis 2015 : 1,23 M d'oiseaux sur GBIF, dont iNaturalist
  731 000 et eBird 231 000, plus des relevés aériens d'oiseaux d'eau de l'Arctique 2014-2024 (CC BY).
- Pays où eBird fait moins de 80 % de GBIF : Corée du Nord 42 %, Corée du Sud 47 %, Mongolie 69 %,
  Turkménistan 70 %, Japon 74 %, Taïwan 75 %, Kazakhstan 76 %, Ouzbékistan 77 %. En Asie centrale le reste est
  petit, en Mongolie ce sont surtout des jeux d'une seule espèce.
- Chine : China Bird Report est la seule grosse base hors eBird, inutilisable sans accord (extraction
  interdite sans permission, licence CC BY-NC-SA).
- birds.kz est devenu kz.birding.day, avec des sous-sites Sibérie et Extrême-Orient : des photos, sans export
  ni licence.

### Amériques et Océanie
- Amazonie, Nouvelle-Guinée, Pacifique : eBird fait 94,6 à 96,8 % de GBIF ; ce qui est gros ailleurs est
  fermé ou sur demande (WikiAves sans licence trouvée et localisé à la commune, EcoRegistros, inventaire
  forestier de Papouasie-Nouvelle-Guinée confidentiel).
- Australie : eBird n'y fait que 75 % de GBIF ; Birdata (BirdLife Australia) y est déjà, en CC BY-NC.
- Les atlas du Chili (2011-2016) et de Nouvelle-Zélande (2019-2024) ont été saisis dans eBird : déjà dans nos
  cartes.
- Piège : une copie des cartes BirdLife et NatureServe de 2012 circule sur Zenodo marquée « CC BY », déposée
  par un tiers. La clause 11 de BirdLife s'applique toujours.

### Bases mondiales
- iNaturalist : presque tout l'utilisable est déjà sur GBIF ; le reste, 2,26 M d'observations « à
  identifier » sous licence ouverte dans le monde, non compté par zone.
- BirdWeather (détecteurs acoustiques) recopie l'API eBird et n'affiche aucune licence : à écarter.
- Écartés : balises GPS (Movebank, Seabird Tracking), baguage (EURING, payant), Christmas Bird Count (usage
  personnel), recensements d'oiseaux d'eau (IWC et Asian Waterbird Census : payants, accord pays par pays).

## Encore non vérifié

- **Les conditions exactes du fichier complet d'eBird et de son API** : la page refuse l'outil. À lire par
  Mathis dans son navigateur, en cherchant une clause « derived ... same Terms of Use » (qui contredirait nos
  cartes en CC BY-NC), la définition de « research and education », et pour l'API les règles de mise en cache.
- La licence des données ABAP hors GBIF ; la licence d'EBBA2 ; celle de WABDaB.
- Le contenu des jeux Faune-France 2022-2023 de l'inventaire national (OpenObs hors service).
- Le filtre de licence dans une demande de téléchargement GBIF : déduit de la documentation, pas essayé.
- La copie archivée des pages refusées : web.archive.org est refusé à l'outil, ce recours n'a jamais servi.
  Mathis peut les ouvrir dans son navigateur.

## À corriger ailleurs, vu en passant

La page des crédits (`index.html`, ligne 1004) annonce « CC BY 4.0 » pour les cartes, alors que GBIF classe
notre téléchargement 10.15468/dl.rb9sut (les 236 cartes « présence seule ») en CC BY-NC 4.0. Cohérent avec la
décision du 2026-10-21 ; le texte reste à corriger quand les cartes passeront en CC BY-NC.
