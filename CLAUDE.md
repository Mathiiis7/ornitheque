# La Ligue des Birds — ce qu'il faut savoir avant de toucher au code

Appli web statique de birding, en français. Pas de framework, pas de build : trois fichiers
servis tels quels. `app.js` fait 3,2 Mo, et sa taille reste un choix : le code et les tables
qui servent partout y restent, plutôt que d'éparpiller. Ce qui en est sorti l'a été sur
mesure, avec un chiffre à l'appui : les fréquences mensuelles des 47 pays étrangers
pesaient 1,9 Mo, soit 579 Ko gzippés avant le premier affichage ; elles vivent depuis le
2026-09-27 dans `data/freq_monthly_pays.json`, chargé en tâche de fond une fois la page
peinte. La France, pays par défaut, est restée en dur.

Avant de sortir une autre table, mesurer : créer 1,87 Mo de données en mémoire ne coûte que
29 ms, et le temps d'analyse au démarrage n'a baissé que de 404 à 369 ms. Le gain est dans
l'octet téléchargé avant le premier rendu, pas dans le temps d'analyse. Je m'étais trompé
en croyant l'inverse.

```
app.js            tout le code, et les tables qui servent partout
styles.css        toute la CSS
index.html        le squelette et les <template>
service-worker.js le cache
tools/build/      les générateurs de données (Node, ESM)
tools/verif/      les bancs de mesure — voir plus bas
data/             les données générées, publiées telles quelles
```

## Déployer

**Pousser sur `main`, c'est déployer.** GitHub Pages sert la branche directement. Avant
chaque commit qui touche `app.js`, `styles.css` ou `index.html`, trois nombres à monter,
sinon les visiteurs gardent l'ancienne version en cache :

1. `CACHE_VERSION` dans `service-worker.js`
2. `app.js?v=NNN` dans `index.html` — **il y a DEUX occurrences**, le `modulepreload` et le
   `<script>`. En oublier une ne casse rien tout de suite, ce qui est pire.

## Les pièges qui m'ont déjà fait perdre du temps

**`node --check app.js` ne marche pas** : la commande suppose du CommonJS et `app.js` est un
module. Utiliser `node --input-type=module --check < app.js`.

**Les heredocs du shell mangent les échappements.** `\\n` devient un vrai retour à la ligne,
`\.` dans une expression régulière perd son antislash. Pour tout ce qui contient des
échappements, passer par les outils Write / Edit, jamais par `cat <<'FIN'`.

**Un accent grave dans un littéral de gabarit le referme** — y compris dans un commentaire à
l'intérieur. Les générateurs de `tools/verif/` en sont pleins : y écrire « la variable ok »
et non « la variable \`ok\` ». Ça m'a coûté deux erreurs de syntaxe le même jour.

**`body { zoom: 0.85 }`.** `getBoundingClientRect` renvoie donc des pixels ÉCRAN, alors que
les styles calculés et les métriques du canvas parlent en pixels CSS. Mélanger les deux m'a
fait produire trois mesures fausses d'affilée. Mesurer tout dans un seul repère.

**Centrer un texte, c'est centrer son ENCRE, pas sa boîte.** Pour une capitale ou un chiffre,
l'encre va de la ligne de base à la hauteur de capitale ; la boîte, elle, descend jusqu'à la
descendante, que ces caractères n'utilisent pas. L'écart vaut
`(ascendante − descendante − hauteur de capitale) / 2`, soit 0,064 em en Segoe UI. Centrer la
boîte pose le texte trop bas — visiblement.

**`pointer-events="none"` sur un `<g>` SVG se transmet aux enfants**, et un `<g>` qu'on oublie
de fermer est refermé par le navigateur à la fin du parent : tout ce qui suit devient
incliquable sans une erreur. C'est arrivé à la Petite couronne.

**`:where()` ne compte pour rien dans la spécificité.** Deux règles à spécificité égale : la
dernière écrite gagne. Un `cursor:help` écrit à la main plus bas dans le fichier annulait la
règle générale du curseur dessiné.

## Comment travailler ici

**Mesurer avant d'affirmer.** Un banc de mesure qui imprime des chiffres vaut mieux qu'une
capture d'écran regardée de près — surtout pour l'alignement, les tailles et les écarts.
Voir `tools/verif/`.

**Dire « je ne sais pas ».** Le nom exact d'une table, d'un fichier de données, d'une zone
eBird : ça se vérifie en une commande. Ne jamais le deviner.

**Écrire en français**, code comme commentaires. Les commentaires disent POURQUOI, et quand
une décision vient d'une mesure, ils donnent le chiffre.

**Ne jamais réduire un périmètre tout seul.** Si une partie de la demande paraît inutile ou
risquée : le dire, et attendre. Et ne jamais simplifier ni retirer un élément d'interface
existant qui n'a pas été mentionné.

**Une classe partagée se touche avec précaution.** Réparer un composant en modifiant une
classe que d'autres utilisent casse les autres en silence. `.cp-item` sert au sélecteur de
pays ET au sélecteur générique : lui avoir donné la grille à six colonnes du premier a réduit
« Par famille » à « P… » dans le second, et personne ne l'a vu pendant deux jours. Avant de
modifier une classe, chercher qui d'autre s'en sert.

**Retirer une chose, c'est retirer ses effets de bord.** En supprimant une infobulle, penser
au curseur, à l'attribut `aria`, à la place qu'elle occupait. Le « ? » est resté deux
sessions après la disparition de la bulle qu'il annonçait.

## Les bancs de mesure

`tools/verif/` contient des pages qui font tourner les VRAIES fonctions d'`app.js` dans un
vrai navigateur et impriment des chiffres. Tout rejouer :

```
node tools/verif/tous.mjs
```

Chaque banc affiche ses mesures et se termine par `CONFORME` ou `DÉFAUT`. Les lancer après
toute retouche de l'entête du panneau, des sélecteurs, des pastilles ou des cartes : ils
attrapent les régressions qu'une capture d'écran ne montre pas.

Pour en ajouter un : copier le plus proche, il n'y a qu'un contrat — appeler `fini()` à la
fin, après avoir empilé ses vérifications avec `verif(libellé, valeur, ok)`.

## Données eBird

Les fréquences viennent des bar charts eBird, fenêtre 2019-2026, **et exigent un compte** :
l'URL `barchartData` redirige vers la connexion. Le cookie se colle dans un fichier hors
dépôt, désigné par `EBIRD_COOKIE_FILE`. Les statuts exotiques, eux, se lisent sur la page
publique sans aucun compte.

La dernière année de la fenêtre est toujours incomplète. Les poids des quinzaines sont donc
ramenés à l'année — voir `tools/build/annees-par-quinzaine.mjs`, qui explique pourquoi et
donne les mesures. **Là où l'effort sert à pondérer le temps, il est ramené à l'année ; là où
il sert à recombiner des comptes en fréquence, il reste brut.**

**Repasser l'injecteur fait partie du scrape, pas d'une étape facultative.**
`inject-exotic-by-region.mjs` avait deux jours de retard le 2026-09-27 : la Grande-Bretagne,
la Hongrie, la Slovénie et la Lettonie avaient **zéro zone** dans `app.js` alors que leurs
fichiers générés étaient pleins. Leurs cartes de statut s'affichaient vides à l'écran, et
rien ne le signalait.

**La liste des zones d'un pays se demande à eBird, jamais à `zones-agregees.json`** :
`https://api.ebird.org/v2/ref/region/list/subnational1/XX.json`, jeton `dbflh4atmsom`. Le
fichier local ignorait cinq zones lettonnes, et c'étaient les cinq plus grosses, de 147 à
241 espèces : jamais demandées, donc jamais récoltées, pendant des mois.

**« Zone vide » ou « scrape raté » : seule la page barchart ouverte dans un vrai navigateur
tranche.** Les deux sondes de l'API mentent, chacune à sa façon : `obs/recent` donne 0 pour
une commune rurale en septembre, et `spplist` compte toute l'histoire d'eBird quand le bar
chart s'arrête à la fenêtre courante. Et ne jamais conclure au bridage sans avoir chargé un
témoin connu dans la même minute : le 2026-09-27, le scraper échouait partout pendant que
LV-022 rendait ses 228 espèces en trois secondes.
