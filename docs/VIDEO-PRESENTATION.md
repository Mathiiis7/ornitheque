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

## Ce qui reste à faire

1. **Choisir l'allure** : la planche des six préréglages est dans
   `.claude/skills/onetake/gallery/sheets/looks.png`, l'allure maison dans
   `.onetake/look-ornitheque.json`.
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
