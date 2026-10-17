# Les passereaux courants de France, rangés par type de chant

Écrit le 2026-10-17 pour choisir les prochains parcours du quiz (suite de `docs/refonte-quiz.md`).

**Comment lire les chiffres.** « Listes » = part des listes eBird faites en France où l'oiseau
est noté, en moyenne sur l'année (table `REAL_FREQ_MONTHLY` d'`app.js`, la France nationale).
C'est une mesure de « à quel point on le croise », pas de « à quel point on l'entend chanter ».
« Saison » = les mois où il dépasse le quart de son maximum : pour un migrateur, c'est sa
présence ; pour un sédentaire, « toute l'année » ne veut pas dire qu'il chante toute l'année.

**D'où viennent les groupes.** Trois sources, citées à chaque ligne :
- **[VNE]** la clé des chants de Vigie-Nature École (MNHN), qui range 15 oiseaux communs par
  type de chant : improvisé, ou phrase qui se répète, et dans ce cas mélodieuse ou uniforme ;
- **[BTO]** les vidéos d'identification du British Trust for Ornithology : chacune est
  consacrée à un groupe d'oiseaux qu'on confond (74 vidéos, une vingtaine sur des passereaux) ;
- **[Fiche]** les fiches d'espèces françaises (LPO, INPN, Faune-Rhône, parcs) et quelques
  sources anglaises ; liens en bas.
- **[Toi]** ce que tu confonds, toi (dit le 2026-10-17).
- **[À vérifier]** confusion que je connais des guides mais pour laquelle je n'ai pas trouvé de
  source écrite aujourd'hui : à confirmer à l'oreille sur les enregistrements avant d'en faire
  une étape.

Les fiches LPO « Attention aux confusions » parlent presque toutes de confusions À LA VUE
(calotte, bavette, croupion) : elles ne servent pas ici.

---

## 1. Les notes répétées par deux ou trois (« ti-tu ti-tu »)

Le chant est une petite cellule de 2 ou 3 notes répétée en série. **C'est le parcours actuel.**

| Oiseau | Listes | Saison | Avec qui on le confond |
|---|---|---|---|
| Mésange charbonnière | 41,8 % | toute l'année | toutes celles du groupe ; elle imite aussi d'autres oiseaux [Fiche xeno-canto] |
| Mésange bleue | 37,4 % | toute l'année | charbonnière ; VNE la range plutôt avec le pinson (deux notes nettes puis une descente) |
| Pouillot véloce | 26,0 % | toute l'année | charbonnière [parcours actuel] |
| Mésange nonnette | 6,2 % | toute l'année | Mésange boréale [BTO] |
| Mésange noire | 4,6 % | toute l'année | charbonnière [parcours actuel] |
| Sittelle torchepot | 11,2 % | toute l'année | charbonnière (sifflets répétés) [À vérifier] |
| Mésange boréale | 0,7 % | toute l'année | nonnette [BTO] ; trop rare pour un parcours de débutant |

## 2. Les phrases courtes qui dégringolent

Une phrase de quelques secondes, toujours la même, qui descend ou accélère vers la fin.

| Oiseau | Listes | Saison | Avec qui on le confond |
|---|---|---|---|
| Pinson des arbres | 39,3 % | toute l'année | Mésange bleue [VNE] ; Pouillot fitis [Fiche LPO] ; Rougequeue noir [forum] ; une fauvette [Toi] |
| Pouillot fitis | 2,7 % | avril-mai, août-septembre (passage) | Pinson, « un pinson qui chanterait en mineur » [Fiche LPO] ; Pouillot véloce, à la vue surtout [BTO] |
| Grimpereau des jardins | 15,7 % | toute l'année | Grimpereau des bois [Fiche, BTO pour le cousin anglais] |
| Grimpereau des bois | 0,9 % | toute l'année | Grimpereau des jardins ; le chant est le meilleur critère [Fiche] |
| Rougequeue noir | 13,5 % | toute l'année | Pinson [forum] ; Rougequeue à front blanc [BTO] ; reconnaissable à son « papier froissé » [VNE] |
| Rougequeue à front blanc | 2,6 % | avril-septembre | Rougequeue noir [BTO] |

## 3. Les petits chanteurs aigus des jardins (gazouillis fins, phrases courtes)

Des phrases rapides, aiguës, sans air qu'on puisse rechanter.

| Oiseau | Listes | Saison | Avec qui on le confond |
|---|---|---|---|
| Rougegorge familier | 41,6 % | toute l'année, chante aussi l'hiver | Chardonneret [Toi] ; phrases courtes « à la limite de l'audible » [VNE] |
| Troglodyte mignon | 21,5 % | toute l'année | Accenteur [À vérifier] ; très puissant, avec un trille au milieu |
| Accenteur mouchet | 11,8 % | toute l'année | « mélodie trop compliquée pour être rechantée » [VNE] ; Troglodyte, Rougegorge [À vérifier] |
| Chardonneret élégant | 20,3 % | toute l'année | Rougegorge [Toi] ; Verdier dans les jardins, Linotte en campagne [Fiche anglaise] |

## 4. Les fringilles (gazouillis, trilles et grincements)

Un babil rapide fait de trilles, de notes sucrées et de sons grinçants.

| Oiseau | Listes | Saison | Avec qui on le confond |
|---|---|---|---|
| Chardonneret élégant | 20,3 % | toute l'année | Verdier, Linotte [Fiche anglaise] ; plus roulé que le Tarin [Fiche] |
| Verdier d'Europe | 13,0 % | toute l'année | Chardonneret [Fiche anglaise] ; trilles de hauteurs différentes [VNE] |
| Linotte mélodieuse | 9,1 % | toute l'année | Chardonneret [Fiche anglaise] ; Linotte à bec jaune [BTO, oiseau rare en France] |
| Serin cini | 8,1 % | février-juillet, octobre-novembre | Tarin [Fiche] ; « sisisisi » aigus et rapides |
| Tarin des aulnes | 5,0 % | octobre-mars | Serin [Fiche] ; Chardonneret [Fiche] |

Le Chardonneret est dans les groupes 3 et 4 : c'est l'oiseau charnière entre les deux.

## 5. Les fauvettes (longs babils dans les buissons)

Le duo tête noire - des jardins est LA difficulté classique des guides anglais [BTO, Fiche].

| Oiseau | Listes | Saison | Avec qui on le confond |
|---|---|---|---|
| Fauvette à tête noire | 24,7 % | mars-octobre (une partie hiverne) | Fauvette des jardins [BTO] ; finit sa phrase en flûte [VNE] ; Pinson [Toi] |
| Fauvette grisette | 4,1 % | avril-août | Fauvette babillarde [BTO] ; des jardins [forum xeno-canto] |
| Fauvette mélanocéphale | 7,3 % | toute l'année (sud, littoral) | grisette [À vérifier] |
| Hypolaïs polyglotte | 2,3 % | mai-juillet | Rousserolle verderolle, imitations [INPN] ; grisette [forum xeno-canto] |
| Fauvette des jardins | 1,6 % | avril-juillet | Fauvette à tête noire [BTO] : plus pressée, plus râpeuse, sans finale flûtée |

## 6. Les grands chanteurs flûtés (merles, grives, rossignol)

Des notes rondes, sifflées ou flûtées, assez graves.

| Oiseau | Listes | Saison | Avec qui on le confond |
|---|---|---|---|
| Merle noir | 43,7 % | toute l'année | Grive draine [À vérifier] ; « une flûte, les dernières notes moins fortes » [VNE] |
| Grive musicienne | 13,0 % | toute l'année sauf août-septembre | Grive draine [BTO] ; répète chaque phrase 2 à 4 fois [Fiche] |
| Grive draine | 6,6 % | toute l'année | Grive musicienne [BTO] ; Merle [À vérifier] |
| Rossignol philomèle | 5,5 % | avril-juin | Grive musicienne (phrases répétées) [À vérifier] ; BTO le compare aux autres chanteurs de nuit |
| Loriot d'Europe | 3,0 % | mai-août | Merle, Grive draine (sifflement flûté) [À vérifier] |

## 7. Les chanteurs des roseaux

| Oiseau | Listes | Saison | Avec qui on le confond |
|---|---|---|---|
| Bouscarle de Cetti | 11,7 % | toute l'année | peu de confusion : un éclat soudain et très fort [À vérifier] |
| Cisticole des joncs | 6,8 % | mars-novembre | « tsip » répétés en vol, peu de confusion [À vérifier] |
| Bruant des roseaux | 4,7 % | octobre-avril | moineaux [BTO, à la vue] |
| Rousserolle effarvatte | 2,7 % | avril-septembre | Phragmite des joncs [BTO, Fiche] : l'effarvatte a un rythme régulier qui n'accélère jamais |
| Phragmite des joncs | 1,0 % | avril-août | Rousserolle effarvatte [BTO] : plus rapide, plus varié, avec des imitations |
| Rousserolle turdoïde | 0,7 % | avril-juillet | effarvatte en plus grave et plus fort [À vérifier] |

## 8. Les chanteurs des champs et des landes (souvent en vol)

| Oiseau | Listes | Saison | Avec qui on le confond |
|---|---|---|---|
| Alouette des champs | 8,1 % | toute l'année sauf août-septembre | Alouette lulu [BTO] : la champs chante sans pause, souvent très haut |
| Pipit farlouse | 9,6 % | octobre-mars | Pipit des arbres, Alouette des champs [BTO] |
| Tarier pâtre | 8,4 % | toute l'année | Tarier des prés, Traquet motteux [BTO, surtout à la vue] |
| Alouette lulu | 3,0 % | toute l'année | Alouette des champs [BTO] : « lulululu » qui descend, mélancolique, chante aussi la nuit |
| Bruant jaune | 3,0 % | toute l'année | Bruant zizi [À vérifier] ; bruants des champs [BTO] |
| Bruant proyer | 2,9 % | toute l'année | bruants des champs [BTO] ; un cliquetis de clés [À vérifier] |
| Pipit des arbres | 2,1 % | avril-septembre | Pipit farlouse [BTO] : finit son vol plané perché dans un arbre |

## 9. Les trilles sur une seule note (crécelles et grelots)

Une note répétée très vite, comme un grelot ou une crécelle.

| Oiseau | Listes | Saison | Avec qui on le confond |
|---|---|---|---|
| Bruant zizi | 6,1 % | toute l'année | Pouillot de Bonelli, Fauvette babillarde [À vérifier] |
| Pouillot de Bonelli | 1,5 % | avril-juillet | « un bruissement plus qu'un trille », 1,5 à 2 s [INPN] ; Bruant zizi [À vérifier] |
| Fauvette babillarde | 0,5 % | avril-octobre | Fauvette grisette [BTO] ; Bruant zizi [À vérifier] |

## 10. Les très aigus : la ronde d'hiver

Déjà noté dans le ticket qg#70 : ils se reconnaissent surtout à leurs CRIS.

| Oiseau | Listes | Saison | Avec qui on le confond |
|---|---|---|---|
| Grimpereau des jardins | 15,7 % | toute l'année | voir groupe 2 |
| Mésange à longue queue | 13,6 % | toute l'année | se reconnaît surtout aux cris |
| Roitelet à triple bandeau | 8,8 % | toute l'année | Roitelet huppé [BTO] |
| Roitelet huppé | 5,8 % | août-mars | Roitelet à triple bandeau [BTO] |
| Mésange huppée | 5,4 % | toute l'année | cri roulé, peu de confusion |

---

## Hors passereaux, mais faciles et utiles pour débuter

Les roucoulements, d'après la clé VNE (« chants uniformes ») et le BTO, qui en fait sa vidéo
d'initiation au chant : Pigeon ramier (46,9 %, 5 notes, la 2e accentuée), Tourterelle turque
(20,6 %, 3 notes, la 2e accentuée), Pigeon biset, Pigeon colombin, Tourterelle des bois. Plus le
Coucou gris (4,2 %, avril-juin), le Pic vert et le Pic épeiche (tambour). Un parcours « les
roucoulements » serait le plus facile de tous, s'il faut un parcours d'entrée.

## Ce qui ressort pour faire des parcours de 5

- **Le plus net** : groupes 5 (fauvettes), 6 (merle et grives), 7 (roseaux), 8 (champs). Les
  confusions y sont reconnues par les guides, avec une vraie paire « sosie » dans chacun
  (tête noire / des jardins, musicienne / draine, effarvatte / phragmite, champs / lulu).
- **Le plus proche de toi** : les groupes 2, 3 et 4, où tombent tes deux confusions
  (rougegorge - chardonneret, pinson - fauvette). Ce sont aussi les oiseaux les plus courants.
- **Saison** : les groupes 5, 7 et le Rossignol ne chantent qu'au printemps et en été. Les
  groupes 1, 2, 3, 4 et 6 s'entendent dès février, souvent toute l'année.
- **Rareté** : quelques oiseaux sont sous 1 % (Grimpereau des bois, Mésange boréale, Fauvette
  babillarde, Rousserolle turdoïde). Ils ne valent une place que comme « sosie » d'un oiseau
  courant.

## Sources

- Vigie-Nature École, clé de détermination des chants :
  https://www.vigienature-ecole.fr/sites/default/files/2019-08/vne_oiseaux_cle_chants.pdf
- BTO, vidéos d'identification (liste complète relevée le 2026-10-17) :
  https://www.bto.org/learn/skills/bird-identification/videos ; grives :
  https://www.bto.org/learn/skills/bird-identification/videos/thrushes-song-and-mistle ;
  pipits et alouettes : https://www.bto.org/learn/skills/bird-identification/videos/meadow-pipit-tree-pipit-skylark
- Fauvettes et pouillots (Woodland Trust, Scottish Wildlife Trust) :
  https://www.woodlandtrust.org.uk/blog/2022/04/warbler-song-identification/ ,
  https://scottishwildlifetrust.org.uk/?p=34921
- Rousserolles (Zeiss) : https://blogs.zeiss.com/sports-optics/birding/en/unlocking-the-secrets-of-warblers-a-guide-to-identification-and-habitats-of-european-warblers/
- Chardonneret, Verdier, Linotte : https://shriekoftheweek.substack.com/p/shriek-of-the-week-goldfinch-644
- Serin, Tarin (Faune-Rhône, LPO) :
  https://cdnfiles1.biolovision.net/www.faune-rhone.org/userfiles/Documents/OiseauDuMois/Tarinnovembre2017.pdf ,
  https://cdnfiles1.biolovision.net/www.oiseauxdesjardins.fr/userfiles/Fichesespces/FicheespceSC.pdf
- Pouillot fitis (LPO) : https://cdnfiles2.biolovision.net/www.oiseauxdesjardins.fr/userfiles/FicheespecePFI.pdf
- Grimpereaux : https://www.futura-sciences.com/planete/definitions/zoologie-grimpereau-bois-6901/
- Hypolaïs polyglotte et Pouillot de Bonelli (INPN) : https://inpn.mnhn.fr/docs-web/docs/download/441123 ,
  https://inpn.mnhn.fr/docs-web/docs/download/440912
- Alouettes : https://oiseaux.net/birds/woodlark.html
- Charbonnière qui imite : https://xeno-canto.org/set/7624
- Rougequeue noir et Pinson (témoignage de forum) :
  https://forums.futura-sciences.com/identification-especes-animales-vegetales/742200-identification-sonore-dun-oiseau.html
