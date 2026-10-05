# Le logo et la mascotte, avec Arrow 2

Arrow 2 : https://app.quiver.ai. Document de travail, à supprimer une fois le logo arrêté.

---

## ▶ À ENVOYER : les jumelles devant les yeux (derniers crédits)

**Le martin Figma du logo est LA base** (décidé le 2026-10-05). Les poses qui ne demandent qu'un
objet en plus se font sans Arrow, par-dessus son dessin : `outils/build/pose-jumelles.mjs` (jumelles
pendues au cou). Arrow ne sert qu'aux poses qui obligent à redessiner l'aile ou le corps.

**Premier essai raté (2026-10-05, poisson dans le bec)** : Arrow a redessiné un autre oiseau (petite
tête, petit œil, bec vers le bas, posture droite, orange plus vif, joue orange inventée). Deux causes :
« draw the same bird in a new pose » lui laisse tout refaire, et la description jointe était fausse
(joue orange et moustache, que le martin de Mathis n'a pas). D'où cette demande : on lui fait
MODIFIER l'image, on décrit l'oiseau tel qu'il est, et on liste ce qu'il n'a pas le droit de toucher.

Réglages : **Arrow 2, effort High, 4 propositions.** Prix attendu : 0,40 à 1,20 $.

1. Nouvelle demande. Joindre `assets/logos/sources/martin-figma.svg`.
2. Copier-coller ce texte :

```text
Edit the attached illustration. This is an existing character and it must
stay recognisably the SAME drawing: copy its shapes, do not redraw it in
your own style. Change ONLY what is listed under "THE CHANGE".

THE CHARACTER AS IT IS (do not alter): a kingfisher seen from the side,
facing right, body leaning diagonally, head large and round. Crown and back
teal #0B8282 covered with small light-teal #29C2BD dash-shaped dots. A BIG
eye: white disc #FFFFFF with a large black pupil #120D0A and one small white
highlight. A small orange #DD7E35 stripe running under the eye and a small
orange spot in front of it. A cream #FAECC5 patch on the throat and on the
side of the neck. A LONG, STRAIGHT, dark-grey #364042 bill pointing
horizontally to the right, as long as the head is wide. Breast and belly
orange #DD7E35. Wing teal #0B8282 with light-teal #29C2BD dots and a
lighter #20B8AA / #12B2A5 leading edge. Short dark-teal tail pointing down
to the left. Short vermilion #C8452B legs with thin toes.

THE CHANGE: the bird looks through a small pair of dark-grey #364042
binoculars. The near wing is raised and bent forward to hold the
binoculars against the eye, the wingtip wrapped around them like a hand.
The binoculars cover the eye; the bill stays fully visible, still long and
horizontal, passing just below the binoculars. Everything else - head
shape, crown dots, cream throat, orange breast, tail, legs, posture - stays
exactly as in the attached file.

DO NOT: shrink the head, shorten or tilt the bill, add an orange cheek
patch, add a moustache stripe, brighten the orange, straighten the
posture, add outlines, gradients, shading, text, a branch or a background.
No gaps between shapes. Transparent background.
VARIATIONS: four proposals; vary only how the wing holds the binoculars.
```

Si le résultat garde bien l'oiseau, les autres poses qui touchent au corps (vol, plongée) se
demandent avec le même texte, en ne changeant que le paragraphe « THE CHANGE ».

### Plus tard - la tuile du logo (après validation du perché)

1. Joindre le fichier : `notes-privees/mascotte/mascotte-tuile.svg`
2. Copier-coller ce texte :

```text
Redraw this square app tile of a kingfisher head, keeping the same crop, the
same profile facing right, the same long black bill running off the right edge
and the same palette. This is a clean-up pass, not a new design.

FIX: no gaps between shapes, adjacent colour areas meet exactly or overlap;
smooth, confident joins between the crown, the orange cheek, the white neck
patch and the throat; the eye a clean white circle with a black dot.
SPECIES ACCURACY (adult male common kingfisher): the bill ENTIRELY black; a
small orange spot between the bill and the eye; the orange ear patch behind
the eye bordered below by a teal moustache stripe; a white patch on the side
of the neck; a white throat; a plain teal crown. No dots, no speckles, no
feather lines.
KEEP: flat vector, solid colours, no outlines, no gradients, no shading, no
text, white #FFFFFF tile background filling the whole square, no rounded
corners drawn inside the canvas. Palette exactly: #0B7C77, #2BBCB0, #C05E33,
#F0EEE6, #15201E.
VARIATIONS: four proposals, vary only the joins and the exact crop.
```

### Ensuite

Me rapporter les meilleures propositions (fichiers SVG dans Téléchargements). Pour retoucher une
proposition presque bonne plutôt que relancer :
« Change only [un élément] to [nouvelle consigne]. Keep the silhouette, the colours and the
composition exactly as they are. »

---

## Le reste du document (pour moi, pas besoin de le lire)

1. Où on en est
2. Le martin-pêcheur : ce que disent les sources
3. Quand une image revient
4. Le style retenu
5. Ce qu'on a appris
6. Archives : la première planche, et la session huppe du 28-29/09

L'outil et ses prix : `~/Documents/0-Claude/0-QG/qg/savoir/quiver-ai.md`. Le nom : `NOMS.md`.

---

## 1. Où on en est

| Quoi | État |
|---|---|
| Nom | **L'Ornithèque**, arrêté le 29/09 (`NOMS.md`) |
| Style | trouvé : l'oiseau simple en formes primitives (section 4) |
| Espèce | **le martin-pêcheur mâle**, choisi le 2026-10-05 |
| Premier envoi | fait : poses de la planche 4 et tuile de la planche 3 retenues, assemblées et recalées sur la charte par `outils/build/mascotte.mjs` |
| Retouche High n° 3 | `notes-privees/mascotte/retouche-3.svg`, 9 poses. Réussis : même oiseau partout, tête lisse, carnet, perché, casque. Ratés : vol sans bec ni œil, poisson tenu par les pattes, perplexe à deux yeux du même côté, content avec un bâton, jumelles non tenues, pattes de la plongée flottantes, reflet dans l'œil. Retouche n° 4 : corrections ciblées, les poses réussies figées |
| Retouche High n° 2 | `notes-privees/mascotte/retouche-2.svg`, bien meilleure (plus de points, même oiseau, jumelles du bout des ailes). Restait : ailes en vol trop grises, aile basse et gros ventre de l'oiseau au carnet, nuque en dents de scie, raccords nuque/dos, pattes de la plongée détachées. Retouche n° 3 : ces corrections + 4 poses (poisson, content, perplexe, casque) |
| Retouche High n° 1 | `notes-privees/mascotte/retouche-1.svg`, refusée : points bleus présents sur certains oiseaux et pas d'autres, une aile bleue et une grise en vol, trous revenus (nuque/aile, pattes de la plongée détachées). Demande refaite : liste fermée de 11 marques, aucun point, les deux ailes par-dessous en vol |
| Logo en place | la huppe, tant que rien d'autre n'est arrêté |
| Prochaine étape | les deux envois en High, en haut de ce document |

Pourquoi le martin-pêcheur : il porte les couleurs de la charte (`docs/charte-graphique.md`), un
dos bleu-vert comme l'accent `#0b7c77` et un ventre orange comme `--accent-2` `#c05e33`. Le vrai
oiseau est un peu plus bleu : on le tire vers le vert de la charte, c'est l'intérêt du choix.

Pourquoi deux envois : la tuile vient de la planche 3 (son bec se lit en petit), les poses de la
planche 4. Une seule image jointe par demande, conseil du guide d'Arrow 2.

Candidats gardés de la session de septembre, pour comparer seulement :

| Fichier | Réserve |
|---|---|
| `notes-privees/logos-candidats/1-oiseau-plat.png` | vient de la planche Freepik : bon pour comparer, pas pour devenir le logo |
| `notes-privees/logos-candidats/3-tete-sarcelle-clair.png` | la moins contrastée des tuiles |

---

## 2. Le martin-pêcheur : ce que disent les sources

Mâle adulte, vérifié le 2026-10-05 sur
[oiseaux.net](https://www.oiseaux.net/oiseaux/martin-pecheur.d.europe.html) et
[Wikipedia](https://en.wikipedia.org/wiki/Common_kingfisher) :
- dessus bleu nuancé de vert ; **dos et croupion d'un bleu plus vif et plus clair** (l'éclair bleu en vol) ;
- calotte « nettement mouchetée », couvertures des ailes plus sombres « ponctuées de bleu clair » ;
- devant l'œil, une zone noirâtre avec **une tache rousse** ; derrière l'œil, une **joue rousse bordée de
  bleu dessous** (la moustache) ; **collier blanc** sur le côté du cou ; gorge blanche à crème ;
- dessous roux vif ; **pattes rouge vermillon**, petites ;
- **bec du mâle entièrement noir** (la femelle a la base du bas du bec orange) ;
- silhouette trapue, grosse tête, queue courte, long bec en dague. Œil sombre.
- **Dessous de l'aile** : absent des sources écrites lues, constaté sur une photo apportée par Mathis
  (mâle, aile levée) : roux près du corps, grandes plumes gris-brun bordées de gris clair.

Le grand œil blanc à point noir n'est pas fidèle (l'œil réel est sombre), mais c'est le style retenu
pour la famille d'icônes : gardé.

---
## 3. Quand une image revient

Dans l'ordre :

1. **Vérifier le fond** : Arrow 2 rend souvent un fond blanc plein malgré la consigne.
2. **Nettoyer** avec `outils/build/prepare-logo.mjs` : enlève un fond uni, recadre, pose sur une
   tuile arrondie, et peut **remplacer des couleurs** (`--palette "#C05E33>#0B7C77"`) pour accorder
   l'image à la charte sans rien regénérer.
3. **Passer au banc d'essai** : déposer l'image dans `assets/logos/candidats/`, recharger **deux
   fois** localhost:8765, cliquer le bouton en bas à gauche. Il fait défiler les candidats dans
   tous les emplacements à la fois (entête, écran d'attente, écran de connexion, favicon de 16 px).
   Local seulement. **Retiré le 2026-10-05**, logo arrêté : le reprendre dans l'historique git
   (bloc `BANC_LOGOS` d'`app.js`, commit c734a5ce) si un nouveau logo doit être essayé.
4. **Brancher** : `manifest.json`, favicon, écran d'accueil, entête, démo.
   `outils/build/icones-logo.mjs` refabrique les icônes 192 et 512 du manifeste.
5. Plus tard : décliner une famille d'icônes, un oiseau par espèce, avec le même style.

---

## 4. Le style retenu

**L'oiseau simple en formes primitives.** Six ou sept formes, pas quarante facettes. La
construction est la même d'un oiseau à l'autre, c'est elle qui fera la famille d'icônes :

- le corps est **une seule goutte arrondie**, tête comprise, sans cou
- l'aile est **une feuille posée dessus**, dans un ton plus soutenu
- la queue est **deux ou trois triangles** qui montent vers l'arrière
- le bec est **un triangle**, l'œil **un disque blanc à point noir**
- les pattes sont **deux bâtons fins** à trois doigts
- couleurs franches, aucun contour, aucun dégradé, aucune ombre

**La règle de Mathis : construction identique, mais proportions fidèles à l'espèce.** Dans la
planche de référence, les six oiseaux avaient le même corps, donc aucun n'était identifiable,
défaut rédhibitoire pour un site d'observation. C'est la règle de Charley Harper : formes très
simples, espèce juste.

**La règle de cadrage de l'icône** (trouvée le 28/09 sur un geai en gros plan que Mathis aime) :
l'oiseau n'est pas centré avec de la marge, **il est coupé par le cadre**, le bec sort d'un côté,
la nuque en bas. Ce débordement donne l'impression que l'image continue derrière la tuile. Et sur
une tuile, **on veut un fond**.

**Ce que l'appli dit d'elle-même** (regardée le 28/09) : fond vert-gris très clair, cartes
blanches arrondies, ombres presque invisibles, titres en serif de livre, une seule couleur forte
par petites touches. **L'identité du site est faite de retenue** : c'est pour ça que les mascottes
en volume ou sportives sonnaient faux.

---

## 5. Ce qu'on a appris

- **Décrire une forme ne suffit pas, il faut décrire un style.** « Un rond, un bec, un œil
  creusé » donne des logos propres et sans identité.
- **Une contrainte de favicon dans la demande produit un logo plat.** « Au plus six formes »,
  « lisible à 16 pixels » ont tout aplati. Dessiner riche, simplifier ensuite.
- **Quatre propositions ne sont pas quatre idées.** Le bloc `VARIATIONS` les sépare vraiment,
  mais seulement si la demande laisse de quoi varier : trop précise (envoi 9), il s'épuise.
- **Le fond transparent n'est pas respecté** : jusqu'à 3 propositions sur 4 avec un fond blanc.
- **Les couleurs imposées en hexadécimal sont très bien suivies.**
- **Le prix suit la complexité de l'image, pas l'effort.** En Medium : 0,205 $ pour une tête
  simple, 0,45 $ pour une illustration à facettes. **Annoncer une fourchette, jamais un chiffre** :
  une demande limitée à dix formes, estimée à 0,2 $, en a coûté 0,345.
- **Les banques d'images gratuites** (Freepik, devenu Magnific) interdisent d'en faire une marque
  et de les donner à une IA. On les regarde, on décrit le style en mots, on n'envoie jamais l'image.

---

## 6. Archives

### La première planche (envoyée le 2026-10-05, effort Medium)

Résultat : planches 3 et 4 retenues, copiées dans `notes-privees/mascotte/`.

Une seule planche : cinq poses du même personnage, et dans un coin la tête en tuile carrée pour le
logo, coupée par le cadre (règle de cadrage, section 4).

```text
Character sheet for a mascot: a common kingfisher (Alcedo atthis), on ONE
single sheet, the same character drawn several times.

ON THE SHEET:
- five full-body poses of the same bird, in a row or a loose grid: perched in
  side profile facing right; looking through a small pair of binoculars;
  diving head first; flying with wings spread; holding a tiny notebook in its
  bill, as if ticking a species off a list;
- in the bottom right corner, a separate square app tile: the head only, in
  close-up, in profile facing right, CROPPED by the square frame - the tip of
  the bill runs off the right edge, the chest and the nape run off the bottom
  edge. No margin inside the tile.

SUBJECT: a kingfisher - a short plump body, a large head, a very long straight
dagger-shaped black bill, a short stubby tail, tiny orange legs. Teal-blue
crown and wings, a bright paler teal stripe down the back, orange cheeks and
belly, a white throat and a white patch on the side of the neck.

STYLE: simple flat vector illustration, friendly, built from a few primitive
rounded shapes: one rounded teardrop for the body and head, a leaf-shaped wing
laid on top in a deeper tone, a short tail of two triangles, one long tapering
triangle for the bill, the eye a small white circle with a dark dot. Flat areas
of solid colour, hard clean edges, no outlines, no gradients, no shading, no
texture.
CONSISTENCY: it is the SAME character in every pose - same proportions, same
colours, same eye, same bill length. Only the pose changes.
ACCURACY: simple shapes, but the proportions follow the real species - the
oversized bill, the big head, the short tail. A bird a birder would name at a
glance, never a generic round bird.
PALETTE: #0B7C77 teal for the crown and wings, #2BBCB0 light teal for the back
stripe, #C05E33 orange for the cheeks, belly and legs, #15201E black for the
bill and the eye dot, #F0EEE6 off-white for the throat and neck patch,
#B98D22 gold only for the binoculars and the notebook. Sheet background
#EEF2F1 pale sage; the app tile background #FFFFFF white.
VARIATIONS: make the four proposals genuinely different from one another - vary
the bulk of the body, the size of the head, and how playful the poses are. Do
not return four versions of the same sheet.
AVOID: outlines, contour lines, gradients, shading, drop shadows, texture, text,
words, letters, numbers, labels, signatures, realistic feather detail, facets,
a branch or scenery behind the poses, a different bird from one pose to the next.
```

### La session huppe du 28-29/09

#### Les styles écartés

| Style | Verdict de Mathis |
|---|---|
| Aplat minimal, silhouette propre (envois 1 à 3) | « hyper basique », « simpliste » |
| Tête détaillée en couleurs vraies (envoi 4) | « déjà mieux », mais pas l'identité |
| Mascotte sportive rétro (envoi 5) | « une marque de vêtements », pas de l'observation |
| Mascotte en volume et dégradés (envoi 6) | « ça colle pas à l'ADN du site » |
| Trait continu minimal | écarté sur images de référence, sans envoi |
| Gravure naturaliste du XIXe | écarté sur images de référence, sans envoi |
| Géométrie taillée à facettes (envois 7 et 8) | trop savant ; « ça correspondrait pas au site » |

**Le meilleur résultat : la tuile carrée (envoi 11).** Gros plan de la tête coupé par le cadre,
crête débordant en haut, bec sortant à droite, gorge crème pour le contraste. Lisible en petit,
identifiable, sans air de banque d'images. Le gabarit de la planche (envoi 10) marche aussi, mais
fait illustration plus qu'identité.

#### Les prix mesurés (100 % = 5 $ par semaine)

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

Total : **3,09 $ pour onze envois**, soit 44 propositions.

#### Demande de l'envoi 11 : l'icône carrée (le modèle à reprendre pour une tuile)

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

#### Demande de l'envoi 10 : le gabarit de la planche, repris tel quel

Test demandé par Mathis : reprendre exactement le format de sa planche de référence, quitte à
fausser les proportions de l'espèce. L'inverse exact de la règle de justesse, voulu pour trancher
entre « joli » et « juste ».

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
