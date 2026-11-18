# Les huit parcours à venir (préparés le 2026-11-18)

Suite de `docs/refonte-quiz.md` et `docs/groupes-chants.md` (groupes 3 à 10). Même méthode que les
deux premiers parcours : je présélectionne, Mathis écoute et garde, puis le parcours s'ouvre.
Rien n'est en ligne : les huit restent « Bientôt » tant que leurs chants ne sont pas écoutés.

## Où en est chaque parcours

| Parcours (nom provisoire) | Oiseaux | Candidats | Écoute |
|---|---|---|---|
| jardins | 4 | 15 chacun | à faire |
| fringilles | 5 (Chardonneret écouté dans « jardins ») | 15 chacun | à faire |
| fauvettes | 5 | 15 chacun | à faire |
| grives | 5 | 15 chacun | à faire |
| roseaux | 6 | 15 chacun | à faire |
| champs | 6 | 15 chacun | à faire |
| trilles | 4 | 15 chacun | à faire |
| ronde (chants) | 6 (Grimpereau des jardins déjà gardé) | 15 chacun, Orite 12 | à faire |
| ronde (cris) | 6 | 15 chacun | à faire |

Page d'écoute : `http://localhost:8765/notes-privees/ecoute-parcours/?p=jardins` (un onglet par
parcours en haut). Candidats : `node outils/build/chants-parcours.mjs <parcours>` (déjà fait, ne pas
relancer après l'écoute : la liste changerait). Filtres : chant seul (ou cri seul pour la ronde),
qualité A, aucun autre oiseau du parcours en fond, 8 s à 3 min, un enregistreur par chant, France
d'abord ; pays voisins, Espagne et Portugal compris. Pour cinq oiseaux à court (Tarin, Pipit farlouse,
Orite, Roitelet huppé, Mésange huppée), l'Europe du Nord et du Centre, puis la qualité B, rangées après.
L'Orite n'a que 12 chants enregistrés en qualité A dans ces pays : son chant est rarement entendu.

Quand Mathis colle une sélection : la recopier dans `outils/build/chants-gardes.mjs` (un parcours de
plus), lancer `node outils/build/chants-gardes.mjs <parcours>`, puis créer le parcours dans `app.js`
sur le modèle de `PARCOURS_PHRASES` et le retirer de `PARCOURS_BIENTOT`.

## Ordre des oiseaux et étapes

Même règle que les deux premiers : les oiseaux courants et faciles à distinguer d'abord, chaque sosie
après son modèle, le plus rare en dernier. « Listes » = part des listes eBird de France (moyenne de
l'année, `docs/groupes-chants.md`). Étapes : 2, 3… noms jusqu'à tous les oiseaux, puis « Trouver le
chant », « Le mélange », « L'épreuve » (15 questions), sans indices pour ces trois dernières.

| Parcours | Ordre proposé | Pourquoi |
|---|---|---|
| jardins | Rougegorge, Troglodyte, Chardonneret, Accenteur | l'Accenteur, sosie du Rougegorge, en dernier |
| fringilles | Chardonneret, Verdier, Linotte, Serin, Tarin | le Tarin, sosie du Serin et le plus rare, en dernier |
| fauvettes | Tête noire, Grisette, Mélanocéphale, Hypolaïs, des Jardins | la Fauvette des jardins, sosie de la Tête noire et la plus rare, en dernier |
| grives | Merle, Musicienne, Loriot, Rossignol, Draine | la Draine, sosie du Merle, en dernier ; le Loriot, rare mais facile, tôt |
| roseaux | Bouscarle, Cisticole, Bruant des roseaux, Effarvatte, Phragmite, Turdoïde | Phragmite après l'Effarvatte ; la Turdoïde, la plus rare, en dernier |
| champs | Alouette des champs, Tarier, Proyer, Farlouse, Lulu, Pipit des arbres | chaque sosie (Lulu, Pipit des arbres) après son modèle |
| trilles | Zizi, Bonelli, Jaune, Babillarde | le Jaune, sosie du Zizi, après lui ; la Babillarde, la plus rare, en dernier |
| ronde | Grimpereau des jardins, Sittelle, Triple bandeau, Huppée, Roitelet huppé (chants) ; l'Orite en plus dans les cris | le Roitelet huppé, sosie du triple bandeau, en dernier |

Étapes : 4 oiseaux = 6 étapes, 5 = 7, 6 = 8. La ronde a en plus ses étapes de cris (Mathis le
2026-11-18 : les chants puis les cris) : une étape « Les cris » à 3 puis à 6 noms, puis un mélange
chants et cris avant l'épreuve. Le quiz ne sait pas encore jouer un cri : à coder à l'ouverture de
la ronde (un fichier de cris à part, et un type d'étape).

## Indices

Proposés pour les 39 nouveaux oiseaux dans un système commun (quatre cercles : longueur, forme, fin,
onomatopée), avec ce qu'il changerait pour les 11 déjà faits : `docs/indices-chants.md`. Propositions en
bleu sur la page d'écoute, à corriger à l'oreille. Fabriqués par
`notes-privees/analyse-sons/2026-11-18-parcours/propositions.mjs` (recherches dans `recherche/`, mesures de
6 enregistrements par oiseau dans `mesures.json`, téléchargés par `telecharge.mjs`, mesurés par `mesure.py`).

## Noms proposés (à choisir par Mathis)

Deux ou trois pistes par parcours, dans l'esprit de « Phrases qui dégringolent » (ce qu'on entend) ou plus sobres.

| Parcours | Pistes |
|---|---|
| jardins | « Petites voix des jardins » ; « Phrases fines et pressées » ; « Rougegorge et ses voisins » |
| fringilles | « Trilles et grincements » ; « Babils de fringilles » ; « Les fringilles » |
| fauvettes | « Babils dans les buissons » ; « Les fauvettes » ; « Bavardes des haies » |
| grives | « Flûtes et sifflets » ; « Merle, grives et rossignol » ; « Les grands chanteurs » |
| roseaux | « Voix des roselières » ; « Dans les roseaux » ; « Grincements des marais » |
| champs | « Chants du ciel » ; « Champs et landes » ; « Chanteurs en vol » |
| trilles | « Crécelles et grelots » ; « Une note, très vite » ; « Les trilles » |
| ronde | « La ronde d'hiver » ; « Petites voix des bois en hiver » ; « Cris de la ronde » |

## Décidé le 2026-11-18

- **L'Orite à longue queue n'entre que dans les étapes de cris** de la ronde : pas de vrai chant
  (oiseaux.net), ses 12 « chants » enregistrés sont des cris enchaînés. Les étapes de chants de la ronde
  se font à 5 oiseaux.
- **Indices : quatre cercles communs** (longueur, forme, fin, onomatopée), pour les nouveaux oiseaux et les
  11 déjà faits ; le pouillot véloce passe en « une note répétée ». Dessins en maquette :
  `notes-privees/maquettes/indices-4-cercles/`, à valider avant de toucher au site.
