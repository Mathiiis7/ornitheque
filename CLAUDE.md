# La Ligue des Birds — ce qu'il faut savoir avant de toucher au code

Appli web statique de birding, en français. Pas de framework, pas de build : trois fichiers
servis tels quels. `app.js` fait 5 Mo — c'est un choix, pas un accident.

```
app.js            tout le code et toutes les tables de données
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
risquée : le dire, et attendre.

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
