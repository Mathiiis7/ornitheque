# Où on en est (2026-10-30)

Dernière version : v993 / app.js?v=565. Prochaine : v994 / 566. Historique complet jusqu'à ce jour :
`archives/en-cours-jusqu-au-2026-10-30.md` (y chercher un mot plutôt que le lire en entier, 85 000 jetons).
Ce fichier se remplace à chaque fin de tâche : quelques lignes, pas un journal.

## Reste ouvert
- **En attente de réponse :** Cornell (22/10), LPO (23/10). Effacer l'historique des deux dépôts attend Cornell.
- **Vidéo, 01/11 :** rendu 4K en cours, `outils/onetake/rendu-final.py --workers 2` (reprend seul s'il est relancé), sortie `.onetake/4k/`. Ensuite : refaire `fin` (`rendu-final.py fin --workers 2`, l'écran de crédits a changé après son rendu), `montage-v2.py .onetake/4k/film.mp4 --final`, `film-web.py`, bancs, commits des deux dépôts. **Film entièrement muet, choix de Mathis (01/11, « ça rend mieux sans son »), après trois mélanges écoutés : ne pas reproposer de son.** `partition-v2.py` ne sert plus. Rectangle de la Bretagne réparé (joint de tuiles, `recoud`). Rien poussé : `assets/film/` et le portfolio attendent la version finale.
- **Vidéo (ticket 39) :** moments 1 et 2 refaits sur le site actuel, brouillon `.onetake/v2-brouillon4.mp4` à valider par Mathis ;
  détail dans `docs/VIDEO-DEROULE-V2.md`. **Nouvel ordre décidé par Mathis (31/10) :** ouverture ; carte, compteur à 199 ; Birdydex à
  199, case du Martin-pêcheur grise ; vraie scène « espèce débloquée », 200 ; vraie scène « Palier atteint » Ornithologue chevronné
  (seuil 200 d'`app.js`) ; classement version A sans sa carte Marco Polo, le 200 double Lina ; Qui a vu quoi (version D) ; clic sur une
  espèce vue par les amis et pas par Alex, sa fiche avec carte et mois, puis le chant ; ensuite récent, quiz, logo, son, crédits.
  199 s'obtient en retirant 13 espèces d'Alex au moment des prises seulement (la démo en ligne reste à 212), Martin-pêcheur compris,
  donc la dernière photo du moment 2 change. Fabrication : `outils/onetake/v2-site.py`, `v2-m3.py`, `assemble-m3.py`, `film/comp-m3.html`.
  **Prouvé :** `demo199.py` donne bien 199 sur le site ; `v2-scenes.py` ajoute le Martin-pêcheur par le vrai parcours (case grise, fiche,
  formulaire) et prend les deux vraies scènes image par image, animations en pause (`--essai` testé, une image toutes les 0,5 s ; scène
  espèce 7,1 s, scène trophée 9,5 s dont la fin fixe se coupe). Birdydex passe à 200, trophée « Ornithologue chevronné » joué.
  **Fait :** carte et compteur à 199, Rougegorge (Indre) en dernière photo, Alex à 200 dans le classement (`demo199.installe(ctx, apres=True)`),
  brouillon `.onetake/v2-brouillon5.mp4`, à valider. **Lina à 199 pour le film seulement** (choix de Mathis) : le 200e la double pour de vrai.
  Licences réglées à la prise (`photos_libres.py`, au niveau du réseau) ; les photos que le film montre sont vérifiées à l'œil, pas les autres.
  **Reste, dans l'ordre :** ~~2. licences : le mur du Birdydex et les petites
  photos du classement montrent des BY-SA, ND ou inconnues (34 cartes sur 212, plus 9 Wikimedia à vérifier) : les remplacer à la prise
  par une photo libre de la même espèce, le film ne doit pas les montrer~~ ; ~~3a. Birdydex, scène espèce débloquée, 200, scène trophée~~ fait :
  validé par Mathis à deux retouches près, faites (`v2-mur.py`, `assemble-mur.py`, `film/comp-mur.html`, `montage-v2.py`) ; les scènes sont prises en
  1080p, à reprendre en double définition pour le rendu final ; ~~3b. classement A sans Marco Polo enchaîné à D~~ fait, variante e de `comp-m3.html`,
  ~~3c. étape Trophées et retour fluide~~ et ~~3d. fiche et chant, variante f, `v2-fiche.py`~~ faits ; ~~3e. Alex premier à 200, récent et quiz, variante g, `v2-recent.py`~~ faits ; rythme ralenti (tables `TEMPS` de `comp-mur.html` et `comp-m3.html`, vitesses de `montage-v2.py`) et fin faite (`comp-fin.html`, `credits-v2.py`, `docs/VIDEO-CREDITS-V2.md`), puis colonne d'Alex remplie et drapeaux variés (`demo199.AJOUTS_ALEX`, `PAYS`), étape monde entier (variante m, `v2-monde.py`), droits vérifiés (`docs/VIDEO-DROITS.md`), brouillon `.onetake/v2-brouillon15.mp4`, 86 s, avec le son (`partition-v2.py`), à valider (pays de la grille contrôlés par `demo199.controle_presence`) ; trophées faits par Mathis, portfolio considéré non commercial, eBird : on n'écrit pas, décision du 30/10 maintenue, ne pas reproposer ; film prévu sur le portfolio et l'écran d'accueil du site, avec un lien vers les crédits près du lecteur ; défaut connu : rectangle très pâle autour de la Bretagne, cause non trouvée (ni le voile, ni le rechargement des tuiles) ; reste le rendu final 4K (scènes déjà en double définition, à rendre avec --final, puis `partition-v2.py`) ;
  l'ancienne étape fiche : la fiche (clic sur une espèce non vue par Alex, carte et mois, chant) ; 4. rendre chaque
  morceau et les coller avec ffmpeg, chaque fin raccordant au début suivant ; 5. faire valider, puis récent, quiz, logo, son, crédits.

## Décidé le 31/10
- **Anneaux du classement, SUJET CLOS (v993, ticket 61) :** or, argent, bronze sur l'avatar des 3 premiers au nombre d'espèces.
  Avatar du Profil 96 px et centré, au-dessus du texte au téléphone. Emojis d'avatar retirés : image ou initiale. Boutique, graines,
  missions et cadres dessinés abandonnés après essai sur la démo, ne pas reproposer (archives : `notes-privees/maquettes/boutique/`).
- Essai de la méthode qa-only (sans gstack, trop lourd) et critique Impeccable : `notes-privees/essai-qa-only/`. Les 8 bugs
  corrigés (v991). Suites (v992) : sons du Quiz vérifiés dans Chrome (ils marchent ; seul le navigateur intégré les bloque) et
  message si un chant ne vient pas ; noms des listes plus faciles à toucher ; en-tête de fiche replié en descendant au téléphone ;
  trophées à gagner en cartes creuses ; erreur « _leaflet_pos » réglée (0 sur 24 fiches, 11 sur 12 avant).
  Indices du Quiz (15 pictos) : laissés affichés d'office, choix de Mathis, ne pas reproposer.
- « Densité habitat » retirée de la carte Traits (v990).
- Empreinte morphologique sur les fiches (carte Traits, v982) : radar arrondi choisi par Mathis, en proportions du
  poids. Autres radars (membres, quiz, présence, cycle de vie) maquettés dans `notes-privees/maquettes/radar/`, non retenus.
  Lignes de morphologie retirées (v983), « Patte » pour le tarse (v984), comparaison aux oiseaux du monde (v987).
- Mesures Avonet complétées (v986) : feuilles BirdLife et BirdTree pour les noms du site, plus les genres renommés
  (`outils/build/avonet-renommes.mjs`, même famille exigée) ; 657 oiseaux de plus, aucune mesure d'avant modifiée.
  v989 : 32 renommés de plus, chacun prouvé par GBIF (15) ou iNaturalist (17). SUJET CLOS par Mathis (31/10) : le reste
  (2 oiseaux de France, ~400 étrangers, surtout disparus ou séparés) ne se rouvre pas sans source nouvelle.
- Taille comparée par silhouettes : abandonnée, maquette dans `notes-privees/maquettes/taille-silhouettes/`.

## Décidé le 30/10
- **Clé et données eBird : on ne fait rien, on réagira en cas de problème** (choix de Mathis). Pas de mail à eBird,
  pas de nouvelle clé, rien retiré. La clé du compte reste lisible dans l'historique public, et
  `data/countries/*/freq48/` reste très proche du format d'origine interdit (`docs/carte-donnees.md`). À rouvrir si
  eBird écrit, si la clé est coupée ou si des refus inexpliqués apparaissent. Ne pas présenter ces données comme autorisées.
- Lien INPN des réserves supprimé pour de bon (v980), plus à remettre. Le champ `i` de `data/reserves-fr.json`
  reste, sans usage.
- Migration sur iPhone, trophées et progression du quiz : bons pour Mathis (« oui c bon », 30/10).
  Hotspots slovènes : 49 carrés lus, 0 erreur.
- Ronde d'hiver : dernière ligne grisée des parcours (`PARCOURS_BIENTOT`), Sittelle ajoutée à la ligne qui
  avait déjà les 5 autres. Mathis la reprendra à son tour ; à trancher alors : cris seuls, ou cris puis chants.
