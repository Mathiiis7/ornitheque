# Refonte du quiz de chants

Tickets liés : qg#64 (repartir de zéro), qg#55 (petits groupes au chant proche), qg#59
(commencer par les passereaux de France). Inspiration : `docs/inspiration-syrinx.md`.

## Premier groupe : les mésanges (choisi le 2026-10-15)

Cinq espèces présentes partout en France toute l'année, aux chants courts et répétés,
faciles à confondre entre elles. Noms vérifiés dans `FR_NAMES` d'`app.js`.

| Nom                  | Nom scientifique         |
|----------------------|--------------------------|
| Mésange charbonnière | Parus major              |
| Mésange bleue        | Cyanistes caeruleus      |
| Mésange noire        | Periparus ater           |
| Mésange nonnette     | Poecile palustris        |
| Pouillot véloce      | Phylloscopus collybita   |

Groupes écartés pour commencer, gardés pour la suite :
- merle et grives : Merle noir, Grive musicienne, Grive draine, Rougegorge familier ;
- fauvettes : Fauvette à tête noire, Fauvette des jardins, Fauvette grisette, Hypolaïs
  polyglotte (absentes l'hiver, plus difficiles).

## Le parcours (décidé le 2026-10-15)

La page Quiz est refaite autour d'un parcours de 7 étapes, façon Syrinx. Le défi du jour, le
défi hebdo et le classement sont retirés de la page pour l'instant ; leur code est gardé.

| Étape | Question | Espèces | Questions |
|---|---|---|---|
| 1 | un chant, 2 noms | Charbonnière, Pouillot véloce | 10 |
| 2 | un chant, 3 noms | + Mésange bleue | 10 |
| 3 | un chant, 4 noms | + Mésange nonnette | 10 |
| 4 | un chant, 5 noms | + Mésange noire (sosie de la charbonnière, en dernier) | 10 |
| 5 | un oiseau, 3 chants | les 5 | 10 |
| 6 | mélange des deux | les 5 | 10 |
| 7 | un chant, 5 noms | les 5 | 15 |

Il faut 8 sur 10 (12 sur 15 à la dernière) pour ouvrir l'étape suivante ; une étape se rejoue
à volonté. Les oiseaux tombent au hasard, avec un minimum de passages par espèce : 3 chacun à
2 espèces, 2 à 3 espèces, 1 à 4 et 5 (Mathis le 2026-10-16 ; avant, à 2 espèces, ils alternaient
un coup sur deux). Maquettes : `notes-privees/maquettes/parcours-quiz/index.html` (A chemin, B cases,
C étape en grand).

## Les chants : choisis à l'oreille (en cours, 2026-10-15)

Le quiz prenait les 8 chants notés A les plus récents de xeno-canto, sans rien écarter.
Relevé sur les 40 des cinq espèces : oiseaux du parcours en fond (une noire avec bleue et
pouillot, deux nonnettes avec bleue, pouillot ou charbonnière), une nonnette de Corée, deux
noires du Maroc (sous-espèce atlas), des pistes « cri et chant », 7 bleues sur 8 du même
enregistreur. La note A juge le son, pas l'identification.

Décision de Mathis : je présélectionne, il écoute. `node outils/build/chants-parcours.mjs`
écrit 15 candidats par espèce dans `notes-privees/ecoute-chants/candidats.json` (filtres en
tête du script) ; il les écoute sur `http://localhost:8765/notes-privees/ecoute-chants/` et
colle sa sélection (au moins 8 par espèce). Fait le 2026-10-16 : 66 chants gardés (13, 15, 15, 10,
13), un enregistreur différent pour chacun, dans `data/parcours-mesanges.json`, fabriqué par
`outils/build/chants-gardes.mjs` qui contient la liste. Le parcours ne joue plus que ceux-là.

Ce que ça ne couvre pas : les cris. Idée retenue : une étape bonus à part sur chaque parcours,
sur les cris des mêmes oiseaux. Ticket qg#65.

## L'entraînement (qg#56, fait le 2026-10-17)

Quatre modes de 10 manches sous les parcours, à part d'eux. Maquette :
`notes-privees/maquettes/quiz-entrainement/`. Choix de Mathis : E1 (une carte par mode, puis une
page pour cocher les oiseaux), N2 (nom à écrire avec suggestions), noms de la colonne C.

| Mode | Question | Oiseaux |
|---|---|---|
| Chant vers nom | un chant, 5 noms au plus | ceux cochés, 2 au moins |
| Nom vers chant | un oiseau, 3 chants | ceux cochés, 3 au moins |
| Nom à écrire | un chant, le nom à écrire | ceux cochés, 2 au moins |
| Points faibles | un chant, 5 noms | les 3 plus ratés (7 manches) et les autres (3) |

Tranché par moi, validé par Mathis le 2026-10-16 :
- on coche parmi les oiseaux des parcours dont les chants sont triés, débloqués ou non ; ceux
  des parcours « Bientôt » sont grisés ;
- pas d'étoiles, rien à débloquer : l'entraînement n'écrit jamais dans `mb-parcours-*` ;
- nom à écrire : majuscules, accents, traits d'union ne comptent pas, une faute de frappe passe
  (« Presque », compté juste) ; le nom exact d'un autre oiseau est faux. Les suggestions viennent
  de tous les oiseaux de France du Birdydex ;
- réponses gardées dans le navigateur (`mb-quiz-stats`), parcours compris : par espèce, par
  confusion, et les enregistrements entendus. Points faibles fermés avant 20 réponses ;
- la dernière manche prend un enregistrement jamais entendu quand il en reste.

## À garder en tête

- Varier les enregistreurs parmi les sons retenus pour une espèce : aujourd'hui `scoreRec`
  peut garder 8 sons de la même personne, et l'oreille apprend alors le micro, pas le chant.
