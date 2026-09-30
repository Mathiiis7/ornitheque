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

## Reprendre le travail

Mis en pause le 2026-09-30. Tout ce qui est installé et mesuré est ci-dessus ; la conversation
n'est plus nécessaire pour continuer.

**La seule chose en attente est le choix de l'allure.** Quatre candidates présentées à Mathis
ce jour-là, sans réponse :

| Candidate | Où la voir | Ce qu'elle vaut ici |
|---|---|---|
| **Celle de l'Ornithèque** (recommandée) | `.onetake/look-ornitheque.json` | Le film ressemble à l'appli. Contraste : PASS sur les quatre couleurs |
| `paper` | 1re case de la planche | Beaucoup d'air, mais neutre : ça pourrait être n'importe quel produit |
| `ember` | 6e case | La meilleure avec des photos d'oiseaux, mais elle renie le sarcelle de l'appli |
| `dusk` | 2e case | Les sonagrammes magenta y seraient superbes, mais l'appli est claire : le visiteur tombe de haut |

La planche des six préréglages : `.claude/skills/onetake/gallery/sheets/looks.png`.
La planche de contact des neuf prises : `.onetake/planche-refs.png`.

Les commandes, à relancer telles quelles (l'enrobage UTF-8 n'est pas optionnel) :

```
export PYTHONUTF8=1 PYTHONIOENCODING=utf-8
.onetake/venv/Scripts/python.exe tools/onetake/captures.py        # refaire les prises
.onetake/venv/Scripts/python.exe tools/onetake/planche-refs.py    # la planche de contact
```

Si `.claude/skills/onetake/` ou `.onetake/venv/` ont disparu (ils sont hors du dépôt), tout se
réinstalle avec le `git clone` et le `pip install` de la section « Ce qui est installé ».

## Ce qui reste à faire

1. **Choisir l'allure** - voir le tableau juste au-dessus.
2. **Écrire la feuille de plans** : `t · moment · ce qui bouge · ce qui est immobile · ce qui
   survit au passage`.
3. **Reconstruire les écrans en HTML** dans le repère des prises (3840×2160 à deux pixels par
   point, donc 1920×1080 utiles). C'est le gros du travail : le skill ne filme pas l'écran.
4. **Brouillon 1080p30**, passer l'oracle (`probe.py`, `verify_promo.py`), le faire valider.
5. **Rendu final 4K60.** Durée à mesurer avant de promettre : la documentation du skill donne
   0,2 s par capture et un exemple à 2 480 captures en 103 s sur 8 fils. Une vidéo de 30 s en
   4K60 fait 1 800 images, plusieurs captures chacune pour le flou.
6. **Version allégée pour le web**, son poids mesuré, exclue du cache hors ligne du service
   worker.
7. **Écran d'accueil** : image de couverture, lecture au clic, testé sur ordinateur et en
   largeur téléphone. Après la retouche d'`index.html` : `node tools/build/genere-demo.mjs`
   puis `node tools/verif/tous.mjs`.

## Ce qui est en suspens

- **La musique.** Libre de droits par défaut chez le skill (Pixabay, Free Music Archive). Rien
  n'est téléchargé : deux ou trois morceaux à proposer avec leur licence, et Mathis tranche.
- **Les photos d'oiseaux** viennent de Wikimedia et d'iNaturalist, sous leurs propres licences.
  L'appli les crédite à l'écran ; une vidéo qui les montre devra les créditer aussi, ou
  reconstruire le mur avec des vignettes floutées.
- **Une vidéo se démode.** La démo ne prend jamais de retard puisqu'elle fait tourner le vrai
  `app.js` ; une vidéo fige l'interface du jour. À refaire quand l'interface aura bougé.
- **Un défaut trouvé au passage, pas corrigé** : `_renderSpeciesMigrationCard()` (`app.js:12597`)
  n'est appelée par personne sauf par sa propre reprise. La carte de migration de la fiche
  d'espèce reste donc vide, et l'animation n'est atteignable que par le bouton « 🎞️ Animation ».
  Signalé le 2026-09-30, laissé en place : ça ne concerne pas la vidéo.
