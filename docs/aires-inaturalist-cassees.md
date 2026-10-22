# Aires iNaturalist cassées (2026-10-22)

Les aires « estimées » d'iNaturalist (Open Range Map, Geomodel 2.34, CC BY) servent deux fois dans les
cartes : la teinte bleue sous la carte de la fiche, et le garde-fou des observations isolées. Une aire
n'est crue que si 80 % des cases colorées de notre carte tombent dedans. Sur les 6 981 aires, 1 406 sont
refusées. Ce rapport dit pourquoi une partie d'entre elles l'est, et comment les récupérer.

## Ce qui est cassé

**Dans le fichier publié par iNaturalist, le grand morceau de l'aire manque pour les oiseaux dont l'aire
traverse le 180e méridien** (la ligne de changement de date, dans le Pacifique, entre la Sibérie et
l'Alaska). Il ne reste que des bouts. Pour la Pie bavarde, 90 bouts, le plus grand de 13 degrés carrés,
en Islande, en Alaska, à Madère : 0 % de nos cases dedans. Le fichier par espèce a le même défaut, et
notre lecture n'y est pour rien (une seule fiche par espèce, tous les morceaux lus).

- **118 espèces refusées ont moins de 20 % de nos cases dans leur aire**, dont 74 touchent le 180e
  méridien. Parmi elles, beaucoup des oiseaux les plus courants de France : Hirondelle rustique, Pigeon
  biset, Moineau domestique, Canard colvert, Bergeronnette grise, Coucou gris, Pie bavarde, Mouette
  rieuse, Alouette des champs, Pic épeiche, Tarin des aulnes, Sittelle torchepot, Bouvreuil pivoine.
- **12 aires couvrent presque la planète** (un polygone de plus de 20 000 degrés carrés, celui du
  Faucon pèlerin va d'un pôle à l'autre) : Faucon pèlerin, Balbuzard pêcheur, Hirondelle de rivage,
  Phalarope à bec étroit, Sterne arctique, Mouette tridactyle...
- Les 1 288 autres refusées ont au moins 20 % de nos cases dedans. Leur cause n'est pas étudiée ici
  (sans doute des espèces découpées autrement, ou des aires plus étroites que nos cartes).

Mesures : `notes-privees/essai-cartes/inat-aires/compter-cassees.mjs` (sortie `cassees.json`).

## Les tuiles du site iNaturalist sont intactes

Le site affiche l'« aire attendue » en tuiles d'image, calculées à part du fichier
(`api.inaturalist.org/v2/geomodel/<taxon>/<zoom>/<x>/<y>.png?thresholded=true`). Seize tuiles de
zoom 2 par espèce suffisent pour notre grille de 0,25°. Essai sur quatre espèces
(`notes-privees/essai-cartes/inat-aires/tuiles-aire.mjs`, 64 tuiles, une par seconde) :

| Espèce | Nos cases dans l'aire, tuiles | Nos cases dans l'aire, fichier |
|---|---|---|
| Pie bavarde | 99,2 % | 0 % |
| Hirondelle rustique | 99,0 % | 1,0 % |
| Pic épeiche | 99,4 % | 0,2 % |
| Huppe fasciée (témoin, fichier sain) | 99,6 % | 99,4 % |

Pour la Huppe, toutes les cases du fichier sont dans l'aire des tuiles, qui est 3 % plus large (le
contour des hexagones dessinés). Pour la Pie, les bouts du fichier sont tous dans l'aire des tuiles :
c'est la même aire, sans son grand morceau.

**Conditions d'iNaturalist** (lues sur `api.inaturalist.org/v1/swagger.json`) : au plus 60 requêtes
par minute et 10 000 par jour, et l'interface « sert à développer des applications, pas à moissonner
des données ». Les aires elles-mêmes sont sous CC BY.

## Goéland argenté : les cases retirées étaient bien fausses

Le garde-fou lui retire 315 cases au Japon, au Kamtchatka et au large de la côte est des États-Unis.
La liste d'espèces de l'appli (eBird) sépare le Goéland hudsonien (*Larus smithsonianus*) et le Goéland
de la Vega (*Larus vegae*) du Goéland argenté, et iNaturalist aussi. Ces cases viennent de bases qui les
notent encore « *Larus argentatus* » : les retirer est juste. Les deux autres goélands ont leur carte.

## Fait le 2026-10-22 (accord de Mathis) : 153 espèces reprises par les tuiles

Les espèces refusées qui ont moins de 20 % de nos cases dedans ou touchent le 180e méridien :
2 448 tuiles, 81 min (`recuperer-tuiles.mjs`, liste dans `aires-tuiles.json`). Pas pour toutes les
espèces : 112 000 tuiles, 12 jours au plafond d'iNaturalist, et le fichier est juste pour les autres.

- **Lecture** (`outils/build/aires-inat.mjs`, `aireTuiles`) : une case est dans l'aire si le pixel de
  son centre a un alpha d'au moins 96 (intérieur des hexagones ~104, bord flou en dessous). Sur la
  Huppe, au fichier sain : 121 946 cases contre 122 408, 99 % en commun.
- **Règle des 80 %** inchangée : 96 de ces espèces ont désormais une aire crue (dont Pie bavarde
  98,6 %, Hirondelle rustique 98,3 %, Canard colvert, Coucou gris, Alouette des champs). Les 51
  autres restent refusées : surtout de petits oiseaux d'îles du Pacifique, dont l'aire touche le
  180e méridien sans être cassée. Le Coq bankiva est refusé comme « partout » (sans doute la poule
  domestique, comptée avec lui chez iNaturalist).
- **Teintes** : 5 598 espèces (5 507 avant). **Garde-fou** : 372 cases retirées à 52 de ces
  espèces (Pie 17 sur 3 541 ajoutées, Hirondelle 10 sur 4 149) ; sur toutes les cartes, 347 cases
  de moins, aucune espèce ne perd plus de 1 %.
- **Limite** : le crédit dit « Geomodel 2.34 » ; les tuiles viennent du modèle en service sur le
  site le 2026-10-22, dont la version n'est pas affichée.

Signaler le défaut à iNaturalist (message de Mathis sur leur forum) reste possible : un fichier
corrigé rendrait les tuiles inutiles.
