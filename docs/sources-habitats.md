# D'où viennent les milieux de vie, et pourquoi de là

Recherche faite le 2026-09-30, après le passage d'AVONET à BIRDBASE. Elle répond à une
question simple : **est-ce qu'il existe mieux que BIRDBASE pour dire où vit un oiseau ?**

Réponse courte : **non, pas aujourd'hui, pas pour ce site.** Deux sources sont plus fines,
mais l'une est juridiquement fermée et l'autre ne couvre que l'Europe. Le détail suit.

## Ce qu'on demande à une source

Six critères, dans l'ordre où ils nous éliminent des candidats.

1. **Le droit de l'afficher.** Le site est public. Une source qu'on ne peut pas republier est
   éliminée, quelle que soit sa qualité. Ce critère à lui seul écarte les deux meilleures.
2. **La couverture.** L'Ornithèque nomme 11 189 oiseaux, du monde entier. Une source
   européenne laisse 95 % des fiches vides.
3. **La finesse.** Un seul milieu par oiseau ne décrit rien : le merle n'est pas qu'un oiseau
   de forêt. Il faut plusieurs milieux, et si possible classés par ordre de préférence.
4. **La taxonomie.** Les noms latins bougent tous les ans. Une source qui ne donne qu'une
   seule nomenclature nous fait perdre les espèces dont le genre a changé.
5. **La fraîcheur.** Une compilation de 2014 ignore dix ans de scissions d'espèces.
6. **L'accès.** Un fichier qu'on télécharge et qu'on relit tout seul, contre un robinet qui
   demande une clé, une demande écrite, ou qui peut se fermer.

## Le tableau

| Source | Année | Oiseaux | Milieux | Plusieurs par oiseau | Licence | Verdict |
|---|---|---|---|---|---|---|
| **BIRDBASE** | 2025 | 11 589 | 15 | **oui, classés par préférence** | CC BY | **retenu** |
| AVONET | 2022 | 11 009 | 11 | non, un seul | CC BY | remplacé |
| IUCN Red List | continu | tous | 14 + sous-catégories, Adapté/Marginal | **interdit d'afficher** | écarté |
| BirdLife Data Zone | continu | tous | idem IUCN | usage personnel seulement | écarté |
| Birds of the World | continu | tous | texte rédigé | abonnement payant | écarté |
| eBird Status & Trends | 2023 | 2 980 | classes satellite | clé + demande d'accès | écarté |
| Storchová & Hořák | 2018 | **499, Europe** | **15, dont montagne et toundra** | oui | **domaine public** | complément possible |
| EltonTraits | 2014 | 9 993 | pas d'habitat | libre | hors sujet |
| Wikidata / GBIF / Map of Life | continu | variable | épars ou dérivé de l'IUCN | variable | écarté |

## Ce que chaque ligne cache

### BIRDBASE, la source retenue

Şekercioğlu et al. 2025, *Scientific Data* 12:1558. Compilation de 367 sources publiées entre
1957 et 2025, principalement le *Handbook of the Birds of the World*, plus les observations de
terrain du premier auteur sur 9 400 espèces.

Ses quinze milieux : forêt, bambou, bois, arbustif, savane, prairie, plaines, rocher, désert,
artificiel, riverain, littoral, zone humide, pélagique, autre. Chacun porte un **rang** :
1 pour le milieu principal, 2 pour le suivant. C'est cette hiérarchie qui fait l'essentiel de
l'écart avec AVONET.

Il donne les noms latins dans **quatre taxonomies à la fois** (eBird/Clements v2024,
HBW/BirdLife v9.1, IOC v15.1, AviList v1). C'est ce qui nous fait passer de 95,0 % à 99,26 %
de couverture : des genres ont éclaté en 2024, et chercher dans une seule colonne perd tous
les oiseaux concernés.

### AVONET, ce qu'on a quitté

Tobias et al. 2022. Excellente base morphologique - on continue d'ailleurs à s'en servir pour
les traits de la fiche espèce. Mais côté habitat elle ne donne **qu'une catégorie primaire par
oiseau**, ce qui mesuré chez nous donnait 1,10 milieu par espèce et 9 592 oiseaux sur 10 584
avec un seul milieu.

**Les deux sources sont largement d'accord**, ce qui est rassurant : sur les 9 994 oiseaux que
les deux décrivent, le milieu qu'AVONET donnait figure chez BIRDBASE dans **93,5 % des cas**,
et c'est même son milieu principal dans 82,1 %. Les désaccords sont des nuances voisines -
104 fois « bois » contre « forêt », 100 fois l'inverse, 34 fois « marin » contre « littoral » -
et non des contradictions. Deux compilations faites séparément qui convergent à ce point, c'est
le meilleur signe de fiabilité qu'on puisse obtenir sans aller sur le terrain.

### L'IUCN, la meilleure source et la plus fermée

Ses habitats sont les plus fins du monde : 14 catégories, des sous-catégories, et surtout la
distinction entre habitat **adapté** et **marginal**, qui n'existe nulle part ailleurs.

Ses conditions d'utilisation (version 3.1, juin 2024) l'interdisent. La section 3 déclare
libres les **catégories de menace** - « en danger », « vulnérable » - et rien d'autre. La
section 1 range toutes les données tabulaires du site, habitats compris, dans ce qui est
protégé. La section 4 interdit toute republication, même partielle, même combinée à d'autres
données, même à l'intérieur d'un travail dérivé, sans autorisation écrite. Depuis 2017, les
travaux dérivés ne sont plus exemptés.

Une demande d'accès a été déposée en septembre 2026 : **refusée**, au motif que montrer un
statut Red List à d'autres personnes, même des amis, exige une autorisation préalable.

BirdLife Data Zone est le partenaire Red List pour les oiseaux : mêmes données, mêmes
conditions, « usage personnel ou étude privée » seulement. Map of Life et les cartes *Area of
Habitat* dérivent des mêmes préférences d'habitat IUCN et héritent donc de la contrainte.

### eBird Status & Trends, la fausse bonne idée

Le site s'en sert déjà pour les cartes d'abondance, l'accès est donc acquis. Mais ses
« associations d'habitat » sont d'une autre nature : un modèle statistique relie chaque
observation aux classes d'occupation du sol vues par satellite (MODIS) dans un rayon de 1,5 km.
Ce ne sont pas des milieux nommés par un ornithologue, mais des pourcentages de couverture
terrestre corrélés à la présence de l'oiseau.

Deux obstacles : **2 980 espèces seulement**, et il faudrait repenser entièrement l'affichage.
« 34 % de forêt mixte dans un rayon de 1,5 km » ne se met pas sur une pastille.

### Storchová & Hořák, le complément européen

499 espèces nicheuses d'Europe, **domaine public**, compilées depuis le *Birds of the Western
Palearctic*, la référence régionale. Ses quinze colonnes d'habitat sont
`Deciduous.forest, Coniferous.forest, Woodland, Shrub, Savanna, Tundra, Grassland,
Mountain.meadows, Reed, Swamps, Desert, Freshwater, Marine, Rocks, Human.settlements`.

Deux d'entre elles n'existent chez aucune source mondiale libre : **Tundra** et
**Mountain.meadows**. Ce sont précisément deux des cinq catégories que L'Ornithèque a perdues
le 2026-09-30 en abandonnant les corrections manuelles. Elle distingue aussi les feuillus des
conifères, ce que personne d'autre ne fait.

Son défaut est dans son titre : l'Europe. 499 oiseaux sur 11 189.

**Non vérifié** : le fichier lui-même n'a pas pu être téléchargé, Dryad opposant un mur
anti-robot. Les colonnes ci-dessus viennent de la documentation du paquet R `traitdata`, pas
d'une lecture du fichier. Avant toute décision, il faudra le récupérer à la main et mesurer sa
couverture réelle sur les oiseaux de France.

### Les autres

**Birds of the World** (Cornell) : la description la plus riche qui existe, en texte rédigé.
Abonnement payant, redistribution exclue.

**EltonTraits** (2014) : régime alimentaire et strates de recherche de nourriture - canopée,
sol, eau. Ce n'est pas l'habitat. Et sa taxonomie a douze ans.

**Wikidata, GBIF** : pas de couverture systématique de l'habitat. GBIF publie des occurrences,
pas des traits.

## Ce qu'une étude indépendante dit du sujet

« Assessing the completeness and consistency of global-scale avian datasets », *Scientific
Reports*, 2025 : les auteurs ont comparé 123 jeux de données aviaires publiés entre 2020 et
2024. Leur conclusion sur les variables **nominales** - celles qui portent un nom de catégorie,
comme l'habitat - est qu'elles montrent une cohérence seulement **moyenne** d'une base à
l'autre, là où les variables chiffrées s'accordent bien. Et ils désignent la réconciliation des
noms latins entre anciennes et nouvelles taxonomies comme le point critique.

C'est exactement ce qu'on a vécu : 95,0 % de couverture avec une seule nomenclature, 99,26 %
avec quatre. Et c'est pourquoi nos 93,5 % d'accord entre AVONET et BIRDBASE sont un bon
résultat, pas un résultat décevant.

## Verdict

**BIRDBASE reste le bon choix**, et il l'est de façon nette :

- c'est la seule source mondiale, libre, récente, qui donne plusieurs milieux par oiseau ;
- sa hiérarchie par ordre de préférence n'existe ailleurs que chez l'IUCN, qui est fermé ;
- ses quatre taxonomies règlent le problème qui coûte le plus cher en pratique ;
- une deuxième source indépendante le confirme à 93,5 %.

**Le seul gain possible est européen et facultatif** : Storchová & Hořák, en domaine public,
rendrait la toundra et la montagne aux 499 oiseaux d'Europe. C'est un complément, pas un
remplacement - et il romprait la règle de la source unique posée le 2026-09-30.

**À refaire quand** : si l'IUCN change ses conditions, ou si une source mondiale libre publie
des habitats avec une distinction adapté/marginal. Rien de tel n'existait au 2026-09-30.
