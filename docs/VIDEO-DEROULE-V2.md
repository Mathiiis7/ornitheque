# Vidéo de présentation - le déroulé v2

Idées de Mathis du 2026-10-02, mises en ordre. Remplace le déroulé « Collectionne / Écoute /
Suis / Compare / Devine » de `VIDEO-PRESENTATION.md`. Rien n'est encore construit.

**Tranché** : environ **60 s** ; ouverture = **la huppe du logo qui se dessine**, puis le nom
s'écrit. Aucune image extérieure à créditer pour l'ouverture.

| # | Moment | Durée visée | Ce qu'on voit | Phrase (choisie le 02/10, colonne A) |
|---|---|---|---|---|
| 1 | Ouverture | ~6 s | la huppe se dessine trait par trait, le nom s'écrit, un temps calme | aucune |
| 2 | Observer | ~10 s | fond de carte, les points d'observation arrivent un à un ; de temps en temps la photo d'une espèce surgit ; le compteur monte lentement à côté (essai du 02/10, `outils/onetake/essai-compteur.py`) | **Note chaque oiseau que tu vois.** |
| 3 | Se mesurer | ~7 s | le classement : on double quelqu'un, un trophée tombe | **Mesure-toi à tes amis.** |
| 4 | Compléter | ~6 s | le Birdydex avec le filtre « Toutes » : 466 cases dont 254 vides | **Complète ton Birdydex.** |
| 5 | Où l'observer | ~8 s | la fiche espèce, carte et histogramme comme dans la v1 | **Sache où et quand le trouver.** |
| 6 | Écouter | ~6 s | le chant et son sonagramme | **Reconnais-le à son chant.** |
| 7 | Observations récentes | ~6 s | la carte de ce qui a été vu ces derniers jours | **Vois ce qui passe près de chez toi.** |
| 8 | S'entraîner | ~6 s | le quiz | **Entraîne-toi à les reconnaître.** |
| 9 | Logo final | ~5 s | le logo, le nom | **L'Ornithèque** (le nom seul) |

## Vérifié dans la démo le 2026-10-02

- **Le gain d'un trophée n'a pas d'animation dans l'appli** : depuis qu'ils noyaient le fil, les
  trophées ne sont plus annoncés nulle part, ils changent seulement d'état sur la page Trophées
  (carte grise « à débloquer » avec sa barre, carte en couleur une fois gagnée). Le moment 3 se
  met donc en scène dans la composition à partir de la vraie carte : « Marco Polo », à 1 / 2
  dans la démo, est le bon candidat (la barre se remplit, la carte prend sa couleur).
- **Le classement de la démo** : « Vous » est 4e avec 212 espèces, derrière Hugo (274) et devant
  Lina (156). Pour rester cohérent avec le compteur qui finit à 212, on double **Lina**, pas Hugo.
- **Les observations récentes s'affichent** : onglet Carte, « Observés récemment », région
  Bretagne : 186 observations, 31 espèces, points colorés par rareté. Il faut choisir une
  région, la France entière reste vide.
- **Le fil qui relie les moments** : la règle du skill onetake (quelque chose doit survivre à
  chaque passage) reste à écrire moment par moment, comme pour la v1.
- **Les phrases** : trois variantes par phrase à proposer à Mathis, il choisit.

## Repris de la v1

- Le compteur 0 → total de l'essai du 2026-10-02, sans sa caméra fixe ni l'absence de main.
- La carte, l'histogramme et le sonagramme de la fiche, déjà découpés par
  `outils/onetake/composants.py`.
- En suspens depuis la v1 : les bandes sombres autour de la carte de migration (le fond
  assombri de la vraie modale, avec le tiroir en filigrane). Si ce moment revient, choisir :
  laisser, fondu, ou aplat uni.
