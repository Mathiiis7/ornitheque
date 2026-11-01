# Où on en est (2026-11-01)

Dernière version : v995 / app.js?v=567. Prochaine : v996 / 568. Historique complet jusqu'au 30/10 :
`archives/en-cours-jusqu-au-2026-10-30.md` (y chercher un mot plutôt que le lire en entier, 85 000 jetons).
Ce fichier se remplace à chaque fin de tâche : quelques lignes, pas un journal.

## Reste ouvert
- **En attente de réponse :** Cornell (22/10), LPO (23/10). Effacer l'historique des deux dépôts attend Cornell.

## Décidé le 01/11
- **Film de présentation, SUJET CLOS (ticket 39) :** en ligne sur l'écran de connexion et sur la page L'Ornithèque du portfolio (à la place de la carte du monde), avec le lien « Crédits ». 86 s, **muet par choix de Mathis** après trois mélanges écoutés, ne pas reproposer de son. Version web 10,4 Mo (1080p), maître 4K `.onetake/4k/film.mp4` hors dépôt. Fabrication : `docs/VIDEO-DEROULE-V2.md`, puis `outils/onetake/rendu-final.py`, `montage-v2.py --final`, `film-web.py`. Ne pas relancer `v2-recent.py` ni `v2-scenes.py` sans raison : la première retire un autre chant au quiz et de nouvelles observations.

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
