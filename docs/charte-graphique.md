# Charte graphique de l'Ornithèque

Écrite le 2026-10-05, à partir de ce que l'appli fait déjà. **L'Ornithèque garde son propre style**
et n'entre pas dans la charte commune des projets perso (`0-QG/qg/structure/charte-graphique.md`).
Mathis a vu les deux essais sur la démo, « inspiré » et « charte complète » en vert forêt et Figtree,
et les a refusés : il préfère l'appli telle qu'elle est.

Les valeurs ci-dessous viennent de `styles.css` : c'est lui qui fait foi. Quand une règle change,
corriger les deux.

## Ce qui fait son caractère

- **Un guide de terrain, pas un tableau de bord** : titres à empattements, papier vert d'eau très
  pâle, un seul accent bleu-vert. Repris de la maquette « guide de terrain » choisie le 2026-10-02
  (`notes-privees/maquettes/design-birdydex.html`).
- **Les couleurs vives sont réservées aux données** : rareté, amis sur la carte, paliers. L'interface,
  elle, reste sobre.
- **Une appli dense** : `body` porte `zoom:0.85`. Tout est dessiné 15 % plus petit qu'écrit, comme
  un navigateur réglé à 85 %.

## Couleurs

Variables en tête de `styles.css`, redéclarées pour le sombre (qui suit le réglage de l'appareil, ou
le bouton « Thème »).

| Rôle | Variable | Clair | Sombre |
|---|---|---|---|
| Fond de page | `--bg` | `#eef2f1` | `#0d1513` |
| Panneaux | `--surface` | `#ffffff` | `#131f1d` |
| Zones en retrait | `--surface-2` | `#e7eceb` | `#1a2827` |
| Survol, troisième niveau | `--surface-3` | `#dde4e2` | `#223231` |
| Texte | `--ink` | `#15201e` | `#e9f1ef` |
| Texte secondaire | `--ink-2` | `#47534f` | `#a7b6b2` |
| Texte discret | `--ink-3` | `#616966` | `#8b9c97` |
| Traits | `--line` / `--line-2` | encre à 10 % / 16 % | clair à 10 % / 16 % |
| **Accent, bleu-vert** | `--accent` | `#0b7c77` | `#2bbcb0` |
| Accent en texte | `--accent-ink` | `#075a56` | `#54cfc4` |

- **Un seul accent.** Il marque ce qui est actif, cliquable ou compté : onglet actif, bouton principal,
  compteur du Birdydex, lien. L'orange `--accent-2` ne sert qu'au bouton de lecture d'un chant, et
  l'or `--gold` aux trophées.
- **`--ink-sur-blanc` et `--ink-3-sur-blanc` ne changent jamais avec le thème** : ils servent sur des
  fonds qui restent blancs en sombre (pastilles de la fiche espèce, numéros des vignettes du
  Birdydex). Mesuré le 2026-09-29 : 16,04:1 et 4,53:1, contre 1,10:1 et 2,94:1 avec les variables
  qui suivent le thème. Ne pas les redéclarer dans les blocs sombres.
- **Couleurs de données**, à ne pas utiliser pour décorer :
  - amis (carte, comparaisons) : `--s0` à `--s7`, huit teintes validées, une version par thème ;
  - paliers de la ligue, du plus courant au plus rare : `--t-all`, `--t-common`, `--t-uncommon`,
    `--t-rare`, `--t-unique` ;
  - pastilles de rareté 1 à 10 : dégradé calculé par `rarityColor()` dans `app.js`, du cramoisi
    (le plus rare) au vert (le plus commun), `hsl(teinte 60% 47%)`.

## Polices

| Usage | Variable | Police |
|---|---|---|
| Nom de l'appli, titres | `--titre` | **Source Serif 4**, 600 et 700, servie depuis `assets/fonts/` (licence OFL à côté) |
| Noms latins (en italique) | `--serif` | Palatino Linotype, sinon Georgia |
| Tout le reste | `--sans` | Segoe UI, sinon la police du système |
| Codes, adresses | `--mono` | Cascadia Code, sinon Consolas |

Source Serif 4 est servie par nous parce que la politique de sécurité de la page n'accepte que nos
propres polices. On n'embarque pas son italique : les noms latins restent en Palatino.

### Tailles des titres (pixels écrits, avant le zoom 0,85)

| Élément | Ordinateur | Téléphone (≤ 560 px) |
|---|---|---|
| « L'Ornithèque » (`h1`) | 29 px, 700 | 24 px |
| Titre de page (`h2.page-title`) | 24 px, 700 | 21 px |
| Sous-titre (`h2`) | 21 px, 600 | |
| Petit titre de bloc (`.bloc-titre`) | 17 px, 600 | |
| Compteur du Birdydex (« **212** espèces vues sur 466 ») | 26 px, 700 | 23 px |

**Le titre de page reste plus petit que le nom de l'appli.** À 30 px, il lui volait la vedette
(remarque de Mathis le 2026-10-02). Le 2026-10-05, un essai plus petit et un essai dans la police du
texte ont été refusés : on garde ces tailles.

**Ce qui se lit fait 14 px écrits au minimum** (étiquettes, notes, en-têtes de colonnes), 15 px pour
un intitulé de groupe : décidé le 2026-10-05, Mathis trouvait les 12-13 px « très petits ». Depuis
le 2026-10-06, toutes les pages la suivent. Restent plus petits, exprès : les vignettes du Birdydex
(nom 12,5 px, latin 10 px, il n'y a pas la place) et les pastilles de rareté du filtre (« Tout »,
« Vide », 12 px dans 22 px de haut). Les petites étiquettes en capitales font 13 px.

**Le modèle de tout tableau est celui des espèces de Ma liste** (`.mylist-th`, `.mylist-row`) :
en-têtes et étiquettes en 13 px gras, capitales, espacement 0,4 px, `--ink-3` ; texte en 14 px, le
nom en 600, le reste en `--ink-2` ; noms latins en 14 px Palatino. Le Classement y a été aligné le
2026-10-05 (il avait sept tailles, de 10 à 16 px, et deux polices).

**Un tableau a une seule police et une seule taille**, et tout y est centré en hauteur : le
Classement mélangeait Cascadia et Segoe UI, 11,5, 13 et 13,5 px, texte en haut et chiffres au
milieu (corrigé le 2026-10-05).

**Le gras s'arrête à 700.** Un mot en gras dans un texte déjà semi-gras montait à 900 et se lisait
mal (« Download (csv) », remarque de Mathis le 2026-10-05) : `b, strong` sont fixés à 700, et les
textes en 800 y sont descendus. Seules les pastilles rondes chiffrées (rareté, étapes) gardent 800.

## Mise en page

- Page centrée, 1 560 px au plus (`.wrap`), marges de 24 px.
- En haut : le logo et le nom, le bouton « Thème » à droite, puis la rangée d'onglets.
- **Onglets** : du texte seul, sans emoji, 17 px écrits (15 avant le 2026-10-05). Au repos en graisse normale, l'actif seul en gras (600),
  en `--accent-ink`, souligné de 2 px d'accent.
- **Chaque page commence par un panneau** (`.panel`) : fond `--surface`, filet `--line`, coins de
  16 px, ombre `--shadow`, 22 px au-dessus, **20 px de marge intérieure en haut**.
- **Chaque page a un titre** (`h2.page-title` dans un `.section-head`), sans surtitre ni emoji, et
  **il tombe à la même hauteur sur toutes les pages**. Mesuré le 2026-10-05 dans la démo : entre 162,3 et
  162,6 px d'écran sur les six onglets, sur ordinateur et téléphone. Deux pièges l'avaient décalé : une marge de 22 px
  au lieu de 20 (Ma liste), et un élément plus grand que le titre sur la même ligne (le compteur du
  Birdydex), parce que `.section-head` aligne ses deux côtés sur la ligne de base. Tout ce qui
  s'ajoute à droite d'un titre doit rester moins haut que lui.
- **Pas d'animation en changeant de page** : la page s'affiche d'un coup. Le fondu glissé du
  Classement a été retiré le 2026-10-05.

## Schémas récurrents

Relevés et alignés le 2026-10-06 en mesurant les douze pages de la démo, page par page : un même
élément avait jusqu'à cinq tailles selon la page. **Un élément qui revient a le même aspect partout**,
et tout nouvel élément qui revient s'ajoute ici. Les valeurs sont écrites dans `styles.css`, les
règles communes dans le bloc « Schémas communs », juste avant celui du doigt.

| Schéma | Où il revient | Valeurs |
|---|---|---|
| **Police** | partout | `--sans` pour tout le texte ; jamais `system-ui` écrit en dur, ni la police du navigateur (Arial) ou de Leaflet (Helvetica) : `button, input, select, textarea` et `.leaflet-container` héritent. Codes et noms de fichiers en `--mono`. |
| **Titre de page** | les douze onglets | voir plus haut ; même hauteur partout, 165 px d'écran mesurés le 2026-10-06. Le panneau de l'À propos avait 24 px de marge en haut au lieu de 20 : son titre tombait 3,4 px plus bas. |
| **Premier bloc sous le titre** | toutes les pages | **12 px** sous le titre (Trophées en avait 14, À propos 16, Profil 18). |
| **Phrase d'introduction** | Ma liste, Fil, Requêtes, Classement | 14 px, 400, `--ink-3`, juste sous le titre. |
| **Texte d'aide, état vide** (`.help`, « Aucune photo… ») | Trophées, Photos, Carte, Quiz, Tchat, À propos | 14 px, `--ink-3`. Plus aucune taille écrite à la main par-dessus. |
| **Ligne de méta** (auteur, date, heure, compteur) | Fil, Tchat, Requêtes, Quiz, Carte | 14 px, `--ink-3` ; le nom de l'auteur en 600, `--ink-2`. |
| **Petite étiquette en capitales** | en-têtes de tableaux, AVATAR, RARETÉ, NIVEAU, EN COURS, titres des cartes de la fiche | 13 px, 700, capitales, espacement 0,4 px, `--ink-3`. Le modèle est `.mylist-th`. |
| **Contrôle de filtre** : liste déroulante (`.filt-sel`, `.cp-btn`), choix collés (`.seg`), jetons de personne (`.whochip`, `.person-chip`), modes du Quiz, bouton Filtres | Classement, Birdydex, Carte, Trophées, Quiz, Fil, entête de la fiche espèce (pays, région) | **34 px de haut**, texte 14 px en 600. Coins de 9 px pour les rectangles, ronds pour les jetons. Avant : de 27 à 37 px, de 12 à 13 px. |
| **Choisir une personne** | Trophées, Classement (jetons), Carte, Fil (liste) | premier choix « Tout le monde » partout (la Carte disait « Toutes les personnes ») ; soi-même suivi de « (toi) ». |
| **Choisir une rareté** | Carte, Fil, Birdydex | toujours de 1 (le plus commun) à 10 (le plus rare) ; la Carte allait de 10 à 1. |
| **Petit bouton** (`.btn.tiny` : Copier, Envoyer…) | fenêtres, Profil | 14 px (12,5 avant). |
| **Petit titre de bloc** | Ma liste, Profil, À propos | `.bloc-titre` : Source Serif 4, 17 px, 600. Les titres de l'À propos étaient en Segoe UI 16 px. Les emojis devant les titres de blocs restent (décidé par Mathis le 2026-10-06). |

## Ton des textes

- **On tutoie, partout** (décidé par Mathis le 2026-10-06) : « Charge ta liste », « Ton message… »,
  « Alex (toi) ». L'appli mélangeait « tu » (Ma liste, Quiz, À propos) et « vous » (Profil, Photos,
  Trophées, Carte, connexion).
- Pas d'anglicisme quand le français existe (« repli » et non « fallback », « Données collectées »
  et non « Data collectée »). Les mots du métier restent : life list, birder, bar chart.
- Pas de tiret cadratin : un trait d'union ou deux-points.
- Ni nom de personne réelle ni blague privée dans un texte de l'appli ou dans le code : tout est
  public, sur le site comme sur GitHub. Les trophées en pause, qui en contenaient, vivent dans
  `notes-privees/TROPHEES-EN-PAUSE.md`.

## Composants

- **Bouton principal** (`.btn`) : fond accent, texte blanc, coins de 9 px, 600. **Secondaire**
  (`.btn.ghost`) : transparent, filet `--line-2`, texte accent.
- **Choix exclusifs** (`.seg`) : boutons collés dans un cadre de 9 px, le choisi plein d'accent.
- **Coins** : 8 à 14 px pour l'essentiel (cartes, champs, vignettes), 16 px pour les panneaux,
  ronds pour les jetons et les pastilles.
- **Fiche espèce** : panneau qui glisse depuis la droite, en-tête en dégradé d'accent. C'est la seule
  animation d'ouverture voulue.

## Règles

- **Ni emoji ni surtitre en capitales dans les onglets et les titres de page.** Les surtitres
  (`.eyebrow`) ont disparu le 2026-10-02. Ceux qui étaient le seul nom d'un bloc sont devenus
  `.bloc-titre`.
- **Toute page a son titre, à la même hauteur que les autres.** Le Quiz, seule page sans titre, a
  reçu le sien le 2026-10-05.
- **Le doigt** : une cible tactile s'écrit 52 px pour en faire 44 à l'écran, à cause du zoom. Tout
  ce qui concerne le doigt vit dans le bloc `@media (pointer: coarse)` en fin de `styles.css`, et
  l'affichage à la souris ne bouge pas.
- **Une explication au survol** : le curseur devient un « ? » et la bulle attend un quart de
  seconde (`DELAI_SURVOL`, 250 ms, dans `app.js` ; image du curseur dans `--curseur-aide`).
  Décidé par Mathis le 2026-10-05 : la bulle des tris du Classement s'ouvrait sans délai et
  sans « ? ». Un bouton qui explique au survol prend aussi le « ? ».
- **Le focus clavier** : un anneau de 3 px d'accent, décalé hors de l'élément. Mesuré le
  2026-09-29 : 4,23:1 au pire en clair, 6,48:1 en sombre, pour un seuil de 3:1.
- **Mode sombre partout**, vérifié à chaque retouche.
- **Mesurer plutôt que regarder** : alignements, tailles et contrastes passent par les bancs
  d'`outils/verif/`.

- **Les petites étiquettes restent en capitales** (AVATAR, PROGRESSION AU FIL DU TEMPS, RARETÉ,
  INVITER DES AMIS, en-têtes de colonnes) : décidé par Mathis le 2026-10-05. La règle « pas de
  capitales » ne vaut que pour les onglets et les titres de page.

## Logo

**Figé le 2026-10-05, on n'y touche plus.** La tête du martin-pêcheur, avec les points de la
calotte et de l'aile, dans un cadre vert pâle `#d3e7e6` (`assets/logos/logo.svg`). En sombre, le
cadre passe au sapin `#1d524e` (`logo-sombre.svg`, bascule dans `app.js`). Il apparaît dans
l'entête, l'écran de connexion, l'écran d'attente, l'icône de l'onglet et l'icône de l'appli
installée (`logo-192.png`, `logo-512.png`).

- Source unique : `assets/logos/sources/martin-figma.svg`, retouchée par Mathis dans Figma. Tout se
  refait avec `node outils/build/icones-martin.mjs`.
- Le martin entier (`martin.svg`) n'est plus affiché. L'ancienne huppe est dans
  `archives/logos-huppe/`.
- Pas de mascotte en plusieurs poses : abandonné le 2026-10-05.
