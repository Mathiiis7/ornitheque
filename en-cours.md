# Où on en est (2026-10-30)

Dernière version : v981 / app.js?v=553. Prochaine : v982 / 554. Historique complet jusqu'à ce jour :
`archives/en-cours-jusqu-au-2026-10-30.md` (y chercher un mot plutôt que le lire en entier, 85 000 jetons).
Ce fichier se remplace à chaque fin de tâche : quelques lignes, pas un journal.

## Reste ouvert
- **Clé eBird :** l'ancienne clé est dans l'historique public (27 commits) et eBird l'acceptait encore le 30/10.
  Le compte eBird de Mathis affiche cette même clé (vu le 30/10), donc le relais l'utilise très probablement.
  Reste à demander à eBird une clé neuve ; `EBIRD_KEY` dans Vercel n'est pas relisible, la remplacer puis Redeploy.
  Effacer l'historique des deux dépôts attend la réponse de Cornell.
- **Conditions d'accès aux données eBird :** lues le 30/10. Elles interdisent de publier les données dans leur
  format d'origine ; `data/countries/*/freq48/` en est très proche. Rien retiré : à Mathis de décider s'il écrit
  à ebird@cornell.edu (`docs/carte-donnees.md`).
- **Trophées :** essayés par Mathis sur la démo seulement ; un vrai dépôt qui débloque un trophée reste à voir.
- **Quiz :** copie en ligne de Mathis du 23/10 (5 oiseaux, 137 réponses, meilleure série 25, 1 parcours), rien
  depuis. La fusion doit la rendre au navigateur à la connexion (lu dans le code, pas essayé connecté).
- **En attente de réponse :** Cornell (22/10), LPO (23/10).

## Décidé le 30/10
- Lien INPN des réserves supprimé pour de bon (v980), plus à remettre. Le champ `i` de `data/reserves-fr.json`
  reste, sans usage.
- Migration sur iPhone : marche (Mathis). Hotspots slovènes : 49 carrés lus, 0 erreur.

- Ronde d'hiver : dernière ligne grisée des parcours (`PARCOURS_BIENTOT`), Sittelle ajoutée à la ligne qui
  avait déjà les 5 autres. Mathis la reprendra à son tour ; à trancher alors : cris seuls, ou cris puis chants.
