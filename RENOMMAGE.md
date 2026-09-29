# Renommer l'appli et ses deux dépôts

Document de travail, écrit le 2026-09-28. À supprimer une fois l'opération finie.

## ÉTAT AU 2026-09-29 - **fait et en ligne**, sauf le dossier local

Le nom est **L'Ornithèque**, `<nom>` = `ornitheque`. Neuf étapes sur dix sont finies et
vérifiées. Il ne reste que l'étape 10, à faire app fermée.

| Étape | État |
|---|---|
| 0. Dépôt propre | fait |
| 1. Dépôt de données renommé `ornitheque-data` | fait, Pages vérifié, image servie en 402 Ko |
| 2. Adresse locale du dépôt de données | fait (lancée par Mathis, je n'en ai pas le droit ici) |
| 3. Adresse des données dans le code | fait |
| 4. Dépôt de l'appli renommé `ornitheque` | fait |
| 5. Adresse locale + chemin du service worker | fait |
| 6. `Ligue_des_Plumes` recréé avec ses redirections | fait, **les deux testées dans un navigateur** |
| 7. Le nom affiché | fait, démo régénérée |
| 8. Les documents | fait, dont 32 chemins absolus dans 12 scripts R |
| 9. Vérifier | fait : 9 bancs conformes, 95,9 Mo publiés, site et démo en ligne sans erreur |
| 10. Le dossier local | **fait** le 29/09, au redémarrage de Windows - vérifié |

**Vérifié en ligne le 29/09** : `.../Ligue_des_Plumes/` arrive sur `.../ornitheque/` et
`.../Ligue_des_Plumes/demo/` sur `.../ornitheque/demo/` - le chemin est gardé, c'était tout
l'intérêt de la page 404.

La copie locale du dépôt de redirection est dans `Documents/Projets/Ligue_des_Plumes_redirection`.
Il ne sera plus jamais retouché.

**Pour l'étape 10** : le dossier de mémoire pèse 500 Mo, il faut le **renommer**, pas le copier.
`...-Ligue-des-Plumes` devient `...-ornitheque` - les tirets bas deviennent des tirets, c'est
la convention visible dans `.claude/projects`. Penser aussi à `Ligue_des_Plumes_data`, qui
devient `ornitheque-data` pour rester aligné sur son dépôt.


## Le dossier local, renommé le 2026-09-29

Le dossier ne pouvait pas être renommé à chaud : l’application Claude le tenait ouvert, et
Windows refuse de renommer un dossier qu’un programme a ouvert. Mesuré, pas supposé - le
script de diagnostic a compté 22 processus Claude vivants, et aucun autre programme en cause.

Le renommage est donc passé par le mécanisme dont les mises à jour système se servent pour
remplacer des fichiers en cours d’usage : `MoveFileEx` avec l’option
`MOVEFILE_DELAY_UNTIL_REBOOT`, qui fait exécuter l’opération par Windows au tout début du
démarrage suivant, avant le lancement du moindre programme. Il faut les droits administrateur,
une seule fois.

**Vérifié après le redémarrage** : `Documents/Projets/ornitheque` existe,
`Ligue_des_Plumes` n’existe plus, `git rev-parse` répond depuis le nouveau chemin, et plus
aucun fichier suivi ni aucun réglage de `.claude/` ne contient l’ancien nom.

**La mémoire de Claude** est sous le nouveau nom, 499,8 Mo. Ses 15 fichiers de mémoire avaient
été recopiés dans l’ancien emplacement le temps du redémarrage, pour qu’aucune conversation
ne démarre sans mémoire entre-temps ; cette copie n’est plus qu’un résidu.

**Le dossier de données** est renommé en `ornitheque-data` depuis le 29/09.

**Deux chiffres du plan étaient faux, mesurés depuis** : les chemins absolus sont dans **12**
scripts R et non 17, et **11** lignes de `DEPLOY-MIGRATION.md` et non 3. Tous corrigés.

**Ce qui NE doit toujours pas être touché** : le projet Firebase reste `ligue-des-plumes`
(`.firebaserc` et les lignes 9 à 11 d'`app.js`), les autorisations Firebase et la CSP.
Vérifié après coup : ces lignes sont intactes.

**Deux chiffres du plan étaient faux, mesurés depuis** : les chemins absolus sont dans
**12** scripts R et non 17, et **11** lignes de `DEPLOY-MIGRATION.md` et non 3. Tous
corrigés.

**Pour l'étape 10**, la mémoire pèse **500 Mo** : il faut la **renommer**, pas la copier.
Le dossier `...-Ligue-des-Plumes` devient `...-ornitheque` - les tirets bas deviennent des
tirets, c'est la convention visible dans `.claude/projects`.

## Ce qui est arrêté, ce qui ne l'est pas

| Point | État |
|---|---|
| Nom de l'appli | **en attente** : Ornithèque, La Huppe ou La Nichée, soumis aux amis |
| Convention des dépôts | arrêtée : `<nom>` et `<nom>-data`, minuscules et traits d'union |
| Dossier local | arrêté : même nom que le dépôt, renommé en dernier, session fermée |
| Portfolio | arrêté : **plus tard, à part**, pas le même jour |

Dans tout ce qui suit, `<nom>` est le nom retenu en minuscules avec traits d'union
(`ornitheque`, `la-huppe` ou `la-nichee`) et `<Nom>` est le nom tel qu'il s'affiche
(`Ornithèque`, `La Huppe` ou `La Nichée`).

## Ce qui ne change pas, et pourquoi

Quatre choses ont l'air concernées et ne le sont pas. Autant le savoir avant de s'inquiéter.

- **Le projet Firebase reste `ligue-des-plumes`.** Google ne permet pas de renommer un projet.
  C'est invisible pour les visiteurs. `.firebaserc` et la configuration en tête d'`app.js`
  ne doivent surtout pas être touchés, sous peine de couper les comptes et la base.
- **Les autorisations Firebase ne bougent pas.** Elles portent sur le domaine
  `mathiiis7.github.io`, qui ne change pas : seul le chemin derrière change.
- **Les règles de sécurité CSP d'`index.html` ne bougent pas** non plus, pour la même raison :
  elles citent le domaine, jamais le chemin.
- **`start_url` et `scope` du manifeste ne bougent pas** : ils valent `./`, donc relatifs.

## Le piège à ne pas manquer

`service-worker.js` ligne 78 contient le chemin en dur `'/Ligue_des_Plumes/'`. C'est la ligne
qui dit au cache de toujours aller chercher la page d'accueil sur le réseau plutôt que dans sa
copie. Si on l'oublie, le site marche - et les visiteurs restent bloqués sur l'ancienne version
sans que rien ne le signale. C'est exactement le genre de panne que le `CLAUDE.md` redoute.

---

## Déroulé, tout le même jour

Les étapes marquées **TOI** sont des clics sur GitHub. Les étapes marquées **MOI** sont des
modifications de fichiers que je fais ici.

### 0. Partir d'un dépôt propre - MOI

`git status` vide et tout poussé, sur les deux dépôts. Je prépare aussi à l'avance la
modification de l'étape 3, pour que la coupure de l'étape 1 dure une minute et pas dix.

### 1. Renommer le dépôt de données - TOI

1. Ouvrir `https://github.com/Mathiiis7/Ligue_des_Plumes_data`
2. Onglet **Settings** (en haut à droite du dépôt, pas celui du compte)
3. Tout en haut, champ **Repository name** : effacer, taper `<nom>-data`
4. Bouton **Rename**
5. Toujours dans Settings, menu de gauche → **Pages** : vérifier que la source est restée
   *Deploy from a branch*, branche `main`, dossier `/ (root)`
6. Attendre une à deux minutes, puis ouvrir dans un navigateur :
   `https://mathiiis7.github.io/<nom>-data/range/barswa.png` - une image doit s'afficher

**À partir d'ici et jusqu'à la fin de l'étape 3, les cartes de répartition ne s'affichent plus
sur le site en ligne.** C'est normal, ça dure le temps d'un commit.

### 2. Dire à ton ordinateur où est le dépôt de données - MOI

Dans le dossier `Ligue_des_Plumes_data` :
`git remote set-url origin https://github.com/Mathiiis7/<nom>-data.git`

La redirection automatique de GitHub ne suffit pas ici : elle disparaîtra dès qu'un dépôt
reprendra l'ancien nom.

### 3. Corriger l'adresse des données dans le code - MOI

| Fichier | Ce qui change |
|---|---|
| `app.js` ligne 12286 | `WEEKLY_DATA_BASE` → `https://mathiiis7.github.io/<nom>-data` |
| `.gitignore` ligne 59 | le commentaire qui cite l'ancien nom |
| `tools/ebirdst/DEPLOY-MIGRATION.md` | six mentions de l'ancien nom |

C'est **la seule adresse de données du projet** : les lignes 12224, 12370 et 12491 d'`app.js`
la réutilisent, elles n'en ont pas d'autre. Vérifié par recherche sur tout le dépôt.

Puis commit et push : les cartes reviennent.

### 4. Renommer le dépôt de l'appli - TOI

1. Ouvrir `https://github.com/Mathiiis7/Ligue_des_Plumes`
2. **Settings** → champ **Repository name** → `<nom>` → **Rename**
3. Settings → **Pages** : vérifier la source, comme à l'étape 1
4. La nouvelle adresse est `https://mathiiis7.github.io/<nom>/`

**À partir d'ici et jusqu'à la fin de l'étape 6, l'ancien lien de tes amis ne marche plus.**

### 5. Adresse locale et chemin en dur - MOI

| Quoi | Ce qui change |
|---|---|
| dépôt local | `git remote set-url origin https://github.com/Mathiiis7/<nom>.git` |
| `service-worker.js` ligne 78 | `'/Ligue_des_Plumes/'` → `'/<nom>/'` - **le piège ci-dessus** |
| `service-worker.js` ligne 6 | `CACHE_VERSION` monté d'un cran |
| `index.html` lignes 43 et 1240 | `app.js?v=239` → `?v=240`, **les deux occurrences** |

### 6. Recréer l'ancien lien - TOI puis MOI puis TOI

C'est ce qui sauve le lien qu'ont tes amis.

1. **TOI** : sur GitHub, bouton **+** en haut à droite → **New repository**
   - Repository name : exactement `Ligue_des_Plumes`, majuscules et tirets bas compris
   - Public
   - **Ne rien cocher** : ni README, ni .gitignore, ni licence
   - **Create repository**
2. **MOI** : je prépare deux fichiers, copiés sur ta page `portfolio-sig` qui marche déjà :
   - `index.html`, qui renvoie vers `https://mathiiis7.github.io/<nom>/`
   - `404.html`, qui renvoie en **gardant le chemin** : ceux qui ont gardé le lien de la démo
     `.../Ligue_des_Plumes/demo/` atterriront sur `.../<nom>/demo/` et pas sur une page d'erreur.
     Ta page portfolio ne fait pas ça ; ici ça vaut le coup, la démo circule.
3. **TOI** : pousser, puis **Settings** → **Pages** → source *Deploy from a branch*, branche
   `main`, dossier `/ (root)` → **Save**. Attendre une à deux minutes.

Créer un dépôt qui porte l'ancien nom annule la redirection automatique que GitHub avait posée
au renommage. C'est voulu : c'est notre page qui prend le relais, et elle, elle est durable.

### 7. Le nom affiché dans l'appli - MOI

| Fichier | Combien |
|---|---|
| `index.html` | 9 endroits : titre de l'onglet, nom iOS, trois textes de remplacement d'images, deux titres, l'à-propos, le pied de page |
| `manifest.json` | `name` et `short_name` |
| `app.js` | 3 messages vus par l'utilisateur : accès suspendu (5887), texte et titre de partage (10229-10230) |
| `tools/build/genere-demo.mjs` ligne 148 | le nom de la ligue de démonstration |
| `tools/createur-badge.html`, `tools/generateur-trophees.html` | leurs titres |

Puis `node tools/build/genere-demo.mjs`, parce que `demo/index.html` et `demo/donnees.js` sont
**générés** : on ne les modifie jamais à la main.

### 8. Les documents - MOI

`CLAUDE.md`, `README.md`, `RESUME-PROJET.md`, `MODE-DEMO.md`, et le nom du serveur local dans
`.claude/launch.json` (`ligue-plumes-dev` → `<nom>-dev`, cité dans `CLAUDE.md`).

`package-lock.json` porte aussi l'ancien nom : purement cosmétique, npm le réécrit tout seul.

### 9. Vérifier - MOI

Dans cet ordre, et je te dis ce que chacun a donné :

1. `node --input-type=module --check < app.js` - la syntaxe tient
2. `node tools/verif/tous.mjs` - les 9 bancs de mesure, dont celui de la démo
3. `node tools/build/poids-publie.mjs` - le poids publié n'a pas bougé
4. **localhost:8765**, rechargé deux fois - tu regardes
5. Une fois poussé : `https://mathiiis7.github.io/Ligue_des_Plumes/` renvoie bien vers le
   nouveau site, et `.../Ligue_des_Plumes/demo/` vers la nouvelle démo
6. Le nouveau site affiche une carte de répartition - donc les données suivent
7. La démo se charge et répond dans son chat

### 10. Le dossier local - FAIT le 29/09

**Deux choses cassent au renommage du dossier, et elles doivent être réglées AVANT.**

- **17 scripts R de `tools/ebirdst/` contiennent le chemin absolu en dur**
  (`C:/Users/mathi/Documents/Projets/Ligue_des_Plumes/...`), plus 3 lignes de
  `DEPLOY-MIGRATION.md`. Ce sont les outils de la migration des habitats IUCN, encore en
  attente : si on ne les corrige pas, ils échoueront le jour où tu reprendras ce chantier,
  et loin d'ici. **Je les corrige à l'étape 8.**
- **La mémoire de Claude pour ce projet est rangée sous l'ancien chemin.** Elle est retrouvée
  par le nom du dossier : après le renommage, une nouvelle session démarrera sans rien savoir
  du projet. Il faut copier le dossier
  `C:\Users\mathi\.claude\projects\C--Users-mathi-Documents-Projets-Ligue-des-Plumes`
  vers le nom correspondant au nouveau chemin. **Je te donnerai la commande exacte.**

Les deux points ont été réglés avant le renommage, et le renommage lui-même est passé par
un redémarrage de Windows - voir « Le dossier local, renommé le 2026-09-29 » plus haut.

---

## Récapitulatif de tes clics

| Moment | Où | Quoi |
|---|---|---|
| Étape 1 | dépôt `Ligue_des_Plumes_data` → Settings | renommer en `<nom>-data`, vérifier Pages |
| Étape 4 | dépôt `Ligue_des_Plumes` → Settings | renommer en `<nom>`, vérifier Pages |
| Étape 6 | GitHub → New repository | créer `Ligue_des_Plumes` vide, puis activer Pages |
| Étape 10 | explorateur Windows | renommer le dossier, app fermée |

Quatre interventions. Tout le reste est de mon côté.
