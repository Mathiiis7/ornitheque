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

## Rangement

Règles communes : `~/Documents/Projets/qg/structure/rangement.md`. Mis en place le 2026-10-04
(`tools/` est devenu `outils/`). Rien d'autre à la racine que ce qui suit.

```
le produit, servi en ligne - ne jamais déplacer ni renommer (chaque fichier a une adresse)
  index.html        le squelette et les <template>
  app.js            tout le code, et les tables qui servent partout
  styles.css        toute la CSS
  service-worker.js le cache
  manifest.json     le manifeste de l'appli installable
  assets/           images, logos, polices
  data/             les données générées, publiées telles quelles
  demo/             la démo du portfolio, générée - voir notes-privees/MODE-DEMO.md

exigé à la racine par un outil
  README.md                   GitHub l'affiche
  _config.yml                 Jekyll (GitHub Pages) : retire docs/, outils/, CLAUDE.md, en-cours.md du site
  .gitignore, .git/           git
  .claude/                    Claude Code (réglages, crochet, skills)
  firebase.json, .firebaserc  Firebase ; firebase.json pointe vers outils/config/firestore.rules
  package.json, package-lock.json, node_modules/   Node, pour les scripts d'outils/
  .impeccable/, .onetake/     ateliers locaux de deux extensions, ignorés par git

la base commune
  CLAUDE.md, en-cours.md
  docs/             les documents de travail - sur GitHub, pas sur le site
  outils/           les scripts - sur GitHub, pas sur le site
    build/            les générateurs de données (Node, ESM)
    verif/            les bancs de mesure - voir plus bas
    ebirdst/          les scripts R (chemins absolus en dur)
    onetake/          la vidéo de présentation
  archives/         pas encore créé : à ouvrir le jour où un chantier fini doit y aller

propre au projet
  notes-privees/    notes gardées hors du dépôt public, exclues par .gitignore
```

**Un fichier ignoré qui vit dans `outils/` s'ignore sous ce nom-là.** La clé Firebase et les
sauvegardes Firestore (données personnelles) sont dans `.gitignore` sous `outils/...` : renommer
un dossier sans corriger `.gitignore` les rendrait visibles pour git.

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

**Le poids publié se mesure avec `node outils/build/poids-publie.mjs`, jamais avec `du`.**
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

**Les fins de ligne sont mélangées DANS LE DOSSIER DE TRAVAIL, jamais dans le dépôt.** Ce
fichier a raconté deux versions fausses avant celle-ci, la dernière le 2026-09-29. La vraie :
`core.autocrlf` vaut `true` et il n'y a pas de `.gitattributes`, donc **git stocke tout en LF**
et rend du CRLF au moment de sortir un fichier. Ce qui varie, c'est le dossier de travail : un
fichier fraîchement sorti de git est en CRLF, un fichier réécrit par un de nos scripts garde ce
que le script a écrit - d'où `app.js` et `index.html` en CRLF mais `styles.css` et
`service-worker.js` en LF, mesuré ce jour-là.

Conséquences, dans cet ordre d'importance :
1. **Un script qui modifie un fichier lit le séparateur dans le fichier, il ne l'écrit pas de
   mémoire.** Découper sur `\n` seul laisse un `\r` en fin de ligne ; découper sur `\r\n` en dur
   ne voit qu'une seule ligne dans un fichier en LF, et ne remplace donc qu'UNE des deux
   occurrences d'`app.js?v=` - la panne que la section « Déployer » redoute.
2. Mélanger les deux dans un même fichier ne casse rien et ne se voit pas dans `git diff`
   (git normalise), mais ça fait crier `git add`. C'est un signal utile, pas une alerte.

La commande qui tranche, sur le dossier de travail :

```
node -e "const b=require('fs').readFileSync(process.argv[1]);let c=0,l=0;for(let i=0;i<b.length;i++)if(b[i]===10){b[i-1]===13?c++:l++};console.log('CRLF='+c,'LF='+l)" FICHIER
```

**Une importmap ne s'applique PAS à un `<link rel="modulepreload">`.** Le preload garde l'URL
écrite telle quelle. La démo détournait bien les trois modules Firebase vers ses bouchons, et
les téléchargeait quand même depuis gstatic. Invisible à l'œil, attrapé par `outils/verif/demo.mjs`
le 2026-09-28.

**`index.html` n'a ni `<head>` ni `<body>`**, les deux sont implicites. Un générateur qui
cherche l'un ou l'autre échoue - c'est déjà arrivé deux fois. L'ancre fiable est
`<meta charset="utf-8">`.

**Les heredocs du shell mangent les échappements.** `\\n` devient un vrai retour à la ligne,
`\.` dans une expression régulière perd son antislash. Pour tout ce qui contient des
échappements, passer par les outils Write / Edit, jamais par `cat <<'FIN'`.

**Un accent grave dans un littéral de gabarit le referme** - y compris dans un commentaire à
l'intérieur. Les générateurs de `outils/verif/` en sont pleins : y écrire « la variable ok »
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

**Une image ne voyage plus avec son document.** Depuis le 2026-09-29, une photo publiée vit
dans TROIS documents : `photos/<id>` garde un aperçu flou de 2,2 Ko et part au démarrage,
`photoThumbs/<id>` garde la vignette de 21 Ko et ne se lit qu'à l'approche de l'écran,
`photoFull/<id>` garde l'image pleine et ne se lit qu'à l'ouverture en grand. Idem pour le
tchat (`chatThumbs`, `chatFull`), sous l'identifiant du message. La vraie ligue a été migrée
le 2026-09-29 : **14 737 Ko de photos au démarrage sont devenus 212 Ko**, et l'attente entre
les abonnements et la liste est passée de 4 338 à 613 ms - écran à jour à 3 819 ms au lieu de
7 284. Les aperçus des vraies photos pèsent 3 à 7 Ko, pas les 2,2 Ko d'une image de test.
Conséquences pour qui touche à ce code :
- l'identifiant se fabrique AVANT l'écriture (`doc(collection(...))`) pour que les trois
  documents le partagent, et les lourds partent en premier ;
- retirer une photo, c'est retirer ses trois documents, et la suppression RGPD liste les
  quatre nouvelles collections ;
- le champ `image` est encore LU partout, pour les photos d'avant la séparation. Tant que la
  vraie ligue n'est pas migrée (`window.__migrerImages()`, compte admin, voir
  `notes-privees/MIGRATION-PHOTOS.md`), les deux formes coexistent, et les règles acceptent
  les deux exprès ;
- un re-rendu ne doit JAMAIS faire repartir une photo de son aperçu flou : `thumbAttrs()`
  relit le cache mémoire avant d'écrire le HTML. Le banc `photos` vérifie ce point précis.

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
Voir `outils/verif/`.

**Le démarrage est fini, ne pas le rouvrir sans nouveau chiffre.** Après la séparation des
photos, huit chargements mesurés le 2026-09-29 sur le site en ligne, connecté, cache chaud :
écran à jour entre 899 et 2 952 ms, **médiane 1 875 ms** (7 284 ms avant). Ce qui reste se
décompose en 380 ms pour reconnaître le compte et **1 411 ms d'attente de la liste des
membres**, fil principal occupé à 0 %. Cette attente varie d'un facteur 4 d'un chargement à
l'autre pour des données identiques : **ce n'est donc pas le volume.** À 15,7 Mbps mesurés,
les 275 Ko de fiches ne pèsent que 137 ms ; le reste est le temps que Firestore met à ouvrir
son canal. Alléger les listes d'espèces ferait gagner moins que le bruit de mesure, pour un
risque réel sur le cœur de l'appli. Le poids d'`app.js` (641 Ko servis, jusqu'à 3,3 s) ne se
paie qu'au premier chargement et après chaque mise en ligne, jamais en usage courant.

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
`node outils/verif/tous.mjs`, chaque banc finit par `CONFORME` ou `DÉFAUT`. **Un crochet le fait
tout seul** : `.claude/hooks/verif-avant-fin.mjs`, branché sur l'événement `Stop`, rejoue tous les
bancs et refuse de laisser une réponse finir tant qu'un banc est en défaut, dès qu'`app.js`,
`index.html` ou `styles.css` sont modifiés et pas encore commités. Après une retouche
d'`index.html` : `node outils/build/genere-demo.mjs`. Le reste (bancs demo, trophees, firestore,
photos, en écrire un) : skill `bancs-de-mesure`.

**Une cible tactile s'écrit 52 px pour en faire 44.** `body` porte `zoom:0.85`, donc le seuil
de 44 px d'écran (Apple, Material, WCAG 2.5.5) se traduit par 52 px dans la CSS. Tout ce qui
concerne le doigt vit dans un `@media (pointer: coarse)` en fin de `styles.css` - l'affichage
à la souris ne bouge pas. **`pointer: coarse` ne se simule pas avec `hasTouch`** : il faut
`isMobile: true`, sinon on mesure l'affichage souris en croyant mesurer le doigt. Le banc
`accessibilite` vérifie les deux à la fois, et refait au passage le tour de ce qu'un lecteur
d'écran annonce (région vivante, rangées d'onglets, noms des commandes).

**Écrire en boucle sature la file d'écritures de Firestore, même en attendant chacune.** La
migration du 2026-09-29 a fait remonter `resource-exhausted : Write stream exhausted maximum
allowed queued writes` après 29 photos, alors que chaque `setDoc` était attendu. Attendre
l'acquittement ne suffit pas quand les documents pèsent jusqu'à 777 Ko. Le SDK ralentit tout
seul et rien ne se perd - les 53 photos sont passées - mais il déverse une pile d'erreurs qui
fait croire à une panne. D'où `MIGRATION_PAUSE_MS` et `_ecrireEnMigrant()` : une pause de
250 ms entre deux documents, et une reprise à 3 s si la file déborde quand même. À refaire
pour tout traitement de masse.

**Un bouchon de snapshot rend `data` comme une fonction.** Dans les deux bouchons Firestore
(`outils/verif/bouchons/` et `demo/bouchons/`), `snapshot(docs)` construisait `data: () =>
arr[0].data` - or `arr[0].data` EST la fonction, pas les données. Un `getDoc` sur un document
existant rendait donc la fonction elle-même, et les vignettes arrivaient vides sans une seule
erreur. Corrigé le 2026-09-29 dans les deux, attrapé par le banc `photos`.

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

**xeno-canto fait pareil**, et l'appli le cache bien : sans agent utilisateur ordinaire, un
navigateur invisible n'obtient rien, l'appli bascule sur son recours iNaturalist dont les
enregistrements n'ont pas de sonagramme, et l'écran annonce « Pas de spectrogramme » comme si
l'espèce n'en avait pas. Diagnostiqué à tort comme un défaut de l'appli le 2026-09-30 - voir
`docs/VIDEO-PRESENTATION.md`.
