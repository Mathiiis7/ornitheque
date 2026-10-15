# Syrinx - ce qu'on peut en retenir

Recherche du 2026-10-15. Sources : site officiel (syrinxbirdsong.com, pages d'accueil, À propos,
Sources, guides « quiz » et « retenir les cris »), fiche App Store. Aucun article ni avis
indépendant trouvé : l'appli est trop récente pour en avoir.

## L'appli

- **Apprendre les chants à l'oreille**, iPhone seulement. Elle n'identifie RIEN au micro, exprès :
  « apprendre la voix, pas seulement l'étiquette ».
- Faite en France par **Quentin Bacquelé**, développeur indépendant. Version 1.0 le 26 juillet,
  1.3.0 le 30 septembre (l'année n'est pas écrite sur la fiche).
- 308 espèces, 792 enregistrements, 6 régions du monde, 16 langues. Note 4,8/5 sur 22 avis.
- Gratuit pour une région, « Pro » pour toutes : 9,99 $/mois ou 24,99 à 39,99 $/an. Monnaie interne
  (« plumes ») et recharge de vies payante, façon Duolingo.
- Sons de xeno-canto (CC BY-SA), photos de Wikimedia Commons, cartes BirdLife avec permission.

## Sa méthode, en quatre temps

1. **Un petit groupe** (« flock ») de 3 à 5 oiseaux locaux, pas des centaines d'un coup.
2. **Écouter la structure** : hauteur, rythme, répétition, timbre, forme du sonagramme.
3. **Retrouver par plusieurs indices** : son vers nom, son vers photo, nom tapé au clavier,
   sonagramme à reconnaître.
4. **Revoir ce qui glisse** : les espèces ratées OU CONFONDUES reviennent jusqu'à ce que la
   différence soit acquise.

## Ce que l'Ornithèque fait déjà

Son vers nom, photo vers son, sonagramme montré après la réponse, entraînement qui ramène les
espèces ratées (Leitner), quiz du jour de 5 questions avec classement et série, fil, photos, tchat.

## Ce qu'elle a et que nous n'avons pas

| Idée | Ce que c'est chez eux |
|---|---|
| **Note d'écoute par espèce** | Deux lignes sous chaque oiseau : « deux notes aiguës, puis un trille argenté ». Montrée avec le sonagramme après la réponse. Le point le plus fort de l'appli. |
| **Parcours en petits groupes** | Une carte de progression par région : on débloque les oiseaux par groupes de quelques-uns, chacun avec un niveau. |
| **Paires de confusion** | Merle ou rougegorge : réécouter la bonne réponse puis la sienne, et dire une différence. Les mauvais choix proposés sont des oiseaux qu'on confond vraiment, pas des espèces au hasard. |
| **Nom tapé au clavier** | Retrouver le nom sans liste de choix : plus dur, mieux retenu. |
| **Reconnaître un sonagramme** | Associer une image de chant à l'oiseau, sans le son. |
| **Enregistrement jamais entendu** | Finir une séance sur un son inédit de l'espèce, pour vérifier qu'on reconnaît l'oiseau et pas la piste. |
| **Duels en direct** | Défier un ami, six façons de jouer, plus un classé mondial en direct. |
| **Objectifs du jour, missions, points d'expérience** | Tout ramène à « réécouter chaque jour ». |
| **Profil personnalisable** | Objets décoratifs à débloquer (leur dernière mise à jour en ajoute). |
| **Mascotte** | Un geai bleu « professeur de chant » qui guide. |
| **Bibliothèque « oiseaux que je connais à l'oreille »** | Ce qu'on a appris, séparé de ce qu'on a vu. |
| **Guides gratuits sur le site** | Lire un sonagramme, retenir un cri, une méthode sur sept jours. |

## Ce que Mathis veut reprendre (2026-10-15)

Tickets en réserve dans Mathiiis7/qg, titre seul ; le détail est ici.

- **qg#55 - Apprendre pas à pas.** Groupes de 4 ou 5 oiseaux. Contrairement à Syrinx, dont les
  groupes mélangent des chants très différents, un groupe réunit des oiseaux AU CHANT PROCHE, pour
  apprendre à les distinguer. Point de départ : `CONFUSION_GROUPS` dans `app.js` (46 groupes,
  servent déjà aux mauvaises réponses du quiz et à « À ne pas confondre »).
- **qg#56 - Modes d'entraînement, 10 manches chacun.** (1) un chant, 5 noms proposés ; (2) un
  oiseau, 3 chants proposés ; (3) écrire le nom, le niveau final ; (4) s'entraîner sur ses
  lacunes : les plus ratés et les plus confondus. Existant : Classe (son vers nom, photo vers son),
  Entraînement de Leitner, quiz du jour en 5 questions et de la semaine en 20.
  Accepté le même jour : varier les enregistrements (pas 8 sons du même enregistreur) et finir
  une série sur un enregistrement jamais entendu, pour reconnaître l'oiseau et pas le fichier.
- **qg#64 - Repartir de zéro sur le quiz de chants.** Dit par Mathis, ampleur pas encore
  précisée : tout refaire en gardant les sons, sonagrammes et groupes de confusion, ou vraiment
  tout ; et que deviennent les classements déjà enregistrés. À lui demander avant de commencer.
- **qg#57 - Quiz photo.** Même principe, mais on devine à l'apparence et non au chant.
- **qg#58 - Paliers par oiseau.** Enchaîner les bonnes réponses sur un même oiseau fait monter
  une chaîne, avec des paliers bronze, argent, or.
- **qg#59 - Commencer par la France, et par les passereaux.** Le reste viendra après.
- **qg#60 - Fiches d'écoute en tableau.** Une grille de critères communs (à définir), cochés ou
  non pour chaque oiseau, chacun ayant une combinaison différente, plus une ligne sur ce qui lui
  est propre. Même chose ensuite pour la vue. À faire groupe par groupe, pas tout d'un coup.
- **qg#61 - Missions quotidiennes.** Elles débloquent des décorations de profil. PAS de mascotte :
  le logo suffit, une mascotte ferait enfantin.
- **qg#62 - Plusieurs oiseaux préférés au profil**, choisis parmi son Birdydex. Existant : une
  seule « Espèce préférée » (`#profFav`), montrée dans le classement.
- **qg#63 - Statistiques du quiz dans le profil.** On ne sait pas ce qu'en fait Syrinx (réservé à
  la version payante) : à réfléchir.
- **Classement entre joueurs** : déjà là pour le quiz (du jour, de la semaine). Pas de ticket ;
  il faudra le prolonger aux nouveaux modes.
- **Écartés** : duels en direct (trop compliqué), mascotte.

## Leur style

Fond crème, titres ronds et gras, oiseaux détourés en collage, notes manuscrites (police Caveat)
à côté de chaque oiseau, boutons jaunes. Ludique et chaleureux, loin du guide de terrain sobre de
l'Ornithèque.
