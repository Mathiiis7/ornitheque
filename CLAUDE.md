# L’Ornithèque - ce qu'il faut savoir avant de toucher au code

Appli web statique de birding, en français. Pas de framework, pas de build : trois fichiers
servis tels quels. `app.js` fait 2,35 Mo (mesuré le 2026-09-27), et sa taille reste un choix : le code et les tables
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
tools/verif/      les bancs de mesure - voir plus bas
data/             les données générées, publiées telles quelles
demo/             la démo du portfolio, générée - voir notes-privees/MODE-DEMO.md
docs/             les documents de travail publiés avec le dépôt
notes-privees/    les notes gardées hors du dépôt public, exclues par .gitignore
```

## Voir le résultat avant de pousser

Mathis regarde l'appli sur **http://localhost:8765**, servie depuis le dépôt lui-même :
`npx --yes http-server . -p 8765 -c-1`, configurée dans `.claude/launch.json` sous le nom
`ornitheque-dev`. Lui dire « regarde en local », pas « j'ai poussé ».

**Le premier rechargement montre encore l'ancienne version** : le service worker sert sa copie
en cache et ne la remplace qu'au chargement suivant. Recharger deux fois, ou une fois avec
Ctrl+Maj+R.

## Déployer

**Pousser sur `main`, c'est déployer.** GitHub Pages sert la branche directement. Avant
chaque commit qui touche `app.js`, `styles.css` ou `index.html`, trois nombres à monter,
sinon les visiteurs gardent l'ancienne version en cache :

1. `CACHE_VERSION` dans `service-worker.js`
2. `app.js?v=NNN` dans `index.html` - **il y a DEUX occurrences**, le `modulepreload` et le
   `<script>`. En oublier une ne casse rien tout de suite, ce qui est pire.

**Le poids publié se mesure avec `node tools/build/poids-publie.mjs`, jamais avec `du`.**
`du -sh` compte ce que `.gitignore` exclut : il annonçait 469 Mo le 2026-09-28 et m'a fait
alerter à tort sur le plafond de 1 Go de GitHub Pages. Le vrai chiffre est **95,4 Mo, 9 % du
plafond**. Les cartes de répartition vivent dans le dépôt séparé
`ornitheque-data`, et `data/range*` comme `data/generated` ne sont pas publiés.
Ce dépôt-là pèse 250 Mo servis - 142 Mo de `range-weekly`, 108 Mo de `range` - mesuré le
2026-09-28. Les 443 Mo que ce fichier annonçait avant comptaient le dossier `.git` : c'est
l'encombrement sur le disque, pas ce que GitHub Pages sert.

## Les pièges qui m'ont déjà fait perdre du temps

**`node --check app.js` ne marche pas** : la commande suppose du CommonJS et `app.js` est un
module. Utiliser `node --input-type=module --check < app.js`.

**Les fins de ligne sont MÉLANGÉES dans le dépôt**, et ce fichier se trompait sur la
répartition jusqu'au 2026-09-29. Compté, pas supposé : `app.js`, `index.html` et ce
`CLAUDE.md` sont en **CRLF** ; `styles.css`, `service-worker.js` et `tools/` en **LF**.
Un script qui découpe sur `\n` seul laisse un `\r` traîner en fin de ligne, un script qui
découpe sur `\r\n` en dur ne voit qu'une seule ligne dans `styles.css`. Détecter le
séparateur, ne jamais le supposer, et réécrire avec celui du fichier - c'est exactement la
panne que la section « Déployer » redoute pour les deux occurrences d'`app.js?v=`.
La commande qui tranche :

```
node -e "const b=require('fs').readFileSync(process.argv[1]);let c=0,l=0;for(let i=0;i<b.length;i++)if(b[i]===10){b[i-1]===13?c++:l++};console.log('CRLF='+c,'LF='+l)" FICHIER
```

**Une importmap ne s'applique PAS à un `<link rel="modulepreload">`.** Le preload garde l'URL
écrite telle quelle. La démo détournait bien les trois modules Firebase vers ses bouchons, et
les téléchargeait quand même depuis gstatic. Invisible à l'œil, attrapé par `tools/verif/demo.mjs`
le 2026-09-28.

**`index.html` n'a ni `<head>` ni `<body>`**, les deux sont implicites. Un générateur qui
cherche l'un ou l'autre échoue - c'est déjà arrivé deux fois. L'ancre fiable est
`<meta charset="utf-8">`.

**Les heredocs du shell mangent les échappements.** `\\n` devient un vrai retour à la ligne,
`\.` dans une expression régulière perd son antislash. Pour tout ce qui contient des
échappements, passer par les outils Write / Edit, jamais par `cat <<'FIN'`.

**Un accent grave dans un littéral de gabarit le referme** - y compris dans un commentaire à
l'intérieur. Les générateurs de `tools/verif/` en sont pleins : y écrire « la variable ok »
et non « la variable \`ok\` ». Ça m'a coûté deux erreurs de syntaxe le même jour.

**`body { zoom: 0.85 }`.** `getBoundingClientRect` renvoie donc des pixels ÉCRAN, alors que
les styles calculés et les métriques du canvas parlent en pixels CSS. Mélanger les deux m'a
fait produire trois mesures fausses d'affilée. Mesurer tout dans un seul repère.

**Centrer un texte, c'est centrer son ENCRE, pas sa boîte.** Pour une capitale ou un chiffre,
l'encre va de la ligne de base à la hauteur de capitale ; la boîte, elle, descend jusqu'à la
descendante, que ces caractères n'utilisent pas. L'écart vaut
`(ascendante − descendante − hauteur de capitale) / 2`, soit 0,064 em en Segoe UI. Centrer la
boîte pose le texte trop bas - visiblement.

**`pointer-events="none"` sur un `<g>` SVG se transmet aux enfants**, et un `<g>` qu'on oublie
de fermer est refermé par le navigateur à la fin du parent : tout ce qui suit devient
incliquable sans une erreur. C'est arrivé à la Petite couronne.

**`:where()` ne compte pour rien dans la spécificité.** Deux règles à spécificité égale : la
dernière écrite gagne. Un `cursor:help` écrit à la main plus bas dans le fichier annulait la
règle générale du curseur dessiné.

**Firestore ne rejoue JAMAIS un écouteur refusé.** Depuis que les fiches membres sont
réservées aux membres (2026-09-28), les 15 abonnements sont refusés au démarrage pour qui
n'est pas encore inscrit. Après un premier dépôt réussi, plus aucun snapshot n'arrivait :
la liste était bien enregistrée, mais la page restait sur « … enregistrement » et le nom
affichait « Sans nom ». Il faut rappeler `subscribe()` après le dépôt. Corollaire général :
tout ce qui devient permis APRÈS le démarrage exige un ré-abonnement explicite.

**Masquer l'interface n'est pas la vider.** Se déconnecter posait seulement une classe CSS
sur `<html>` : `realPeople`, la liste chargée, le nom et le classement restaient en mémoire de
l'onglet. Qui se reconnectait avec un AUTRE compte retrouvait l'écran du précédent, alors que
Firestore ne lui répondait plus rien. Les règles tenaient, l'écran mentait - et personne ne va
vérifier ce qu'un écran affiche. Depuis le 2026-09-28, changer de compte recharge la page :
c'est la seule remise à zéro qui n'oubliera pas la variable ajoutée demain.

**Un refus de lecture est souvent un état normal, pas une panne.** Trois écrans annonçaient
« pas encore activé (règles Firebase) » à quelqu'un qui n'avait simplement pas déposé sa
liste, ce qui fait croire le site cassé. `_txtAccesMembres()` choisit le texte selon le code
d'erreur : `permission-denied` invite à rejoindre la ligue, le reste garde le message
technique. Et un panneau masqué faute de données laisse une page blanche : le classement
n'affichait RIEN, pas même son titre.

## Comment travailler ici

**Mesurer avant d'affirmer.** Un banc de mesure qui imprime des chiffres vaut mieux qu'une
capture d'écran regardée de près - surtout pour l'alignement, les tailles et les écarts.
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

Après toute retouche de l'entête du panneau, des sélecteurs, des pastilles ou des cartes :
`node tools/verif/tous.mjs`, chaque banc finit par `CONFORME` ou `DÉFAUT`. **Un crochet le fait
tout seul** : `.claude/hooks/verif-avant-fin.mjs`, branché sur l'événement `Stop`, rejoue tous les
bancs et refuse de laisser une réponse finir tant qu'un banc est en défaut, dès qu'`app.js`,
`index.html` ou `styles.css` sont modifiés et pas encore commités. Après une retouche
d'`index.html` : `node tools/build/genere-demo.mjs`. Le reste (bancs demo, trophees, firestore,
en écrire un) : skill `bancs-de-mesure`.

**Une cible tactile s'écrit 52 px pour en faire 44.** `body` porte `zoom:0.85`, donc le seuil
de 44 px d'écran (Apple, Material, WCAG 2.5.5) se traduit par 52 px dans la CSS. Tout ce qui
concerne le doigt vit dans un `@media (pointer: coarse)` en fin de `styles.css` - l'affichage
à la souris ne bouge pas. **`pointer: coarse` ne se simule pas avec `hasTouch`** : il faut
`isMobile: true`, sinon on mesure l'affichage souris en croyant mesurer le doigt. Le banc
`accessibilite` vérifie les deux à la fois, et refait au passage le tour de ce qu'un lecteur
d'écran annonce (région vivante, rangées d'onglets, noms des commandes).

**Le plafond qui cédera le premier est Firestore, pas GitHub Pages.** Chaque document modifié
coûte **une lecture par client abonné** : à 50 connectés, une frappe dans le chat coûte 50
lectures, soit 1 000 frappes par jour avant le plafond gratuit de 50 000. Mesuré par le banc
`firestore`, qui compte aussi les 14 abonnements ouverts à la connexion.

## Données eBird

**Le jeton eBird d'`app.js` est public, et c'est assumé.** Le dépôt est public et l'appli
appelle l'API eBird depuis le navigateur du visiteur : le jeton part forcément avec le code,
le ranger ailleurs ne le cacherait qu'à nous. Le masquer vraiment demanderait de faire passer
tous les appels par un serveur à nous, donc de quitter GitHub Pages. Décision prise le
2026-09-28 : on ne change rien, le jeton ne lit que des données eBird publiques, pas le
compte ni les listes. Le cookie, lui, reste hors dépôt - c'est lui le vrai secret.

Récolte et vérification des données (bar charts, fréquences, injecteur, zones, mur anti-robot) :
skill `donnees-ebird`. Le piège qui a déjà fait conclure à tort : eBird refuse le mode invisible,
donc **0 espèce en `headless` ne dit rien sur la zone, seulement sur le mur anti-robot**.
