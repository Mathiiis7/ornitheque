# La vidéo de présentation - où on en est

Film de 30 s montrant l'Ornithèque, destiné à l'écran d'accueil (la carte de connexion) et au
portfolio. Fabriqué avec le skill **onetake** (github.com/feitangyuan/onetake), installé le
2026-09-30. Ce document est le fil : il dit ce qui est décidé, ce qui est mesuré, et ce qui reste.

## Ce qui est installé, et où

```
.claude/skills/onetake/   le skill, 141 Mo, EXCLU du dépôt (.gitignore)
.onetake/venv/            les paquets Python, à l'écart du Python général
.onetake/refs/            les neuf prises de référence, EXCLU du dépôt
.onetake/profil/          le profil Chromium gardé entre deux séries de prises
.onetake/look-ornitheque.json   l'allure tirée de styles.css
tools/onetake/captures.py       le script des prises de référence (suivi par git)
tools/onetake/planche-refs.py   la planche de contact des neuf prises
```

Le skill est exclu du dépôt pour deux raisons : son poids, et sa licence PolyForm
Noncommercial, qui n'autorise pas n'importe quelle rediffusion. Il se réinstalle en une
commande :

```
git clone --depth 1 https://github.com/feitangyuan/onetake.git .claude/skills/onetake
```

**Versions vérifiées le 2026-09-30** : Python 3.14.7, ffmpeg 9.0.2, Node 24.15.0. Paquets :
playwright 1.63 (Chromium 153), numpy 2.5.3, scipy 1.18.1, Pillow 12.3.0, matplotlib 3.11.2,
opencv 5.0.0, plus **fonttools et brotli**, que le README du skill oublie mais que `look.py`
exige.

## Ce qui est tranché

| Décision | Choix | Quand |
|---|---|---|
| Découpage | Six moments, la migration en clou | 2026-09-30 |
| Fil conducteur | « Une carte devient un monde » | 2026-09-30 |
| Écran d'accueil | Image fixe, la vidéo se lance au clic | 2026-09-30 |
| Source des images | Le mode démo, jamais la vraie ligue | 2026-09-30 |
| Allure | Celle de l'Ornithèque, `.onetake/look-ornitheque.json` | 2026-09-30 |
| Définition finale | **1080p60** - aucune image agrandie, donc rien de flou | 2026-09-30 |
| Musique | **Nappe CC0 + vent dans les feuilles CC0**, aucun oiseau dedans | 2026-09-30 |

### Le découpage, avec ses durées

| Moment | Durée | Pourquoi ce temps |
|---|---|---|
| Le mur du Birdydex | 6 s | c'est l'identité de l'appli |
| La fiche d'espèce, le chant part | 5 s | le son devient un personnage |
| La migration, une année qui défile | 8 s | rien d'autre ne ressemble à ça |
| Classement et listes comparées | 4 s | on comprend que c'est à plusieurs |
| La carte de rareté | 2 s | les points se posent, on passe |
| Le quiz, puis le chat | 2 s + 2 s | l'appli est vivante |

### Le fil conducteur

Une seule carte du Birdydex, l'hirondelle rustique, se transforme en tout le reste : elle
grandit en fiche, sa photo porte le sonagramme, la carte de migration s'ouvre depuis la photo,
ses taches rouges se contractent en points sur la France, les points s'alignent en barres du
classement, la barre devient une bulle de chat puis l'onde du quiz, et tout se replie dans la
carte qui se pose en huppe du logo.

**Ce n'est pas un détail d'habillage, c'est la règle du skill.** Ses deux premiers films ont
été refusés parce que chaque moment remplaçait le précédent : « montrer un écran puis un autre
est un diaporama même si chaque écran bouge ». Son oracle mesure un *score de continuité* et
refuse en dessous de 0,5 : à chaque passage, quelque chose doit survivre à l'écran et bouger.
Il faut donc écrire, pour chaque passage, QUI survit.

Les autres contraintes de l'oracle, à tenir dès la feuille de plans :
- durées de plans variant d'un facteur 4 au moins (coefficient de variation ≥ 0,25) ;
- au moins un quart des images totalement immobiles, dont une plage d'au moins 1 s ;
- les repos sont immobiles POUR DE VRAI : un lent travelling pendant une pause compte comme
  du mouvement et fait échouer la mesure ;
- au-delà de 80 px par image, il faut un vrai flou de mouvement.

## Le mode démo tient la route : vérifié écran par écran

Ouvert et cliqué le 2026-09-30, sur http://localhost:8765/demo/. Les neuf prises sont dans
`.onetake/refs/`, la planche de contact dans `.onetake/planche-refs.png`.

- **Birdydex** : complet, 212/466, vraies photos.
- **Fiche d'espèce** : photo en vol, description, carte de France par présence, pastilles
  mensuelles.
- **Chant** : le lecteur ET son sonagramme (magenta sur noir, très photogénique).
- **Migration** : l'animation tourne, les PNG hebdomadaires arrivent du dépôt séparé
  `ornitheque-data`. **304 espèces** en ont une, dont l'hirondelle, la cigogne et la grue.
- **Carte de rareté** : les observations de la fausse ligue sur la France, légende 1 à 10.
- **Classement** : les cinq joueurs, et « Qui a vu quoi » qui EST la comparaison des listes.
- **Quiz** : l'accueil et une question en cours, avec ses quatre réponses.
- **Chat** : les six messages de la fausse ligue, avec réactions.

Deux conditions : la machine doit être **en ligne** (migration, photos, chants), et la
migration ne charge ses images **qu'une fois la lecture lancée** - sans le clic sur « Lire »,
la carte reste vide.

## Les pièges déjà payés sur ce film

**Les scripts du skill écrivent des caractères que la console Windows refuse.** Un simple
`--help` plantait sur une flèche `→` : `UnicodeEncodeError`, codec cp1252. Tout appel se fait
avec `PYTHONUTF8=1` et `PYTHONIOENCODING=utf-8`.

**xeno-canto ne répond pas à un navigateur invisible sans agent utilisateur ordinaire.**
L'appli basculait alors sur son recours iNaturalist, dont les enregistrements n'ont PAS de
sonagramme, et la prise annonçait « Pas de spectrogramme ». J'ai d'abord cru à un défaut de
l'appli : c'est le même mur anti-robot qu'eBird, décrit dans le skill `donnees-ebird`. Contrôle
fait à la source le 2026-09-30 : sur la requête exacte de l'appli (`gen:hirundo sp:rustica
type:song q:A`, 142 résultats), les huit premiers ont tous un sonagramme. L'appli va bien.

**Le filtre du Birdydex se restaure au premier rendu du panneau.** Le vider avant d'ouvrir
l'onglet ne sert à rien : le panneau réécrit sa recherche gardée. Comme le script laisse
« rustica » derrière lui, la série suivante photographiait un mur de deux cartes. On vide
APRÈS l'ouverture.

**Les vignettes du Birdydex sont en chargement différé.** Sans attendre qu'elles arrivent, on
photographie un mur de cases grises - et ça ne se voit pas dans le nom du fichier, seulement
dans son poids : 244 Ko sans les photos, 1,9 Mo avec. Le script attend 20 images chargées.

**`--resume` garde l'image abîmée par l'interruption.** Le rendu arrêté en cours laisse une
dernière image écrite à moitié ; la reprise la trouve sur le disque, la croit faite et ne la
refait pas. ffmpeg la refuse ensuite (« chunk too big »), sans que le rendu échoue : il annonce
900 images et le fichier n'en contient que **899**. Vu le 2026-09-30. Le contrôle qui l'attrape,
et qu'il faut faire après toute reprise :

```
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of default=nw=1 FICHIER.mp4
```

À la moindre image manquante, refaire le rendu sans `--resume` : **8 min 33 pour 900 images en
1080p30** sur 8 fils, mesuré le 2026-09-30 (3 200 captures). Une reprise qui ne refait qu'un
tiers du film ne coûte que 2 min 11 - d'où la tentation, et le piège.

**`look.py from-shot` se fait avoir par les photos.** Sur trois captures il proposait le bleu
ciel de la photo d'hirondelle (#5c8cf4, 3,57 % des pixels) comme couleur d'accent, quand le
sarcelle de l'appli n'en pesait que 0,20 %. L'allure de `.onetake/look-ornitheque.json` est donc
écrite à la main depuis `styles.css`, et passe le contrôle de contraste du skill : encre
14,80:1, gris 5,00:1, accent 4,47:1, second 3,80:1.

## La feuille de plans

Écrite le 2026-09-30. Trente secondes, huit sections, **aucune coupe franche** : chaque section
naît de la précédente. La colonne « ce qui survit » est la plus importante du tableau - c'est
elle que l'oracle mesure, et c'est elle qui décide si le film est un plan-séquence ou un
diaporama.

**L'ordre de deux moments a changé** par rapport au découpage validé : la rareté passe AVANT le
classement. Raison mécanique, pas éditoriale - les taches rouges de la carte de migration se
contractent naturellement en points sur la France, et les points s'alignent ensuite en barres
de classement. Dans l'autre sens il aurait fallu que des barres redeviennent des points, ce qui
ne se raccorde pas.

| t | Section | Ce qui bouge | Ce qui est immobile | Ce qui survit au passage |
|---|---|---|---|---|
| 0 – 2,0 | Le mur, pose | rien | **tout** (repos, 2,0 s) | - |
| 2,0 – 6,0 | Le mur, approche | la caméra pousse vers la carte de l'hirondelle ; le compteur 212/466 monte | le mur | **la carte de l'hirondelle** |
| 6,0 – 8,4 | La fiche s'ouvre | la carte grandit, sa photo devient l'en-tête de la fiche ; les panneaux s'assemblent autour | la photo, jamais recadrée | **la photo** |
| 8,4 – 9,0 | La fiche, pose | rien | tout (repos, 0,6 s) | la photo |
| 9,0 – 10,2 | Le chant | le bouton rond se pose sur la photo, le sonagramme se dessine de gauche à droite | la photo | **la photo** |
| 10,2 – 11,0 | Le chant, pose | rien | tout (repos, 0,8 s) | la photo |
| 11,0 – 12,2 | La carte s'ouvre | un iris s'ouvre depuis le centre de la photo ; le ciel bleu de la photo devient l'océan de la carte | - | **le bleu**, qui ne quitte pas l'écran |
| 12,2 – 17,4 | L'année défile | 52 semaines en 5,2 s : l'Europe rougit, se vide, l'Afrique se remplit | le cadre, la caméra ne bouge pas | **la tache rouge sur l'Europe** |
| 17,4 – 19,2 | Le pic, pose | rien | tout (repos, 1,8 s) | la tache rouge |
| 19,2 – 20,6 | La rareté | la tache se contracte sur la France et se résout en points colorés ; la légende 1-10 glisse | - | **les points** |
| 20,6 – 21,0 | Les points, pose | rien | tout (repos, 0,4 s) | les points |
| 21,0 – 24,2 | Le classement | les points montent et s'alignent en rangées ; les cinq nombres défilent jusqu'à 389, 318, 274, 212, 156 ; les coches de « Qui a vu quoi » traversent | - | **la rangée du haut** |
| 24,2 – 25,0 | Le classement, pose | rien | tout (repos, 0,8 s) | la rangée du haut |
| 25,0 – 26,5 | Le quiz | la rangée devient la barre de progression ; le bouton rond y atterrit ; quatre réponses se distribuent | - | **le bouton rond** |
| 26,5 – 27,0 | Le quiz, pose | rien | tout (repos, 0,5 s) | le bouton rond |
| 27,0 – 29,0 | Le chat | le bouton rond devient une bulle ; trois bulles montent | - | **une bulle** |
| 29,0 – 30,0 | Le logo | la bulle se replie en huppe ; le nom se pose | tout après 29,2 (repos, 0,8 s) | - |

**Les rimes de forme**, qui font tenir la chaîne sans rien inventer : le bouton rond de lecture
de la fiche et celui du quiz sont le MÊME objet dans l'appli ; le bleu du ciel de la photo
d'hirondelle et le bleu de l'océan de la carte de migration se ressemblent déjà. On s'en sert,
on ne les fabrique pas.

**Ce que ça doit donner, sur les mesures de l'oracle :**

| Mesure | Exigence | Ce que la feuille prévoit |
|---|---|---|
| Rapport entre le plus long et le plus court plan | ≥ 4× | 5,2 s contre 0,4 s, soit 13× |
| Variation des durées | ≥ 0,25 | 0,72 sur les 17 sections |
| Images totalement immobiles | ≥ 25 % | 7,7 s sur 30, soit 25,7 % |
| Une plage immobile d'au moins 1 s | oui | deux : 2,0 s et 1,8 s |
| Score de continuité | ≥ 0,5, idéalement ≥ 0,7 | sept passages, tous portés |

Les 25 % d'immobilité sont **tout juste atteints sur le papier**, à 0,7 point près, et la
mesure sera plus sévère que le calcul : l'oracle lit l'énergie sur une image réduite et
sur-réagit aux petits détails. Donc allonger les repos au premier passage du contrôle plutôt
que d'y croire d'avance. Et les repos sont immobiles POUR DE VRAI : un lent travelling pendant
une pause compte comme du mouvement, c'est ce qui a fait échouer un des films du skill.

## Changement de méthode : on filme le vrai site (2026-09-30)

La première version du film **redessinait** les écrans - c'est ce que fait le skill par défaut,
il ne filme pas l'écran. Mathis attendait l'inverse : une vidéo qui parcourt le site. Comparaison
faite écran par écran, la reconstruction perdait la barre de navigation, le champ de recherche,
les filtres, les pastilles de rareté, les codes d'espèces et, sur la fiche, ses trois onglets.
**On repart donc des vraies captures**, animées par le skill : ce qu'on voit est le site au
pixel près, et les enchaînements sont conservés.

### Les photos interdites : remplacées, pas évitées

Le mur du Birdydex ne pouvait pas être filmé tel quel. La réponse n'est pas de le reconstruire
mais de **remplacer les photos interdites par d'autres photos libres de la même espèce**, au
moment de la prise seulement - l'appli n'est pas touchée. Mesuré par
`tools/onetake/vignettes-libres.py` : **128 vignettes affichées, 58 compatibles, 70 à remplacer,
70 remplaçables.** Aucune exception.

**La règle de licence a d'abord été fausse, et c'était grave.** Elle acceptait CC BY-SA. Or le
chant d'hirondelle impose « pas d'usage commercial », et CC BY-SA **interdit d'ajouter cette
restriction** à une œuvre qui la reprend : les deux ne peuvent pas cohabiter. 29 vignettes de
plus étaient donc concernées, et le film serait parti en infraction sans que ça se voie. Les
licences acceptées sont désormais `cc0, pd, cc-by, cc-by-nc, cc-by-nc-sa` - ni BY-SA, ni BY-NC-ND
(qui interdit toute modification, or recadrer et animer en est une).

**Le choix automatique de la remplaçante ne vaut rien.** iNaturalist classe par votes, et un vote
récompense la photo remarquable, pas le portrait qui sert à reconnaître l'oiseau : il proposait un
canard domestique huppé pour le colvert, un troupeau de plusieurs milliers d'oiseaux pour la nette
rousse, une oie cendrée bec ouvert face caméra, un martinet posé sur la couverture d'un centre de
soins. Les **15 vignettes qui passent à l'écran** sont donc choisies à la main sur planches
(`portraits-planches.py`, puis `portraits-choix.py`), les 55 autres gardent le choix automatique.

Le critère retenu : le trait qui nomme l'espèce doit être visible - le collier de la tourterelle
turque, le tubercule du cygne, la huppe du fuligule morillon - et **toutes les vignettes à la même
distance de l'oiseau** : un gros plan de tête écrase ses voisines une fois recadré en carré.

**Deux pièges de source :** les catégories de Wikimedia Commons contiennent n'importe quoi - une
hirondelle rustique et deux graphiques dans celle du martinet noir, une page de texte scannée, des
cartes de répartition ; et l'inverse existe, la macreuse noire n'y a que du lointain en noir et
blanc quand iNaturalist a un portrait net.

### La fiche d'espèce

`tools/onetake/fiche-libre.py`. Photo servie le 2026-09-30 : **Ad Konings, iNaturalist, CC BY-NC**,
compatible, rien à remplacer - mais la vérification se refait **à chaque prise**, iNaturalist
changeant la photo par défaut d'une espèce d'un jour à l'autre.

Deux pièges payés ici :
- **le profil garde le dernier onglet visité.** La fiche s'ouvrait sur « Sons », et les deux prises
  sortaient identiques au bit près sans qu'une seule erreur n'apparaisse. On pose l'onglet voulu ;
- **la plus grande image de la page n'est pas l'oiseau, c'est le sonagramme de xeno-canto.** Le
  contrôle de licence portait donc sur le mauvais fichier, et concluait « inconnue ».

### L'espèce du film : la huppe fasciée

Changée le 2026-09-30, à la place de l'hirondelle rustique. C'est **l'oiseau du logo** : le film
se termine déjà sur une forme qui se replie en huppe, la boucle se ferme d'elle-même. Elle a tout
ce qu'il faut - carte de migration hebdomadaire (une des 304), chant au sonagramme régulier
(le « houp-houp-houp », Esperanza Poveda, Espagne), place dans le Birdydex de la démo.

**Sa photo servie par l'appli est en CC BY-SA, donc incompatible** : remplacée par celle de
Shantanu Kuveskar (Wikimedia, CC BY), choisie par Mathis parmi quatre. Elle est verticale
(750×1000) et la fiche affiche ses photos en `aspect-ratio:16/9` avec `object-fit:cover`
(`styles.css:1021`) : telle quelle, l'appli lui coupait la huppe et la queue.
`tools/onetake/photo-fiche.py` fabrique donc une image 16/9 qui contient l'oiseau **entier**, son
propre flou en fond - une modification que CC BY autorise, à condition de créditer.

**L'espèce du film n'était pas dans la mesure du mur**, donc son portrait choisi était ignoré, et
sa photo interdite se retrouvait à l'écran derrière l'écran de migration. `substituts.py` ajoute
désormais toute espèce choisie à la main, mesurée ou non.

### Les sept écrans, pris sur le vrai site

`mur-libre.py` (le mur), `fiche-libre.py` (la fiche, sa carte, ses sons), `prises-libres.py` (les
cinq autres : migration, carte de rareté, classement, quiz, tchat). **Chaque prise liste les
images qu'elle contient** - une image qu'on n'a pas vue est une licence qu'on n'a pas vérifiée.
Après correction, il ne reste dans les cinq derniers écrans que les tuiles OpenStreetMap (ODbL,
créditées dans le coin de la carte), les cartes eBird du dépôt `ornitheque-data` et notre logo.

**Le bloc « Où et quand la trouver » est pris deux fois** : une fois pour la France entière, une
fois **avec la Gironde sélectionnée**, pour que le film montre ce que le clic apporte - le détail
mois par mois d'une zone. Les zones de la carte ne portent pas leur nom, on les vise aussi par
leur code (`33`).

## Les licences, vérifiées à la source

Relevé le 2026-09-30 par `tools/onetake/credits.py`, qui remonte à l'origine de chaque image
réellement servie par l'appli. Le détail nominatif est dans [VIDEO-CREDITS.md](VIDEO-CREDITS.md),
régénéré par le script.

**Ce que ça change, et ce n'est pas un détail :**

1. **Le film portera CC BY-NC-SA**, parce que c'est la licence du chant que l'appli sert
   vraiment (Olivier SWIFT, xeno-canto 1149071, enregistré dans les Yvelines). Sur 300
   enregistrements d'hirondelle sondés, **deux seulement** échappent à la clause « pas
   d'usage commercial », et aucun à « partage à l'identique ». La clause non commerciale ne
   coûte rien de plus : le skill qui fabrique le film est lui-même non commercial.
2. **Quelques vignettes du Birdydex sont sous tous droits réservés** et sortent du film. Les
   afficher dans l'appli est un lien vers l'adresse d'origine ; les mettre dans un fichier
   vidéo en ferait une copie diffusée. Entre 20 et 25 vignettes sur 30 passent le contrôle
   selon les jours, et le script supprime les fichiers des autres.
3. **On ne peut donc PAS filmer la capture du mur du Birdydex.** Cette image contient les
   photos écartées. Le mur doit être reconstruit à partir des seules vignettes autorisées -
   ce qui reste fidèle, puisque l'appli n'affiche de photo que pour les espèces cochées et
   montre des silhouettes grises pour les autres.
4. **La photo de l'hirondelle passe** : Ad Konings, iNaturalist, CC BY-NC. Elle est créditée.
5. **Les cartes de migration** appartiennent au Cornell Lab (eBird Status & Trends), usage non
   commercial avec attribution, exactement comme dans l'appli.

**Un piège de méthode à connaître** : iNaturalist change la photo par défaut d'une espèce d'un
jour à l'autre. Le nombre de vignettes retenues varie donc d'une exécution à l'autre, et une
licence relevée aujourd'hui peut décrire une AUTRE photo demain. Le script compare l'identifiant
de la photo téléchargée à celui que l'API renvoie et écarte les désaccords. Conséquence
pratique : **relancer `credits.py` juste après `materiaux.py`, et construire le film à partir
de ce qui reste sur le disque**, jamais à partir d'une liste écrite à la main.

Première version du script : il cherchait l'identifiant de la photo parmi les douze
`taxon_photos` du taxon, n'en trouvait que quatre sur vingt-neuf, et déclarait les autres
« tous droits réservés ». Fausse alerte. Le bon appel est celui que fait l'appli elle-même,
`taxa/autocomplete` puis `default_photo` (`app.js:11987`), dont la réponse porte déjà la
licence et l'attribution.

## Où vivront les fichiers du film

Le skill fait copier `lib/motion.js` à côté de la composition. Ce fichier est à lui, sous
licence PolyForm Noncommercial, et le dépôt est public : il ne doit pas y entrer.

- `tools/onetake/film/comp.html` - **notre** travail, suivi par git ;
- `.onetake/film/` - le dossier de fabrication, hors dépôt, où sont copiés au moment du rendu
  la composition, `motion.js` du skill et le `look.js` fabriqué depuis l'allure.

## Le premier brouillon, et ce qu'il a appris

Rendu le 2026-09-30 en 1080p30 : 900 images, 2 002 captures sur 8 fils, **4 min 22 s**. Le
verdict de l'oracle est **PASS sur les huit critères** :

| Critère | Exigence | Mesuré |
|---|---|---|
| Variation des durées | ≥ 0,25 | **0,72** |
| Images immobiles | ≥ 25 % | **52 %**, plus longue plage 7,25 s |
| Salves | au moins une | **quatre** |
| Continuité | ≥ 0,5 | **1,00**, trois passages, aucun nu |
| Courbes | flou sous 80 px/image | pic **73 px/image**, obturateur 180° |
| Son | pas d'écrêtage | pic −8 dBFS, 0 écrêtage |

**Mais la carte d'énergie a montré ce qu'aucun critère n'attrape** : toute l'énergie dans les
douze premières secondes, presque rien après. Un film qui s'essouffle passe quand même tous
les contrôles.

La cause principale : les 52 semaines de migration **sautaient** d'une image à l'autre, donc
deux images sur trois étaient identiques pendant l'année - 3,4 s d'immobilité involontaire au
milieu du plus long moment du film. Elles s'enchaînent depuis en fondu. C'est un lissage
d'affichage entre deux mesures réelles, pas une donnée inventée.

Et quatre sections de la seconde moitié finissaient leur animation à mi-parcours en laissant
l'écran figé : le rassemblement des points, la pousse des barres, la distribution des réponses
du quiz et l'arrivée des bulles occupent maintenant toute leur durée.

## Le brouillon corrigé, et ce que la mesure a répondu

Rendu le 2026-09-30 à 16 h 12 : 900 images, **3 200 captures** (contre 2 002), 8 min 33 sur
8 fils. Verdict de l'oracle : **PASS sur les huit critères**, continuité 1,00, immobilité 51,9 %,
pic 73 px par image, son à −8 dBFS sans écrêtage.

**Mais la carte d'énergie est identique au caractère près à celle du premier brouillon.** Les
deux films ont été passés au même contrôle l'un après l'autre pour en être sûr : seules
l'immobilité (0,522 → 0,519) et le silence (0,788 → 0,791) bougent, de moins que le bruit de
mesure. Les corrections ont bien changé le film - 60 % de captures en plus, donc bien plus de
mouvement à l'intérieur des images, donc un flou plus juste - mais elles n'ont **rien
redistribué** : les quatre salves d'énergie restent toutes avant 12,2 s.

La planche de contact de la seconde moitié montre pourquoi, et ce n'est pas un défaut
d'animation : l'année de migration enchaîne des cartes du monde en fondu, et un fondu ne fait
bouger presque aucun pixel d'une image à l'autre, même quand l'image change beaucoup. Idem pour
les barres du classement et les bulles du chat, petits objets sur un grand cadre. **La mesure
d'énergie ne sait pas voir ça.** Deux moments restent malgré tout un peu nus à l'écran : les
points seuls sur fond blanc vers 22 s, et la première bulle du chat vers 27,5 s.

## Le son

`tools/onetake/partition.py`. Les instants ne sont pas recopiés à la main : ils sont lus dans
la composition par `window.__events()`, donc un moment déplacé emporte son bruitage avec lui.
Treize bruitages - souffle, bois, verre, grave, bulles - dans une seule réverbération, plus
**le chant de l'hirondelle** lui-même, celui que l'appli fait écouter. Le script cherche la
fenêtre la plus chantante de l'enregistrement de 39 s plutôt que d'en prendre le début, où il
n'y a souvent que du vent.

Les deux silences voulus sont vérifiés après coup : une traînée de réverbération peut les
remplir sans qu'on l'entende.

### La musique et le fond de forêt

Choisis le 2026-09-30 : une nappe très en retrait et du vent dans les feuilles en continu.
**Les deux sont en CC0** - domaine public, aucun crédit obligatoire, aucune contrainte sur la
licence du film.

| | Source | Fichier |
|---|---|---|
| Nappe | John Bartmann, *sweet-embrace-master* (4 min 04), Free Music Archive | `.onetake/musique/nappe-bartmann.mp3` |
| Feuilles | Borgory, *Soft Wind in the Trees - Leaves rustle* (2 min 27), Freesound | `.onetake/musique/feuilles-borgory.mp3` |

**Toute musique « forêt » n'est pas bonne à prendre** : la plupart contiennent déjà des chants
d'oiseaux, ce qui poserait une espèce quelconque à côté de l'hirondelle que l'appli fait
entendre. Écarté pour cette raison, et pour sa clause non commerciale : *Autumn Forest Wind*
d'Akacie. La règle vaut pour la suite : **aucun oiseau dans le fond sonore.**

**Deux pièges de téléchargement, payés le 2026-09-30 :**
- la page `/track/<nom>/download/` de FMA renvoie du HTML, pas un MP3. Le vrai fichier est dans
  le `data-track-info` de la page du morceau, champ `fileUrl`, sur `files.freemusicarchive.org` ;
- Freesound demande un compte pour le fichier d'origine, mais sert son écoute en MP3 152 kbps
  sans connexion (`cdn.freesound.org/previews/...-hq.mp3`). Largement assez pour un fond.

**Le dosage, mesuré et non estimé.** Sonies relevées avant mélange : bruitages −21,6 LUFS,
nappe −15,1, feuilles −37,1. Les deux fonds passent par `loudnorm` puis un gain fixe (−6 dB
pour la nappe, −15 dB pour les feuilles). Résultat : **−24,4 LUFS, crête −6,5 dBFS, aucun
écrêtage**, et le fond n'ajoute que 0,7 à 1 dB aux moments où le chant et les bruitages
parlent - il ne les couvre donc pas.

**Deux pièges de dosage :**
- `alimiter` remonte le niveau tout seul (`level` vaut `true` par défaut) : le premier mélange
  est ressorti à −0,4 dBFS au lieu d'être limité. Ne pas s'en servir comme d'une sécurité ;
- **un enregistrement de vent a des crêtes très hautes pour une sonie très basse.** Remonter
  les feuilles de +4 dB pour les rendre audibles amenait leurs rafales à −2,9 dBFS. C'est ce
  que `loudnorm` corrige et qu'un simple gain ne corrige pas.

**Et la sonie du mélange est PLUS BASSE que celle des bruitages seuls** (−24,4 contre −21,6),
ce qui n'est pas une erreur : la mesure EBU R128 écarte les passages trop faibles, et un fond
continu fait entrer dans le calcul tous les silences qui en étaient exclus. Ne pas chercher à
« rattraper » ce chiffre.

## Où reprendre : les cinq reproches du 2026-10-01

Le film remonté sur les vraies captures est rendu (`.onetake/captures.mp4`, 38 s, 1 140 images,
aucune erreur). Mathis l'a regardé. **Cinq reproches, et ils commandent la suite.**

**1. « C'est un diaporama, sans originalité ni animation, et on ne voit pas assez longtemps
chaque fonctionnalité. »** L'oracle disait exactement cela et je l'avais mal défendu : son
critère de continuité tombe à **0,00 sur 11 passages, aucun porteur**, là où il exige 0,5. Un
fondu entre deux captures cadrées sur le même objet ne suffit pas - ni pour la mesure, ni pour
l'œil. Ce qu'il faut : un vrai raccord, où l'objet garde sa taille et sa place d'une capture à
l'autre, et de l'animation à l'intérieur des plans plutôt qu'un simple zoom lent. Le zoom sur
la vignette est aussi trop faible : la vignette source ne fait que 231 px, un vrai raccord la
montrera molle une demi-seconde - c'est le prix, et il se décide.

**2. Aucun texte ne présente les parties.** Il attend ce que font les vidéos de présentation :
une phrase qui nomme la fonctionnalité et donne envie - « un catalogue des oiseaux du monde
entier », « des quiz sur les chants ». Le film actuel n'a que son logo final. C'est du texte
animé (kinetic type), et c'est justement ce que le skill sait faire.

**3. Les enchaînements ne sont pas fluides.** Même cause que le reproche 1 : un fondu de 0,45 s
entre deux images fixes n'est pas un mouvement, c'est un remplacement adouci.

**4. « Le skill n'est peut-être pas le bon outil ? »** Il l'est. Sa raison d'être est exactement
ce qui manque ici - texte animé, gestes qui déclenchent les réactions, mouvements qui se
portent d'un plan au suivant, flou de mouvement réel. **C'est moi qui l'ai employé comme un
diaporamateur** : des captures posées, une caméra qui zoome lentement, aucun de ses outils de
mouvement (ressorts, entrées, contacts, portés). La réponse n'est pas de changer d'outil, c'est
de s'en servir - et de relire `.claude/skills/onetake/` avant d'écrire la prochaine composition.

**5. La photo de la huppe n'est pas au format.** Elle ne remplit ni le cadre 16/9 de la fiche
(`tools/onetake/photo-fiche.py` la pose entière avec son propre flou en fond, donc deux bandes
floues sur les côtés), ni le carré de la vignette du Birdydex. Deux pistes : chercher une photo
de huppe **horizontale** parmi les candidates libres (`.onetake/candidats/upupa-epops-commons/`,
17 candidates), ou recadrer celle-ci sur l'oiseau au lieu de la letterboxer.

Tout le reste est en place et validé par lui : le mur filmable, les sept écrans, la Gironde
sélectionnée, les 52 semaines de migration, les 18 portraits choisis à la main.

## Reprendre le travail

Mis en pause le 2026-09-30, pendant le rendu du brouillon corrigé.

```
export PYTHONUTF8=1 PYTHONIOENCODING=utf-8
V=.onetake/venv/Scripts/python.exe

$V tools/onetake/assemble.py      # reunit comp, motion.js, donnees et allure
$V tools/onetake/partition.py     # refait le son
$V .claude/skills/onetake/scripts/render.py .onetake/film/comp.html \
     --out .onetake/brouillon.mp4 --sfx .onetake/film/son.wav
$V .claude/skills/onetake/scripts/verify_promo.py .onetake/brouillon.mp4 \
     --comp .onetake/film/comp.html \
     --shots 0,2.0,6.0,8.4,9.0,10.2,11.0,12.2,17.4,19.2,20.6,21.0,24.2,25.0,26.5,27.0,29.0
```

Ajouter `--resume` au rendu s'il a été interrompu : les images déjà faites sont gardées dans
`.onetake/_frames`. **Compter les images du fichier obtenu après toute reprise** - voir le
piège plus haut, la reprise garde l'image à moitié écrite par l'interruption. Pour refaire les matériaux depuis zéro, dans cet ordre :
`captures.py`, `materiaux.py`, **`credits.py`** (il écarte les images non libres), `decoupes.py`.

Si `.claude/skills/onetake/` ou `.onetake/venv/` ont disparu (ils sont hors du dépôt), tout se
réinstalle avec le `git clone` et le `pip install` de la section « Ce qui est installé ».

**Le serveur local doit répondre sur `127.0.0.1`, pas `localhost`** : `http-server` n'écoute
qu'en IPv4, et `localhost` se résout en IPv6 ici. Le navigateur invisible échouait en
`ERR_CONNECTION_REFUSED` alors que la page s'ouvrait très bien à la main.

### Ce qui reste

1. Refaire le rendu du brouillon corrigé, revérifier la carte d'énergie, **le faire valider**.
2. La musique : **ambiance discrète et atmosphérique**, tranché le 2026-09-30. Rien n'est
   encore téléchargé : deux ou trois morceaux à proposer avec leur licence, qui doit être
   compatible CC BY-NC-SA (donc jamais un « ND », pas de modification interdite).
3. Le rendu final **en 1080p60**, tranché le 2026-09-30 : la plus grande image du film fait
   1 506 px et les cartes de migration 500 px, un 4K les aurait agrandies de 3 à 8 fois.
   1 800 images au lieu de 900, prévoir environ le double du temps du brouillon.
4. La version allégée pour le web, son poids mesuré, exclue du cache hors ligne.
5. L'écran d'accueil : image de couverture, lecture au clic, testé sur ordinateur et en
   largeur téléphone. Puis `node tools/build/genere-demo.mjs` et `node tools/verif/tous.mjs`.

## Ce qui reste à faire

1. **Choisir l'allure** - voir le tableau juste au-dessus.
2. **Écrire la feuille de plans** : `t · moment · ce qui bouge · ce qui est immobile · ce qui
   survit au passage`.
3. **Reconstruire les écrans en HTML** dans le repère des prises (3840×2160 à deux pixels par
   point, donc 1920×1080 utiles). C'est le gros du travail : le skill ne filme pas l'écran.
4. **Brouillon 1080p30**, passer l'oracle (`probe.py`, `verify_promo.py`), le faire valider.
5. **Rendu final 1080p60** (le 4K est écarté, voir « Ce qui est tranché »). Durée à mesurer
   avant de promettre : la documentation du skill donne 0,2 s par capture et un exemple à
   2 480 captures en 103 s sur 8 fils. Une vidéo de 30 s à 60 images par seconde en fait
   1 800, plusieurs captures chacune pour le flou.
6. **Version allégée pour le web**, son poids mesuré, exclue du cache hors ligne du service
   worker.
7. **Écran d'accueil** : image de couverture, lecture au clic, testé sur ordinateur et en
   largeur téléphone. Après la retouche d'`index.html` : `node tools/build/genere-demo.mjs`
   puis `node tools/verif/tous.mjs`.

## Ce qui est en suspens

- **La musique est réglée** - voir « La musique et le fond de forêt ». Reste l'écoute de
  Mathis sur le mélange, et le choix de la fenêtre de 30 s prise dans la nappe (actuellement
  de 40 s à 70 s du morceau, choisie pour éviter l'introduction, pas pour ce qu'elle raconte).
- **Les photos d'oiseaux** viennent de Wikimedia et d'iNaturalist, sous leurs propres licences.
  L'appli les crédite à l'écran ; une vidéo qui les montre devra les créditer aussi, ou
  reconstruire le mur avec des vignettes floutées.
- **Une vidéo se démode.** La démo ne prend jamais de retard puisqu'elle fait tourner le vrai
  `app.js` ; une vidéo fige l'interface du jour. À refaire quand l'interface aura bougé.
- **Un défaut trouvé au passage, pas corrigé** : `_renderSpeciesMigrationCard()` (`app.js:12597`)
  n'est appelée par personne sauf par sa propre reprise. La carte de migration de la fiche
  d'espèce reste donc vide, et l'animation n'est atteignable que par le bouton « 🎞️ Animation ».
  Signalé le 2026-09-30, laissé en place : ça ne concerne pas la vidéo.
