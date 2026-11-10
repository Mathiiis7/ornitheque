# Audit des 242 pays - 10 novembre 2026

Demande de Mathis : « fais un tour dans chaque pays pour voir s'il y a des incohérences ou des bugs ».
Trois contrôles :
- les données de chaque pays (`outils/verif/_audit-pays.mjs`) ;
- la place de chaque zone sur la Carte, vérifiée par les sites eBird (`outils/verif/_zones-sites.mjs`) ;
- un tour du Birdydex et de la fiche dans le navigateur, pays par pays (`outils/verif/_tour-pays.mjs`).

## Corrigé (v1073)

| Défaut | Ampleur | Cause | Correction |
|---|---|---|---|
| Espèce rare affichée « - » au lieu d'un pourcentage | 205 couples espèce-pays (303 avant, 98 restent, voir plus bas) | Arrondi à 5 décimales dans le générateur | `arrondi()` garde deux chiffres significatifs |
| Espèces des pays du monde sous leur nouveau nom latin (Bruant des roseaux absent de 30 pays depuis sa fiche) | 36 espèces, une centaine de pays, plus le Maroc | La taxonomie eBird d'octobre 2026 | `outils/build/noms-du-site.mjs`, utilisé par le générateur et les exotiques |
| Espèces sans nom français | 37 espèces (Chevalier des prairies, Arrenga à bec jaune...) | Espèces nouvellement séparées par eBird | `outils/build/ajouter-noms-fr.mjs` (noms officiels eBird) |
| Formes de zones mal placées sur la Carte | Guyana (8 zones), Équateur (Napo et Tungurahua), Érythrée (4), Russie (Moscou ville et région) | Natural Earth étiquette mal ces formes, nom compris | `ALIAS_MONDE` et `ECHANGES_NE` dans `simplify-regions-multi.mjs` |
| Noms de zones faux | Paktia et Paktika inversées, « Essequibo Islands » appelée Mahaica-Berbice, Surigao del Norte appelée « des Îles Dinagat », Zamboanga du Nord appelée « péninsule de Zamboanga » | Codes échangés chez Natural Earth | `zones-monde-noms.mjs` |
| Deux zones au même nom | Buenos Aires, Mexico, Tachkent, Chiayi, Hsinchu, Grand'Anse, Lankaran | Une ville et sa province | Précision entre parenthèses (« Buenos Aires (ville) ») |
| Noms de zones tronqués | une cinquantaine de zones : « du Caire », « de Beyrouth », « méridional », « fédéral », « nations »... | Titre administratif retiré à moitié | `sansArticle()`, majuscule initiale |
| Carte de fiche vide aux Îles Marshall | 1 pays | Deux chaînes d'îles dessinées, sans données à y poser | Pays d'une pièce quand aucune zone n'a de listes |
| Gravelots perdus à la régénération | 4 espèces en Australie et en Nouvelle-Zélande, plus le Martinet malais | Noms français changés par eBird | `BAR_CHART_ALIAS`, `BAR_CHART_SCI` |

## Limites des sources (rien à corriger chez nous)

- **Espèces qu'eBird publie à 0,0 tous les mois** (Tadorne casarca au Canada) : décision de Mathis, elles
  ne sont pas présentes dans le pays. 98 retirées en v1074 hors France, puis les 5 françaises en v1075
  avec l'accord de Mathis (Oie naine et Bernache de Hutchins à 0 %, Dendrocygne à ventre noir, Faucon
  laggar et Bulbul orphée, absents du bar chart mais gardés par la fusion des tables françaises).
- **Zones sans forme** : Libye (7 zones, découpage de 2007 qu'aucune carte n'a), Qatar Al Ghuwayriyah,
  îles Baker, Howland et Kingman Reef (trop petites).
- **6 territoires qui ont des zones chez eBird mais aucune tracée** : Pays-Bas caribéens, îles Caïmans,
  Guinée équatoriale, Kiribati, Porto Rico, Tuvalu. Leur fiche prend les chiffres nationaux.
- **Zones dont les sites eBird sortent de la forme sans erreur de notre part** :
  - villes dans leur province : Almaty, Astana, Bichkek, Busan, Gwangju, Davao, Zamboanga, Puducherry ;
  - eBird qui garde des découpages anciens : Louxor encore compté dans Qena, sites du Nord-Kivu codés
    Sud-Kivu, sites de Tachkent hors de la ville ;
  - petites îles et paroisses de 2 à 4 sites (Barbade, Grenade, Seychelles, Samoa) ;
  - pays dont la Carte regroupe les communes d'eBird (Slovénie, Hongrie, Lettonie, Moldavie, Monténégro,
    Macédoine du Nord, Suisse, Royaume-Uni) : leurs sites tombent dans le regroupement, c'est voulu.
- **Monténégro sans fichier des 48 quinzaines** : premier pays étranger du site, il a gardé son script à
  part (`build-rarity-me-quinzaines.mjs`), qui ne l'écrivait pas. Corrigé en v1074 (`--quinzaines`).
- **Effort par zone absent pour 22 pays** (Afghanistan, Hongrie...) : l'appli retombe sans bruit sur
  l'effort national.
- **Pas de carte dans la fiche pour une espèce notée au niveau national mais dans aucune zone**
  (Sarcelle d'été aux Maldives), ni en Libye quand l'espèce n'est notée que dans les zones sans forme
  (Canard colvert à Tripoli). C'est la règle de la fiche : pas de carte quand aucune zone dessinée n'a
  de données.
- **Zone d'exotiques inconnue** : AF-FYB (Afghanistan), une zone eBird sans données, sans effet.
