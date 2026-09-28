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
demo/             la démo du portfolio, générée - voir MODE-DEMO.md
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

**Les fins de ligne sont MÉLANGÉES dans le dépôt** : `app.js` et ce `CLAUDE.md` sont en CRLF,
`index.html` et `service-worker.js` en LF. Un script qui découpe sur `\r\n` en dur ne voit
qu'une seule ligne dans `index.html` et ne remplace donc qu'UNE des deux occurrences de
`app.js?v=` - exactement la panne que la section « Déployer » redoute. Détecter le séparateur,
ne jamais le supposer.

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

`tools/verif/` contient des pages qui font tourner les VRAIES fonctions d'`app.js` dans un
vrai navigateur et impriment des chiffres. Tout rejouer :

```
node tools/verif/tous.mjs
```

Le banc `demo` est à part : il vérifie que `demo/index.html` n'a pas pris de retard sur
`index.html`, puis charge la démo dans un vrai navigateur et envoie un message dans son chat.
Après toute retouche d'`index.html`, relancer `node tools/build/genere-demo.mjs`.

Chaque banc affiche ses mesures et se termine par `CONFORME` ou `DÉFAUT`. Les lancer après
toute retouche de l'entête du panneau, des sélecteurs, des pastilles ou des cartes : ils
attrapent les régressions qu'une capture d'écran ne montre pas.

Pour en ajouter un : copier le plus proche, il n'y a qu'un contrat - appeler `fini()` à la
fin, après avoir empilé ses vérifications avec `verif(libellé, valeur, ok)`.

Un banc peut aussi piloter le navigateur lui-même, quand une page à regarder ne suffit pas :
il exporte `mesure({ navigateur })` au lieu de `html()`, et rend `{ ok, sortie }` avec
`rapport()`. C'est le cas de `trophees`, qui charge `app.js` en entier avec Firebase bouchonné
(`tools/verif/bouchons/`, branchés par une importmap) et choisit l'ordre d'arrivée des
snapshots : c'est le seul moyen d'exercer le démarrage CONNECTÉ sans compte et sans toucher à
la vraie ligue, et il a attrapé quatre `TypeError` qui étaient en production. Il avance
l'horloge au lieu d'attendre, sinon la détection de trophées lui coûterait 14 secondes.

`firestore` se sert du même montage pour compter ce qu’une session coûte en lectures : 14
abonnements ouverts à la connexion, aucun doublon, et surtout **une lecture par client abonné**
à chaque document modifié. Avec 50 connectés, une frappe dans le chat coûte 50 lectures, soit
1 000 frappes par jour avant le plafond gratuit de 50 000. C’est ce plafond-là qui cédera le
premier si l'appli marche, bien avant la bande passante de GitHub Pages.

## Données eBird

**Le jeton eBird d'`app.js` est public, et c'est assumé.** Le dépôt est public et l'appli
appelle l'API eBird depuis le navigateur du visiteur : le jeton part forcément avec le code,
le ranger ailleurs ne le cacherait qu'à nous. Le masquer vraiment demanderait de faire passer
tous les appels par un serveur à nous, donc de quitter GitHub Pages. Décision prise le
2026-09-28 : on ne change rien, le jeton ne lit que des données eBird publiques, pas le
compte ni les listes. Le cookie, lui, reste hors dépôt - c'est lui le vrai secret.

Les fréquences viennent des bar charts eBird, fenêtre 2019-2026, **et exigent un compte** :
l'URL `barchartData` redirige vers la connexion. Le cookie se colle dans un fichier hors
dépôt, désigné par `EBIRD_COOKIE_FILE`. Les statuts exotiques, eux, se lisent sur la page
publique sans aucun compte.

La dernière année de la fenêtre est toujours incomplète. Les poids des quinzaines sont donc
ramenés à l'année - voir `tools/build/annees-par-quinzaine.mjs`, qui explique pourquoi et
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

**Le mur anti-robot refuse le mode invisible.** Mesuré le 2026-09-28 sur le même témoin à la
minute près : en `headless`, eBird rend « impossible de déterminer si vous êtes un robot » et
0 espèce ; en fenêtre visible, SI-061 rend ses 295 espèces. Une zone qui répond 0 en mode
invisible ne dit rien sur la zone, seulement sur le mur - c'est ce qui a fait conclure à tort
à un bridage. Deux commandes répondent désormais : `tools/build/etat-exotiques.mjs` pour ce
qui manque face aux listes eBird, `tools/build/verifie-zones-vides.mjs` pour trancher zone par
zone.

**« Zone vide » ou « scrape raté » : seule la page barchart ouverte dans un vrai navigateur
tranche.** Les deux sondes de l'API mentent, chacune à sa façon : `obs/recent` donne 0 pour
une commune rurale en septembre, et `spplist` compte toute l'histoire d'eBird quand le bar
chart s'arrête à la fenêtre courante. Et ne jamais conclure au bridage sans avoir chargé un
témoin connu dans la même minute : le 2026-09-27, le scraper échouait partout pendant que
LV-022 rendait ses 228 espèces en trois secondes.
