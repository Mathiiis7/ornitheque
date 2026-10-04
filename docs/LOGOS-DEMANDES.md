# Le logo, avec Arrow 2 (QuiverAI)

Document de travail, 2026-09-28. À supprimer une fois le logo arrêté.
Le choix du nom est dans `NOMS.md`, l'outil et ses prix dans
`~/Documents/0-Claude/0-QG/qg/savoir/quiver-ai.md`.

**Où on en est au 29/09** : onze envois, le style est trouvé, **deux pistes sont retenues sur la
forme**, et **le nom est arrêté - L'Ornithèque**, audité et clos dans `NOMS.md` le 29/09.

Ce que le nom change ici : **l'espèce du logo est libre.** Ornithèque ne désigne pas un oiseau
mais une collection, donc rien n'impose la huppe - elle reste légitime, c'est celle que le
groupe connaît, mais n'importe quelle espèce conviendrait. C'est le point 0 de « Reste à faire »
qui devient la seule question ouverte du dessin.

| Retenu | Fichier | Réserve |
|---|---|---|
| L'oiseau plat | `assets/logos/candidats/1-oiseau-plat.png` | l'espèce n'est pas arrêtée, et l'image vient de la planche Freepik : bonne pour comparer, pas pour devenir le logo |
| La tête sarcelle sur tuile claire | `assets/logos/candidats/3-tete-sarcelle-clair.png` | ce ne sont pas les vraies couleurs de la huppe, et c'est la moins contrastée des tuiles |

## Le banc d'essai des logos, en local

Depose des images dans `assets/logos/candidats/`, recharge **deux fois** localhost:8765, et
clique sur le bouton en bas à gauche : il fait défiler les candidats dans **tous** les
emplacements à la fois - entête, écran d'attente, écran de connexion, favicon. Il ne s'affiche
que sur localhost, et il est marqué `BANC_LOGOS` dans `app.js`, à retirer quand le logo sera
arrêté.

Deux outils l'accompagnent, tous deux sans aucune dépendance :

- `outils/build/prepare-logo.mjs` - enlève un fond uni, recadre, pose sur une tuile arrondie,
  et peut **remplacer des couleurs** (`--palette "#C05E33>#0B7C77"`), ce qui permet d'accorder
  une image à la palette du site sans rien regénérer.
- `outils/build/icones-logo.mjs` - refabrique les icônes 192 et 512 du manifeste.

## Réglages, à chaque envoi

Arrow 2, effort **Medium**, **4 propositions**. Ne changer qu'une chose à la fois.

## Le style retenu : l'oiseau simple en formes primitives

Six ou sept formes, pas quarante facettes. La construction est toujours la même d'un oiseau à
l'autre - c'est elle qui fera plus tard la **famille d'icônes**, un oiseau par espèce :

- le corps est **une seule goutte arrondie**, tête comprise, sans cou
- l'aile est **une feuille posée dessus**, dans un ton plus soutenu
- la queue est **deux ou trois triangles** qui montent vers l'arrière
- le bec est **un triangle**, l'œil **un disque blanc à point noir**
- les pattes sont **deux bâtons fins** à trois doigts
- couleurs franches, aucun contour, aucun dégradé, aucune ombre

**La règle ajoutée par Mathis** : dans la planche de référence, les six oiseaux ont le même
corps, donc aucun n'est identifiable - défaut rédhibitoire pour un site d'observation. Donc
**construction identique, mais proportions fidèles à l'espèce**. C'est la règle de Charley
Harper : formes très simples, espèce juste.

## La règle de cadrage pour l'icône de l'appli

Trouvée le 28/09 sur une icône que Mathis aime : un geai en gros plan dans une tuile carrée.
**L'oiseau n'est pas centré avec de la marge, il est coupé par le cadre** - le bec sort d'un
côté, la nuque en bas. C'est ce débordement qui donne la fluidité et l'impression que l'image
continue derrière la tuile.

Ça contredit la consigne « even padding on all four sides » utilisée dans tous les envois
précédents, et ça règle le défaut du fond blanc : sur une tuile, **on veut un fond**.

## La demande à envoyer - version icône carrée

```text
Square app icon of a hoopoe bird, seen in close-up, head and upper chest only,
in profile facing right.

FRAMING: this is an app tile, not a logo floating on a page. The bird is zoomed
in and CROPPED by the square frame - the tip of the bill runs off the right
edge, the chest and the back of the neck run off the bottom edge. The head fills
most of the tile. No margin, no padding, no empty border: the bird bleeds off
the edges on at least two sides.

SUBJECT: a hoopoe - cinnamon head, a tall fan-shaped crest of tapering feathers
with black tips, a long slightly down-curved black bill, a small round eye.

STYLE: simple flat vector illustration, friendly, built from a few primitive
rounded shapes. Flat areas of solid colour, hard clean edges, no outlines, no
gradients, no shading, no texture. Twelve shapes in total, no more.
ACCURACY: simple shapes, but the proportions follow the real species - the
length and curve of the bill, the height of the crest. A bird a birder would
name at a glance, never a generic round bird.
PALETTE: #EEF2F1 pale sage for the tile background, #C05E33 cinnamon for the
head and crest, #9E4523 deep cinnamon as a second tone, #15201E black for the
bill and the crest tips, #F0EEE6 off-white for the throat.
COMPOSITION: a full-bleed square tile - the background colour fills the entire
canvas edge to edge, with the bird cropped by it.
VARIATIONS: make the four proposals genuinely different from one another - vary
which edges the bird runs off, how close the crop is, and where the head sits in
the tile. Do not return four versions of the same drawing.
AVOID: outlines, contour lines, gradients, shading, drop shadows, texture, text,
words, letters, numbers, signatures, a white margin around the bird, a rounded
corner drawn inside the canvas, the whole bird seen at a distance.
```

## L'autre demande - le gabarit de la planche, repris tel quel

Test demandé par Mathis : reprendre **exactement le format de sa planche de référence** - même
gabarit, même taille dans le cadre - quitte à ce que les proportions soient fausses pour
l'espèce. C'est l'inverse exact de la règle de justesse écrite plus haut, et c'est voulu : ce
test tranchera entre « joli » et « juste ».

```text
Simple flat vector illustration of a hoopoe bird, standing in strict side
profile, facing right.

SUBJECT: a hoopoe - a cinnamon bird with a tall fan-shaped crest, a long
slightly down-curved bill, and boldly black-and-white banded wings and tail.

STYLE: simple flat vector bird, friendly and slightly naive, built from a few
primitive shapes and nothing more: one rounded teardrop for the whole body and
head with no neck, one leaf-shaped wing laid on top of it in a deeper tone, two
or three straight-edged triangles fanning up and back for the tail, one long
tapering triangle for the bill, a row of short triangles for the crest, two thin
straight legs with three simple toes. The eye is a small white circle with a
dark dot inside it. Flat areas of solid colour, hard clean edges, no outlines,
no gradients, no shading, no texture. Ten shapes in total, no more.
TEMPLATE, to follow exactly: the body is one plump oval, twice as wide as it is
tall, with the head merged into it at the upper left and no neck at all. The
wing is one large leaf shape laid across the middle of the body, its point
sweeping down and back. The tail is two or three straight-edged triangles
fanning UP and back from the rear of the body, higher than the head. The legs
are two short thin straight lines dropping from the belly, each ending in three
tiny toes. The whole bird stands on an invisible line and takes up two thirds of
the width of the canvas.
ACCURACY: species accuracy is NOT required here - keep the template exactly as
described even where a real hoopoe is shaped differently. Only the hoopoe's
signature marks carry over: the fan crest with black tips, the long bill, the
black and off-white bands.
PALETTE: four colours only - #C05E33 cinnamon for the body and crest, #9E4523
deep cinnamon for the wing, #15201E black for the bill, the crest tips and the
dark bands, #F0EEE6 off-white for the pale bands. Fully transparent background -
no background rectangle, no filled square, nothing behind the bird.
COMPOSITION: square canvas, bird centred, even padding on all four sides.
VARIATIONS: make the four proposals genuinely different from one another - vary
the bulk of the body, the spread of the crest, the angle of the tail and how the
bands are placed. Do not return four versions of the same drawing.
AVOID: outlines, contour lines, gradients, shading, drop shadows, texture, text,
words, letters, numbers, signatures, realistic feather detail, facets, small
decorative details, a branch, any filled background.
```

**Pour retoucher** plutôt que relancer, dès qu'une proposition est presque bonne :
« Change only [un élément] to [nouvelle consigne]. Keep the silhouette, the colours and the
composition exactly as they are. »

## Ce qu'on a appris, et qui coûte cher à réapprendre

**Décrire une forme ne suffit pas, il faut décrire un style.** Les trois premiers envois
disaient « un rond, un bec, un œil creusé » : des logos propres et sans aucune identité.

**Une contrainte de favicon écrite dans la demande produit un logo plat.** « Au plus six
formes », « lisible à 16 pixels » ont aplati tous les premiers essais. Dessiner riche,
simplifier ensuite à la main.

**Quatre propositions ne sont pas quatre idées.** Sans consigne, elles sont quasi identiques.
Le bloc `VARIATIONS` de la demande ci-dessus les a vraiment séparées - mais seulement quand la
demande laisse de quoi varier.

**Le fond transparent n'est pas respecté** : jusqu'à 3 propositions sur 4 arrivent avec un fond
blanc plein, malgré la consigne écrite deux fois. À vérifier à chaque export.

**Les couleurs imposées en hexadécimal, elles, sont très bien suivies.**

**Le prix suit la complexité de l'image, pas le niveau d'effort.** Même en Medium : 0,205 $ pour
une tête simple, 0,45 $ pour une illustration à facettes. En High : 0,325 $ pour un emblème
plat, 1,02 $ pour un corps entier en dégradés.

## Les prix mesurés, en pourcentage de la semaine (100 % = 5 $)

| Envoi | Effort | Restant avant → après | Coût |
|---|---|---|---|
| 2 - Ornithèque, la thèque | Low | 84,7 → 82,3 % | 0,12 $ |
| 1 et 3 - le O, puis la huppe | Low | 82,3 → 77,6 % | 0,235 $, soit 0,12 $ l'envoi |
| 4 - la huppe détaillée en couleurs | Medium | 77,6 → 73,5 % | 0,205 $ |
| 5 - mascotte rétro | High | 73,5 → 67 % | 0,325 $ |
| 6 - mascotte en volume et dégradés | High | 67 → 46,5 % | **1,02 $** |
| 7 et 8 - profil complet, puis tête seule | Medium | 46,5 → 28,5 % | 0,90 $, soit 0,45 $ l'envoi |
| 9 - la huppe en formes primitives | Medium | 28,5 → 21,6 % | 0,345 $ |
| 10 et 11 - le gabarit de la planche, puis la tuile carrée | Medium | 21,6 → 5,1 % | 0,825 $, soit 0,41 $ l'envoi |

Total de la session : **3,09 $ pour onze envois**, soit 44 propositions. Il restait 5,1 % de la
semaine, soit 0,26 $ - moins qu'un envoi. Remise à zéro le 3 octobre.

**Le meilleur résultat de la session : la tuile carrée (envoi 11).** Gros plan de la tête coupé
par le cadre, crête débordant en haut, bec sortant à droite, gorge crème pour le contraste.
Lisible en petit, identifiable comme une huppe, et sans air de banque d'images. Le gabarit de
la planche (envoi 10) marche aussi, mais il fait illustration plus qu'identité.

**Estimer le prix d'un envoi à l'avance ne marche pas.** J'avais annoncé 0,2 $ pour l'envoi 9
parce que la demande limitait à dix formes : il en a coûté 0,345 $. Le compte des formes ne
prédit pas le nombre de jetons écrits. Annoncer une fourchette, jamais un chiffre.

**Et le bloc VARIATIONS s'épuise quand la demande est trop précise** : sur l'envoi 9, qui décrit
la construction forme par forme, les quatre propositions étaient de nouveau très proches.

## Les styles écartés, et pourquoi

| Style | Verdict de Mathis |
|---|---|
| Aplat minimal, silhouette propre (envois 1 à 3) | « hyper basique », « simpliste » |
| Tête détaillée en couleurs vraies (envoi 4) | « déjà mieux », mais pas l'identité |
| Mascotte sportive rétro (envoi 5) | « une marque de vêtements », pas de l'observation |
| Mascotte en volume et dégradés (envoi 6) | « ça colle pas à l'ADN du site » |
| Trait continu minimal | écarté sur images de référence, sans envoi |
| Gravure naturaliste du XIXe | écarté sur images de référence, sans envoi |
| Géométrie taillée à facettes (envois 7 et 8) | trop savant ; « ça correspondrait pas au site » |

**Ce que l'appli dit d'elle-même** (regardée sur localhost:8765 le 28/09) : fond vert-gris très
clair, cartes blanches arrondies, ombres presque invisibles, titres en serif de livre, noms
scientifiques en italique, une seule couleur forte par petites touches. Nulle part un gros
aplat ni un contraste violent. **L'identité du site est faite de retenue** - c'est pour cela
que les deux mascottes sonnaient faux.

**Les banques d'images gratuites** (Freepik, devenu Magnific) : leurs conditions interdisent
d'en faire une marque et de les donner à une IA. On les regarde, on décrit le style en mots,
on n'envoie jamais l'image.

## Reste à faire

0. **Choisir l'espèce de l'oiseau plat.** C'est la seule inconnue de la piste n° 1, et elle ne
   coûte rien à trancher : le style est écrit, le sujet se change en un mot dans la demande.
1. ~~Arrêter le nom~~ - **fait le 29/09 : L'Ornithèque.**
2. Choisir une proposition, la retoucher par petites demandes ciblées.
3. Nettoyer le SVG, vérifier le fond transparent, le passer au banc des 16 pixels.
4. Le brancher dans `manifest.json`, le favicon, l'écran d'accueil, l'entête et la démo.
5. Décliner la famille d'icônes avec le même bloc de style, un oiseau par espèce.
