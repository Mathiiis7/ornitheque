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

## Moments 1 et 2 refaits sur le site actuel (2026-10-31)

Depuis le 31/10, le film part de 199 espèces (`demo199.py`, le temps des prises) : les chiffres 212 ci-dessous valent pour la liste
complète de la démo. `v2-site.py` s'arrête si le site et la somme des anneaux ne donnent pas 199. Brouillon à 199 : `.onetake/v2-brouillon5.mp4`.

Brouillon `.onetake/v2-brouillon4.mp4` : 15,8 s, 474 images, sans son, oracle PASS, 60 % d'images immobiles, dernier
repos 2,5 s. Refaire : `v2-site.py`, `assemble-v2.py`, puis `render.py .onetake/film2/comp.html --workers 4 --samples-max 24
--gap 16` (241 s). **Ne plus partir des prises du 01/10** (`composants.py`, `.onetake/film/assets/c/`) : Mathis veut le site actuel.

- **Logo :** les tracés de `assets/logos/logo.svg`, dans leur ordre, l'image finale est le vrai logo. L'iris part de son œil.
- **Police :** Source Serif 4 Bold, celle des titres du site, choisie parmi trois (`v2-polices.py`).
- **Carte :** la couche « La ligue » sur la France, filtre « Qui » sur le visiteur de la démo (`demo-visiteur`, Alex) : 23 anneaux
  qui totalisent **exactement 212**, sur **467** (466 avant). Toute la ligue donnait 50 anneaux et 1 200 : Mathis a vu que le compteur
  ne collait pas. Le filtre remet la carte en vue Europe : le choisir AVANT de cliquer la France.
- **Rythme :** trois salves d'anneaux séparées de vrais arrêts ; le compteur additionne le nombre de chaque anneau qui se pose.
- **Cartes du Birdydex :** prises seules sur fond transparent, le vrai arrondi vient du navigateur. Les recouper à la main laissait
  un liseré. Même méthode pour les anneaux, en cachant TOUS les plans de la carte : le voile de l'étranger y restait collé en carré pâle.

| Carte | Licence | Photo iNaturalist |
|---|---|---|
| Guêpier d'Europe (Hérault) | CC BY-NC | iNaturalist 179625228 |
| Flamant rose (Bouches-du-Rhône) | CC BY-NC | iNaturalist 187242272 |
| Cygne tuberculé (Mayenne) | CC BY-NC | iNaturalist 482124381 |
| Huppe fasciée (Vaucluse) | CC BY-NC-SA | iNaturalist 60494705 |
| Rougegorge familier (Indre) | CC BY-NC | iNaturalist 104940884 |

**Chaque oiseau sort de l'anneau où la démo l'a noté, et son lieu doit rester vraisemblable** : un Guêpier dans le Nord a choqué
Mathis (31/10). `v2-site.py` rattache les 212 espèces à leur anneau par leur GPS et la projection lue sur une tuile ; contrôle : 21
anneaux sur 23 tombent juste, les 2 autres, voisins, s'échangent une espèce. La composition s'arrête si l'espèce manque à la carte.

**Photos remplacées à la prise** (`photos_libres.py`, 31/10) : au classement, Oie de toundra 604440187 et Faucon pèlerin 236986913 sont
choisies à l'œil, plus Milan royal, Pic mar, Pic épeichette, Puffin des Anglais, Rollier d'Europe, Pouillot siffleur, Mésange nonnette au
choix automatique, relues sur la capture. Les auteurs à créditer se lisent par espèce dans `photos_libres.lit_cache()`, à l'étape des crédits.

Le site montre aussi des licences interdites au film (BY-SA 17, BY-NC-ND 16, BY-ND 1, Wikimedia 9 à vérifier, inconnue 1
sur 212) : `v2-site.py` écarte tout ce qui n'est pas cc0, pd, cc-by, cc-by-nc ou cc-by-nc-sa. Les auteurs et le fond
OpenStreetMap restent à créditer à l'étape des crédits. Suite : moments 3 à 9, à reprendre aussi depuis le site actuel, puis son et crédits.

## Birdydex, de 199 à 200 (2026-10-31)

Brouillon `.onetake/v2-brouillon6.mp4` : 32 s avec les moments 1 et 2, sans son. Refaire : `v2-mur.py`, `v2-scenes.py`, `assemble-mur.py`, le
rendu de `.onetake/film-mur/comp-a.html` et `comp-c.html` vers `.onetake/mur-a.mp4` et `mur-c.mp4`, puis `montage-v2.py`. Le mur défile et
s'arrête sur la case grise, le clic coupe vers la vraie scène, sans le formulaire. Scène « espèce débloquée » : préambule accéléré 1,7 fois,
carte à vitesse réelle, coupée avant « Continuer ». Scène du trophée : montée accélérée 1,4 fois, fenêtre à vitesse réelle. À ce rythme, le film
complet viserait environ 67 s plutôt que les 60 s du déroulé (estimation : 50 s faites, environ 17 s pour récent, quiz et logo).

Retours de Mathis (31/10) : au retour dans le Birdydex, la carte de la scène se fond dans celle du site pendant le vol et les rayons s'effacent ;
une étape ajoutée : la caméra recule sur la vraie page, phrase « Collectionne les trophées. », l'onglet Trophées et sa pastille, le clic. La scène du trophée part de la vraie page.
Classement et grille : variante e de `comp-m3.html`. Fiche et chant : variante f, `v2-fiche.py`, sur l'Accenteur alpin, vu par les trois amis et pas par Alex.

| À créditer | Licence | Source |
|---|---|---|
| Photo de l'Accenteur alpin, Alessandro | CC BY-NC | iNaturalist 59007262 |
| Chant de l'Accenteur alpin, Benjamin Drillat | CC BY-NC-SA 4.0, lue sur sa page le 31/10 | xeno-canto XC982627 |

Retours du même jour : pour le film seulement, à 200 Alex passe premier (`demo199.PLAFONDS` : Samir 199, Claire 187, Hugo 172, Lina 156) et il remonte du dernier rang à la tête ;
la scène de la carte se fond sur une image où ses rayons sont reconstruits autour d'elle (`assemble-mur.py`). Observations récentes et quiz : variante g, `v2-recent.py`.
Le quiz retenu est une manche tirée au hasard où le premier choix est le bon. Le chant et les noms changent donc à chaque prise, et la licence du chant se vérifie après la prise.

Le site donne ce même enregistrement au chant et au cri : `v2-fiche.py` masque la rangée du cri à la prise, le film ne montre que le chant.

## Repris de la v1

- Le compteur 0 → total de l'essai du 2026-10-02, sans sa caméra fixe ni l'absence de main.
- La carte, l'histogramme et le sonagramme de la fiche, déjà découpés par
  `outils/onetake/composants.py`.
- En suspens depuis la v1 : les bandes sombres autour de la carte de migration (le fond
  assombri de la vraie modale, avec le tiroir en filigrane). Si ce moment revient, choisir :
  laisser, fondu, ou aplat uni.
