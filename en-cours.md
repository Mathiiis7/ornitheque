# COMMITÉ, PAS POUSSÉ (2026-10-22, nuit) : refonte de la page Classement (v869 / app.js?v=443)
- Qui a vu quoi : filtres repris du Birdydex (pays avec drapeaux et nombre d'espèces, fenêtre « Personnes » qui réunit « Oiseaux de » et « Colonnes », recherche identique sans suggestions), rangée de rareté seulement aux classements par rareté, X/P/N à la place de « Échappé isolé », Étranger en rond gris à tiret ; colonne Rareté en ronds (palier ou nombre de membres) + lettres X/N/P, triée et filtrée sur le chiffre affiché, 96 px, figée avec Espèce ; colonnes des personnes à 104 px (nom coupé par « … ») ; drapeau du pays à la place de la coche (17 px, 70 %) ; « Vues » supprimée ; non observés visibles quels que soient les filtres ; bordures en border-collapse:separate (voir CLAUDE.md, pièges).
- Classement du haut : trois boutons collés sous l'entête, bulles raccourcies, photos toutes à 34 px, « La plus rare » en sous-titre (rond + nom du palier), date plus pâle.
- Rareté ligue : rond du nombre de membres, une teinte (vert du site), chiffre blanc ; au-delà de 12 membres, 8 tranches de la part des membres ; « La plus rare de la ligue » en mode ligue.
- Palier 0 retiré partout : barème (lignes X P « 0 point » et N « compté à son palier »), filtre de la carte et du fil en X/P/N. Les X/P rapportent toujours 0 point (choix de Mathis).
- Birdydex : « · Anatidés » en italique. countryLabel : nom français du navigateur hors table (plus de « LK »).
- Non vérifié : le filtre X/P/N de la carte sur de vraies observations eBird (la démo ne les charge pas).
- Maquettes gardées : notes-privees/maquettes/{drapeaux,plus-rare,colonnes,separation}/.
- docs/modele-repartition.md est modifié par une autre session : pas dans ce commit.
- Mettre en ligne : il pousse quand il a regardé en local.
# POUSSÉ et vérifié en ligne (2026-10-22, 21 h 40) : cartes toutes bases GBIF, garde-fou affiné, aires iNat réparées par les tuiles (fusion 88fa77b2, v868 / 442 ; ornitheque-data 72fbd9c4 poussé juste avant)
- Fait depuis un dossier à part (fusion de mes commits avec origin/main, conflits seulement sur les versions, démo régénérée, 11 bancs CONFORME), puis main local remis sur origin/main SANS toucher aux fichiers : le travail en cours d'une autre session (filtre par pays du Classement, opts.compte / « Tous les pays » dans app.js, plus styles.css, index.html, demo/index.html) reste non commité ici, il N'EST PAS en ligne. Son index.html local dit encore app.js?v=433 : à son commit, prendre v869 / 443 ou plus.
- En ligne : app.js?v=442 servi, teinte de la Pie servie, fiches Pie / Corneille / Hirondelle ouvertes dans la démo en ligne (ordinateur, téléphone), aucune erreur.
# POUSSÉ (2026-10-22) : filtres de « Qui a vu quoi » en menus + sélecteur de pays « chargement… » (9fc70976, v866 / 440), puis filtres repris du Birdydex, plus de saut de page, nom savant des familles, statuts N X de la fiche (3b6a272a, v867 / 441). Faits depuis origin/main dans un dossier à part, supprimé. Les mêmes changements restent non commités ici dans app.js, styles.css, index.html, demo/ : identiques, ils disparaîtront au merge. Au merge des cartes : prendre v868 / 442 ou plus.
# POUSSÉ (voir tout en haut) (2026-10-22, soir) : garde-fou « aire iNaturalist » affiné, cartes régénérées
- Règle (choix de Mathis « Affiner ») : une case ajoutée par les isolées doit tomber dans l'aire iNat élargie de 2 cases (aire crue à 80 %) OU à moins de 4 cases d'une case des listes. Le premier réglage (aire seule) retirait ~6 800 vraies cases en Scandinavie à 151 espèces (Merle noir, Accenteur...) : l'aire iNat y est trop courte. Résultat : 5 698 cases retirées (494 espèces), Corneille noire Fennoscandie 1 019 -> 423 ; Mérion, Pipit N.-Z., Tarier d'Afrique, Macreuse noire, Goéland argenté toujours retirés. Teintes 5 507. Tout dans docs/sources-cartes.md.
- Vérifié : essai 22 espèces = génération complète ; avant/après sur les 10 935 espèces (seules pertes, aucun autre changement) ; par région (perdues-regions.mjs) ; fiches dans la démo, ordinateur et téléphone, aucune erreur.
- Aires iNat cassées (rapport docs/aires-inaturalist-cassees.md, commit f3c1c264) : 118 espèces refusées ont < 20 % de nos cases dans l'aire (traversée du 180e méridien : Pie, Hirondelle rustique, Colvert, Moineau domestique...). Les tuiles du site sont intactes (Pie 99,2 %, témoin Huppe identique au fichier). Goéland argenté : retraits justes (Vega et hudsonien). FAIT (accord de Mathis) : 153 espèces relues dans les tuiles (notes-privees/essai-cartes/inat-aires/aires-tuiles.json et tuiles/), 96 aires désormais crues (Pie 98,6 %), teintes 5 598, cartes régénérées (347 cases de moins, aucune espèce > 1 %). Commité dans les deux dépôts, pas poussé : même ordre de mise en ligne que ci-dessous.
- WinZip (WzBGTools64) bloquait des images : arrêté avec l'accord de Mathis ; noté dans CLAUDE.md.
- POUR METTRE EN LIGNE : 1. pousser ornitheque-data ; 2. AUSSITÔT ici : git stash (PHOTO_OVERRIDE_WIKI), git merge origin/main (conflits CACHE_VERSION et les deux app.js?v= : prendre au-dessus de la dernière version poussée, v867 / 441 ou plus au 22/10 soir, voir la ligne du dessus), genere-demo, git stash drop, bancs, pousser. Les modifications non commitées d'app.js, styles.css, index.html, demo/ sont celles des sessions photos et filtres, identiques à ce qui est en ligne.
# (avant, même jour) garde-fou, premier réglage
- outils/build/aires-inat.mjs (nouveau : lecture des aires iNat et passage en cases, partagé) ; teintes-inat.mjs l'importe (vérifié : teinte identique à l'octet, 5 501 images, json et bilan) ; cartes-gbif.mjs : une case ajoutée par les observations isolées doit tomber dans l'aire iNat élargie de 2 cases, si l'aire est crue (80 % des cases des listes dedans) ; sinon rien ne change. Les cases des listes ne sont jamais touchées.
- Essai sur 28 espèces (bilan dans notes-privees/essai-cartes/tout/cartes-bilan-essai.json) : Corneille noire 755 cases ajoutées retirées, Pipit de N.-Z. 424/424, Mérion de Lambert 441/455, Tarier d'Afrique 81 %, Talève 93 % ; Tengmalm, Grand Tétras, Gélinotte, Pic tridactyle, Chevêchette 0 à 3 ; Moyen-duc, Grand-duc, Huppe, Ortolan 5 à 13 % ; aire pas crue donc inchangés : Râle des genêts, Hirondelle, Pie, Eider à tête grise.
- La génération complète a été ARRÊTÉE au début ; ornitheque-data/cartes remis à l'état commité (b0a3c651), cartes-bilan.json aussi. SUITE : relancer `node outils/build/cartes-gbif.mjs` (~90 min, en arrière-plan), copier cartes-index.json dans data/, relancer teintes-inat.mjs, notes-privees/essai-cartes/tout/verif/nettoyer-cartes.mjs puis avant-apres.mjs et zone-avant-apres.mjs "Corvus corone" 5 32 55 72 (attendu : bien moins que 1 019 cases), voir les fiches (voir-fiches.mjs), mettre à jour docs/sources-cartes.md (limites) et CLAUDE.md (paragraphe des anciens noms), commiter dans les deux dépôts. Numéros au merge : v861 / 435 ou plus (une session photos a poussé v860 / 434).
# POUSSÉ (2026-10-22) : photos 401 à 540, commits 935b2dec (v862 / 436) puis 51b349c1 (512-1, v863 / 437). Les 540 espèces de la galerie sont faites. Fait depuis origin/main dans un dossier à part, supprimé. Puis Fauvette mélanocéphale 423-23 poussée (f60cf360, v864 / 438). Puis classement sans pointillé au survol poussé (232bb2b8, v865 / 439) ; la même retouche de styles.css traîne non commitée ici, identique. Au merge des cartes : prendre v866 / 440 ou plus.
# COMMITÉ, PAS POUSSÉ (2026-10-22) : cartes refaites avec toutes les bases GBIF (v859, app.js?v=433)
- Fait : outils/build/cartes-gbif.mjs réécrit (règle de mélange validée + 5 ajouts mesurés : atlas écarté au-delà de 4 fois eBird, trinômes vers l'espèce séparée par eBird, pas de carte pour les 173 éteintes, cartes de présence d'avant gardées sans eBird, présence d'après les listes seules). 10 935 cartes (aucune perdue), 106,2 Mo, 87 min. Teintes recalculées : 5 501 (66 perdues, 39 gagnées). 104 images retirées. Textes : sous-titre « observations GBIF » (seul le DOI est obligatoire), crédit « Toutes bases » (choix de Mathis), À propos, schéma, pied de page : DOI 10.15468/dl.vnrtqk, CC BY-NC 4.0. Tout est dans docs/sources-cartes.md, section « Refaites le 2026-10-21 ».
- Vérifié : 23 espèces identiques à la page validée (case et mois, avant la correction des noms) ; fiches ouvertes dans la démo (ordinateur, téléphone sombre), aucune erreur ; schéma À propos sans débordement ; 11 bancs CONFORME. Contrôles dans notes-privees/essai-cartes/tout/verif/.
- Limites connues, non corrigées : noms regroupés sans sous-espèce dans certaines bases. Corneille noire en Fennoscandie 284 -> 1 019 cases pâles (Corneilles mantelées notées « Corvus corone »), Pipit de Nouvelle-Zélande en Australie (+424), Mérion de Lambert (+455), Perroquet robuste (SABAP2). Chouette lapone : un seul point, près d'Ottawa. Piste proposée à Mathis : n'ajouter les observations isolées que dans l'aire estimée iNaturalist.
- POUR METTRE EN LIGNE, après son accord : 1. pousser ornitheque-data (commits 44f997e9 teintes + b0a3c651 cartes) ; 2. AUSSITÔT après, ici (les nouvelles images remplacent les anciennes : entre les deux poussées, le site en ligne les placerait avec les anciens cadres) : `git stash` (les lignes PHOTO_OVERRIDE_WIKI restées non commitées, identiques à be1044ad), `git merge origin/main` (conflits sur CACHE_VERSION et les deux app.js?v= : garder v859 / 433 ; demo/ : relancer genere-demo), `git stash drop`, bancs, puis pousser.
# POUSSÉ (2026-10-22) : 54 photos choisies (343 à 400), commit ca5ccead, v860 / 434 ; puis 367 et 396 figées, commit c3739256, v861 / 435 - AU-DESSUS du v859 / 433 des cartes : au merge des cartes avec origin/main, prendre v862 / 436 ou plus. Fait depuis origin/main dans un dossier à part (supprimé). Galerie refaite : restent 401+ (183, 267 sans choix). 366, 367, 396, 398 : photo actuelle gardée, toutes figées en ligne. Les lignes PHOTO_OVERRIDE_WIKI des 47 précédentes sont encore non commitées dans app.js local (identiques à be1044ad) ; celles des 54 ne sont qu'en ligne, le merge les apportera.
# POUSSÉ (2026-10-22) : 47 photos choisies (270-14, 275-312, 329-336), commit be1044ad, v858 / 432.
# ATTENTION AVANT TOUT PUSH (2026-10-22) : main local est « ahead 9, behind 4 » (cartes commitées ici, photos poussées depuis un dossier à part)
- Les photos 174 à 342 sont parties en ligne SANS la teinte ni les cartes (choix de Mathis) : commits faca2036 (v855, app.js?v=429) puis 510d46a3 (v856, app.js?v=430 : 183, 267, 318, 321), faits depuis origin/main dans un dossier à part, déjà supprimé. puis 74267cc0 (v857, app.js?v=431 : 238-51, Océanite tempête, Wikimedia Commons). Numéro suivant : au-dessus de v857 / 431.
- Océanite tempête (238) : 3e passe refusée (oiseaux tenus en main par des soigneurs). 4e passe triée à l oeil (captive=false + planche BROUILLON=1, puis GARDER=ids) : 13 photos d oiseaux en mer ou en vol, candidates 37 à 49, refusées aussi (« plus proches, meilleure qualité »). 5e passe : 6 photos Wikimedia Commons (outils/commons.mjs, candidates 50 à 55) ; iNaturalist n a que des oiseaux lointains pour elle. appliquer.mjs crédite alors « Wikimedia Commons ».
- Avant de pousser main : `git merge origin/main` (une fois les cartes commitées). Le bloc PHOTO_OVERRIDE_WIKI d'app.js local est IDENTIQUE octet pour octet à celui poussé : pas de conflit là. Conflits attendus seulement sur CACHE_VERSION et les deux app.js?v= : prendre un numéro AU-DESSUS de v855 / 429 (le 428 du dossier de travail est déjà dépassé).
- Photos : 291 espèces faites. 183 et 267 sans choix (photo inchangée, restent dans la galerie). « Aucune ne convient » 238, 318, 321 : 12 nouvelles candidates chacune (numéros 13 à 24, outils/autres-candidates.mjs ; la galerie ne montre plus que les nouvelles). Restent aussi 275-312, 329-336 et 343+.

# FAIT (2026-10-22, voir tout en haut) : refaire toutes les cartes avec la règle de mélange ci-dessous
- Son choix : « Oui, refais tout » (année + 12 mois avec VOISINS=1, puis la teinte iNaturalist recalculée). Il regarde en local avant de mettre en ligne.
# (avant) règle de mélange des sources des cartes, page validée
- Page : http://localhost:8765/notes-privees/maquettes/melange/index.html (donnees.mjs la refait en 10 s). Cartes de l'ANNÉE seulement, 23 espèces de docs/cartes-combler-les-trous.md. Rien de changé dans l'appli ni dans les cartes.
- Règle proposée : base = eBird + listes complètes (SABAP2, Kenya, Nigeria dédoublonné par le max case-mois, le fichier n'a pas l'année) dans un même numérateur et dénominateur ; isolées (iNat, Artportalen, Observation.org, RU-BIRDS...) SEULEMENT dans les cases où la base a < 30 obs brutes, avec leur dénominateur, remises à l'échelle par un rapport par espèce (médiane base / médiane isolées sur les cases à effort lissé >= 300 des deux côtés) ; si cet étalonnage ne bat pas un niveau médian constant sur ces cases (Martinet noir : 8,3 contre 6,5 niveaux), les cases ajoutées prennent le niveau médian ; rangs calculés sur les cases de la base seules.
- Garde-fou par atlas (SEUIL_ATLAS 0,25) : un atlas n'entre dans la base d'un oiseau que s'il le note au moins au quart du taux d'eBird, sur les cases où les deux ont >= 300 obs/an. Les atlas du Nigeria n'ont que 4 Bulbuls des jardins sur GBIF (vérifié, noms-nigeria.mjs) : écartés pour lui (sinon -13 crans au Nigeria, verif-nigeria.mjs). Tous les autres atlas : 0,6 à 1,7 fois eBird.
- Mesures : +0,4 % à +38 % de cases ; aucune case déjà colorée ne change pour les 12 espèces sans données d'atlas africain, les autres bougent de 1 à 2,4 crans en moyenne ; étalonnage 2,3 à 8,3 niveaux d'écart contre 6,5 à 8,4 pour un niveau constant. Contrôle : eBird du nouveau fichier = carte en ligne (92-94 % identiques, le reste à 1 cran ; probablement le filtre incertitude <= 10 km, non vérifié).
- Mois (mois.mjs, pas d'images) : règle + VOISINS sur les 12 mois, +14 % à +168 % de cases par mois ; Europe en janvier : Martinet 7 -> 10, Guêpier 2 -> 3, Pie-grièche 2 -> 3, Hirondelle 374 -> 515.
- « Tout additionné » écarté : Mésange charbonnière +6,5 crans en France ; Oiseaux des Jardins = 9,0 % de mésanges contre 2,4 % dans eBird France (API GBIF, part-jardins.mjs). L'Aigle royal, lui, ne bouge pas (+0,1).
- TROUVÉ : les autres bases sont nommées selon le référentiel GBIF, pas eBird. SABAP2 + Kenya perdaient 6,2 % de leurs oiseaux, le Nigeria 7 % (Huppe d'Afrique, Rougegorge du Cap, Petit Gravelot...), ce qui diluait l'effort (Huppe : 14 653 cases changées -> 5 651). Table notes-privees/essai-cartes/gbif-noms-autres.json (376 noms ; melange/noms-autres-bases.mjs : nom nettoyé, sous-espèces eBird, synonymes GBIF, nom anglais ; détail noms-autres-bases.tsv) : reste 6 386 obs perdues sur 279 M. À BRANCHER dans cartes-gbif.mjs.
- Outils : notes-privees/essai-cartes/melange/ (extraire.mjs lit gbif-tout.zip en 112 s par morceaux, SABAP2 / Kenya / Nigeria A / Nigeria B gardés à part ; noms-manquants.mjs, noms-autres-bases.mjs, reste-perdu.mjs, part-jardins.mjs, noms-nigeria.mjs) ; page et calculs dans notes-privees/maquettes/melange/ (donnees.mjs, mois.mjs, verif-nigeria.mjs).
- S'IL DIT OUI (conversation neuve conseillée) : adapter cartes-gbif.mjs (lire gbif-tout.zip avec le lecteur par morceaux de bilan-gbif-tout.mjs, pas readline ; CAP pour 76 M lignes ; table des noms ; garde-fou par atlas ; la règle ; VOISINS=1 pour les mois), régénérer, recalculer la règle des 80 % des teintes, il pousse ornitheque-data PUIS l'appli, À propos : cartes en CC BY-NC, citer 10.15468/dl.vnrtqk.
---
# POUSSÉ (2026-10-21) : plus rares sans exotiques N (v849, app.js?v=423, commit ce83974f)
- « La plus rare en France » (classement) et « Les N plus rares en France » des uniques (profil) écartent désormais toutes les exotiques, N compris. X/P/C l'étaient déjà ; Mike Horn, « Tes 5 plus rares » et la stat du profil écartaient déjà les N.
- Testé dans la démo : Érismature rousse (N, palier 9) ajoutée à Lina sortait « la plus rare » avant, Torcol (palier 7) après. 11 bancs CONFORME.
- Non touché : le score de rareté (scoreReal) compte encore les N ; ce n'est pas une phrase « plus rare ».
---
# EN LOCAL, PAS POUSSÉ (2026-10-21) : teinte iNaturalist (v853, app.js?v=427) ; GBIF « toutes bases » téléchargé et mesuré
- POUR METTRE EN LIGNE : pousser ornitheque-data D'ABORD (commit 44f997e9, 5 528 <code>-t.png, 6,66 Mo), puis ce dépôt. Dans l'autre ordre, la teinte n'apparaît pas, sans erreur.
- Teinte : toute l'aire (choix de Mathis), sous la carte de la fiche (pane zIndex 350), hors des cases colorées, légende « Aire estimée (iNaturalist) » à 14 px (la ligne Rare/Fréquent est passée de 11 à 14 px ; les petites lignes du dessous restent à 10,5 px, à lui de dire), crédit dans la fiche et dans À propos. Pas dans l'animation mensuelle. outils/build/teintes-inat.mjs ; refus : 1 382 par la règle des 80 % (aires inversées des espèces presque partout : Hirondelle rustique, Pie bavarde...), 10 par précision < 1 % (oiseaux de cage), 6 « partout » (> 50 % des cases bien observées du monde et précision < 10 % : Perruche ondulée, Pintade, Paon, Calopsitte, Diamant mandarin, Cygne noir). Restent quelques oiseaux de cage à petite aire (Padda). Vérifié par outils/verif/_essai-teinte.mjs (lancé à la main, le tiret bas le cache à tous.mjs) : 6 espèces sur ordinateur, 2 au téléphone sombre ; 11 bancs CONFORME.
- Crédits corrigés (v851) : dl.rb9sut en CC BY-NC 4.0.
- GBIF toutes bases : DOI 10.15468/dl.vnrtqk (à citer), clé 0038663-260928105237408, 76 029 941 lignes, 10 367 jeux, zip 2,47 Go dans notes-privees/essai-cartes/gbif-tout.zip (intégrité vérifiée), gardé par GBIF jusqu'au 21/04/2027 (indéfiniment si on cite le DOI).
- Bilan (outils/build/bilan-gbif-tout.mjs, 100 s ; grilles et bilan.json dans notes-privees/essai-cartes/tout/) : 1 777 M d'observations = eBird 1 485 M, listes complètes 20,8 M, isolées 258,7 M, écartées 12,6 M ; noms rattachés 99,84 %. Cases à 30 observations : eBird 86 867 -> toutes bases 99 229. Par région : Russie et Sibérie +288 %, Afrique subsaharienne +44 %, Asie centrale +30 %, Europe +26 %, Chine +18 %, Australie +17 %, France +14 %, Amériques +2 à 3 %.
- Table des jeux : outils/build/gbif-jeux.mjs -> notes-privees/essai-cartes/gbif-jeux.json (11 377 jeux, aucune collision de préfixe ; 27 écartés : baguage, Batumi, Faune-France par commune).
- Mois voisins : option VOISINS=1 de cartes-gbif.mjs, vérifiée (bulbul 1 953 -> 3 098 cases par mois, Martinet noir 7 -> 7 en Europe en janvier, année identique au pixel).
- PROCHAINE ÉTAPE (conversation neuve) : la règle de mélange. Les isolées (iNat, RU-BIRDS, Observation.org...) ne sont pas des listes : les additionner au dénominateur eBird gonfle les espèces photographiées. Pistes : fréquence par source puis combinée, ou isolées seulement pour la présence là où eBird manque. Faire l'avant/après sur les 23 espèces de docs/cartes-combler-les-trous.md, le MONTRER à Mathis, puis régénérer tout (avec VOISINS=1), recalculer la règle des 80 % des teintes, pousser ornitheque-data puis l'appli, passer les cartes en CC BY-NC dans À propos et citer 10.15468/dl.vnrtqk.
- Bugs de lecture à retenir : readline en for-await et les morceaux de chaîne retenus dans un cache saturent la mémoire sur 6,7 Go (corrigé dans bilan-gbif-tout.mjs).
- Choix de Mathis : UNE seule source, la plus complète et utilisable sans problème -> GBIF toutes bases (eBird compris), un seul téléchargement, licence d'ensemble CC BY-NC (CC0 + CC BY + CC BY-NC, rien d'autre chez les observations humaines d'oiseaux, compté le 21/10).
- Requête : notes-privees/essai-cartes/gbif-requete-tout.json, VALIDÉE par l'API GBIF (/request/validate, 201). Oiseaux (class = 'Aves' OU v_class = 'Aves' : classKey = 212 rendait 0 ligne le 01/10, la base SQL suit une autre classification où Aves = « V2 »), depuis 2015, observations humaines seulement (écarte les balises GPS), incertitude <= 10 km, mois connu ; regroupée par species, v_scientificName, mois, case 0,25° et les 8 premiers caractères de la clé du jeu (« jeu »), pour trier ensuite par source : dédoublonner le Nigeria, écarter le baguage TIPU / Operation Baltic, le Batumi Raptor Count, Faune-France par commune, et traiter à part les listes complètes (eBird, SABAP2, Nigeria, Kenya) et les observations isolées.
- Lancement : powershell -ExecutionPolicy Bypass -File notes-privees/essai-cartes/lancer-gbif.ps1 -Requete gbif-requete-tout.json -Cle gbif-cle-tout.txt (le script prend désormais -Cle, pour ne pas écraser gbif-cle.txt). État sans mot de passe : https://api.gbif.org/v1/occurrence/download/<clé>.
- eBird s'y arrête fin 2024 : refaire ce même téléchargement quand GBIF publiera eBird 2025.
- Ensuite : lire le zip en flux, compter par jeu, choisir la règle de mélange (montrer l'avant/après sur quelques oiseaux à Mathis), puis adapter outils/build/cartes-gbif.mjs.
- PLAN DÉCIDÉ par Mathis (21/10) : 1. GBIF toutes bases ; 2. teinte iNaturalist en fond, TEMPORAIRE ; 3. essayer notre propre modèle pour des cartes pleines (principe de Status & Trends : climat, végétation, altitude). Couches libres repérées : CHELSA (CC0), ESA WorldCover (CC BY) ; WorldClim interdit la redistribution. Leur téléchargement demandera son accord. Une à deux semaines estimées, temps de calcul inconnu sur ce portable.
# (même jour, avant) recherche approfondie des sources de données, FAITE
- Rapport : docs/sources-donnees-oiseaux.md ; fiches détaillées (6 zones, ~175 sources, URL et dates) : notes-privees/essai-cartes/sources-recherche/ ; carte du monde des sources ajoutée en bas de la page cartes-etat.
- Revérifié à la source : eBird absent de GBIF en 2025-2026 (jeu publié une fois par an, dernière fois le 08/08/2025) ; Russie 2015+ : iNat 2,68 M, RU-BIRDS 1,75 M, eBird 1,15 M ; API ABAP ouverte sans compte ; BirdLife clauses 11 et 13 ; Article 12 CC BY 4.0 ; Rego 2023 et Lumbierres 2022 CC0 ; EBBA1 CC BY ; INPN hors service du 26/07/2025 au 22/07/2026, OpenObs « dans les prochains mois ».
- Non lu : conditions exactes du fichier complet d'eBird (page refusée à l'outil) : à lire par Mathis avant de le demander.
- Décision de méthode ouverte : mélanger des observations isolées (iNat, RU-BIRDS) aux listes eBird fausse le dénominateur.
- Messages possibles (par Mathis, rien d'envoyé) : BirdLife (clause 13 + Lumbierres), ABAP, LPO Faune-France + Faune-Guyane, Sibecocenter, WABDaB, compte EBBA2.
- Vu en passant, PAS corrigé : index.html ligne 1004 annonce CC BY 4.0 alors que GBIF classe dl.rb9sut en CC BY-NC (revérifié).
# (même jour, avant) ÉTAT DES LIEUX des cartes en images
- Mathis « perdu » devant les décisions de la maquette (il demandait « on peut pas juste utiliser l'aire iNaturalist ? ») : page http://localhost:8765/notes-privees/maquettes/cartes-etat/index.html (etat.mjs la refait). Tout sur le Bulbul des jardins, cartes liées : d'où viennent les trous (carte + effort), schéma des trois familles (mieux utiliser / ajouter des observations / estimer), mois voisins en janvier (1 915 -> 3 069 cases, moyenne +59 %), autres bases GBIF (+2 810 cases sur 8 446 dans le cadre), aire iNaturalist de trois façons (près des observations x3,1 ; toute l'aire x5,2, Sahara rempli ; aire seule).
- Contrôle : le janvier « aujourd'hui » recalculé par etat.mjs est identique au pixel près à cartes-locales/combul2-m.png (74 907 pixels, 0 différent).
- Proposé sur la page : 1. mois voisins tout de suite ; 2. demande GBIF préparée par moi, lancée par lui ; 3. teinte près des observations s'il la valide. Déconseillé : toute l'aire, aire seule.
# (même jour, juste avant) MAQUETTE « aire estimée » faite
- Maquette : http://localhost:8765/notes-privees/maquettes/aire-estimee/index.html (donnees.mjs la refait). Bulbul des jardins, Huppe, Mésange charbonnière, Tyran quiquivi ; pour chacun, 3 cartes liées : aujourd'hui / teinte partout / teinte seulement où personne n'observe. Pie bavarde en texte (0 % de nos cases dans son aire, refusée par la règle des 80 %).
- Tranché par moi : cases colorées lues dans les VRAIES cartes (cartes-locales/<code>-a.png) ; 110 km = disque de 4 cases (le carré de l'essai faisait des carrés de 9 x 9 au Sahara) ; « personne n'observe » = moins de 30 observations eBird dans la case même (l'effort lissé prête l'effort des voisines : sur 12 542 cases teintées du bulbul, 10 596 « observées » au lissé, 707 en vrai) ; teinte rgb(70,100,160) à 35 %, posée sous les couleurs et seulement hors des cases colorées. Alignement mesuré : 0,1 px entre les deux couches.
- Gains mesurés (surface x) : bulbul 3,2 / 3,1 ; huppe 3,1 / 2,7 ; mésange 2,0 / 1,8 ; tyran 1,7 / 1,6 (partout / où personne n'observe).
- À trancher par lui (écrit en bas de la page) : teinte oui/non ; partout ou seulement où personne n'observe ; nom dans la légende (3 propositions). La teinte ne vaudrait que pour la carte de l'année (les aires iNaturalist n'ont pas de saison).
- Rapport : docs/cartes-combler-les-trous.md ; mesures et scripts : notes-privees/essai-cartes/trous/. Rien de changé dans les cartes ni dans l'appli.
- Constat mesuré : nos seuils ne jettent que 1 à 3 % des cases vues ; les trous = endroits sans observateur eBird ; les cartes mensuelles ont 1,7 à 3,4 fois moins de cases que l'annuelle.
- DÉCIDÉ le 2026-10-21 : sources libres ET « pas d'usage commercial » (les cartes passeront en CC BY-NC, à dire dans l'À propos) ; aire estimée iNaturalist : MAQUETTE d'abord (3-4 espèces avec et sans teinte pâle). Reste ouvert : demander l'accès à Faune-France (message de lui).
- Ordre conseillé : 1. mois voisins (testé : +10 à +69 % de cases par mois, sans faux martinets en janvier) ; 2. deuxième téléchargement GBIF lancé par lui (jeux libres en liste blanche, observations humaines, licence filtrée, pseudo-listes) ; 3. aires iNaturalist avec rejet auto des aires fausses (Pie bavarde) ; 4. plus tard, mailles plus grosses ou modèle.
- Cartes actuelles : ornitheque-data/cartes/, générées par outils/build/cartes-gbif.mjs ; méthode dans docs/sources-cartes.md. Ordre de mise en ligne : ornitheque-data d'abord, puis ce dépôt.
---
# POUSSÉ le 2026-10-21 : profil, familles au % de remplissage (v845) ; plus rares et uniques dans le même ordre (v846, app.js?v=420)
- Familles : % décroissant, puis la plus grosse à % égal. Texte « Les plus complètes d'abord ».
- Plus rares / uniques : un seul tri _parRarete (palier, puis la moins fréquente, puis le nom) ; avant, les uniques départageaient à l'alphabet (Percnoptère et Coucou geai inversés). Vérifié sur la démo.
---
# EN ATTENTE DE MATHIS (2026-10-20) : choix des photos des 540 oiseaux de France
- Galerie : http://localhost:8765/notes-privees/choix-photos/france-2026-10-20/index.html (11 onglets par groupe d'oiseaux). 540 espèces du Birdydex France, dans son ordre ; 12 candidates iNaturalist chacune (curateurs, puis observations les plus aimées), 6 480 au total ; chaque photo montrée dans les recadrages du site (ronds 38 et 54 px, vignette 52, fiche 16/9, quiz 320 x 200, case Birdydex = carte du profil), sous zoom 0,85.
- Choix : numéro « espèce-photo » (ex. 142-3), « -0 » = garder l'actuelle. Clic sur le numéro = choisi, gardé d'une page à l'autre (même adresse), barre du haut « Copier ». Une espèce sans choix garde sa photo.
- Refaire : notes-privees/choix-photos/outils/ catalogue.mjs (lit la démo, expose _catalogueFR au vol sans toucher app.js) -> candidats.mjs (cache-inat/, reprise possible) -> galerie.mjs ; verifie-actuelles.mjs teste les photos actuelles.
- Piège : la recherche iNaturalist libre confondait 3 espèces (alle alle = une plante, bubo bubo = un grèbe, puffinus puffinus = un autre puffin). Repli sur l'autocomplétion limitée aux oiseaux.
- Licences (demande de Mathis) : les « tous droits réservés » sont ÉCARTÉES des candidates (6 475 restantes, toutes libres ; Bec-croisé d'Écosse n'en a que 7). Constat : 62 photos ACTUELLES du site sont « tous droits réservés » et 19 de licence inconnue (outils/licences-actuelles.mjs), marquées « à remplacer » dans la galerie. Règle désormais : ne plus utiliser de photo sans licence.
- Lots APPLIQUÉS et EN LIGNE : v843 (espèces 1 à 20), v844 (21 à 50), v847 (51 à 64 + 47-0, tous les canards), v848 (65 à 91 : gallinacés, pigeons, gangas, outardes, coucous, engoulevents, martinets), v850 (app.js?v=424, 92 à 106 : fin des martinets, râles, marouettes, gallinules, foulque, talève, grue), v852 (app.js?v=426, 107 à 173 : œdicnèmes, avocettes, huîtriers, pluviers, vanneaux, bécasseaux, chevaliers, glaréoles ; 123-0 et 153-0 recopiées) - v852 POUSSÉ (sur origin, vérifié le 21/10). appliquer.mjs : un « -0 » déjà dans PHOTO_OVERRIDE_WIKI n est plus touché. 11-0 = actuelle recopiée. Crédit = auteur · licence · iNaturalist (affiché « Photo : … » sur la fiche). Outil : outils/appliquer.mjs "1-3, 2-1, ..." écrit dans PHOTO_OVERRIDE_WIKI et note faits.json ; galerie.mjs n'affiche plus les espèces faites.
- Case « Aucune ne convient » par espèce : ces oiseaux-là seront à rechercher dans une 2e passe.
- Reste : les lots suivants. Pour chaque lot : appliquer.mjs, galerie.mjs, versions (CACHE_VERSION + 2 app.js?v), genere-demo, bancs, commit.
---
# POUSSÉ et en ligne le 2026-10-20 : classement retouché (v841, app.js?v=415, commit 962501e6)
- Colonne Objectif retirée du classement (« elle sert à rien ») : il reste sur le profil, qui ne l'affiche que si c'est un nombre. Les 7 vrais objectifs sont des nombres (sauvegarde du 04/10) ; seule la démo en a en phrase, désormais visibles nulle part.
- Préférées côte à côte (6 px), sans bord blanc ni chevauchement. La plus rare garde un mince trait blanc entre photo et anneau de palier : à enlever s'il le demande.
- Vérifié en ligne (app.js?v=415 servi). La 1re publication GitHub du 20/10 avait échoué côté GitHub, la suivante est passée.
---
# POUSSÉ le 2026-10-20 (dans v841) : plus rares vues en France, objectif au téléphone, deux photos (v839, commit e4777a1a)
- « La plus rare en France » (classement), « Tes 5 plus rares en France » et « Les 10 plus rares en France » des uniques (profil) : seulement les espèces vues au moins une fois en France (seenFR). Testé dans la démo avec un Robin à flancs roux (palier 10) ajouté « vu en Espagne » : il n'apparaît dans aucune des trois listes.
- Objectif au téléphone : 220 px minimum, deux lignes au plus, lignes de 101 à 70 px.
- Revue des photos (France + listes des membres, 732 espèces) : seules deux mauvaises, dans frozen-photos.json (carte du Cacatoès rosalbin, croquis du Pétrel de Madère), remplacées en surcharge. Les 110 espèces sans photo figée reçoivent toutes une photo iNaturalist.
- 11 bancs CONFORME.
---
# POUSSÉ et en ligne le 2026-10-19 : tableau du Classement refait, version « I » (v837, app.js?v=411, commit 49ec0bc9)
- Choisie par Mathis parmi neuf maquettes (notes-privees/maquettes/classement/, classement-2/, classement-3/) : blocs « Le joueur » / « Ses oiseaux » ; chaque espèce = petite photo + nom (la photo seule « ne correspond pas à un tableau ») ; préférées empilées qui s'écartent au survol ; la plus rare cerclée de son palier, chiffre sur la photo, SANS « palier N » écrit ; dernière en date relative, allumée sous 7 jours ; rêve en gris pointillé, en couleur coché « vu ! » si la personne l'a vu ; écart au premier sous le score ; ta ligne teintée + trait d'accent (7 % était plus pâle que l'alternance des lignes, mesuré). PAS de pourcentage sur l'objectif (refusé).
- Aussi ce jour : « plus rares EN FRANCE » partout ; « La plus rare » toujours calculée d'après la liste (la « plus belle obs » est une phrase du profil) ; noms libres reconnus malgré accents, traits d'union, article (_nomLibreVersSci, NOMS_USUELS pour « Autruche ») ; Autruche d'Afrique : Wikipédia donnait sa carte de répartition, photo en surcharge.
- Vérifié dans la démo : ordinateur clair et sombre, téléphone (cibles 44 px), survol, clic = fiche. 11 bancs CONFORME. En ligne vérifié (app.js?v=411 servi).
- Idées non faites : d'autres espèces peuvent avoir une carte à la place de la photo (à passer en revue) ; au téléphone, l'Objectif sur 3-4 lignes fait des lignes de 101 px.
---
# POUSSÉ et en ligne le 2026-10-19 : ligne du nom espacée (v829) + photos choisies (v830, app.js?v=404)
- Ligne du nom : « Mathis », « toi », « en ligne » à 10 px les uns des autres (3 px avant), alignés à 0,5 px près (mesuré).
- Photos : galerie notes-privees/choix-photos/lot-2026-10-19.html (rond du quiz + case du Birdydex à côté de chaque candidate, 11 par espèce, iNaturalist). Choix de Mathis : Hirondelle rousseline H3, Fuligule nyroca F7, Bruant lapon B11, Balbuzard garde la sienne « définitivement », Cormoran pygmée inchangé. Les quatre sont dans PHOTO_OVERRIDE_WIKI (le Balbuzard recopié de frozen-photos.json) ; le Cormoran reste sur frozen-photos.json.
- Vérifié dans la démo : fiches des trois espèces avec la nouvelle photo, case du Balbuzard inchangée. 11 bancs CONFORME.
---
# POUSSÉ et en ligne le 2026-10-19 : en-tête du profil sans les 4 chiffres ni l'UID (v828, app.js?v=402)
- Demande de Mathis : retirer « 143 espèces / 4e sur 11 / 2 pays / 23 photos » et l'UID affiché. L'UID reste au survol de l'avatar, pour l'admin seulement. Le bouton n'occupe plus de colonne quand il n'y en a pas (profil d'un autre membre).
- Vérifié dans la démo : ordinateur et téléphone, rien ne déborde. 11 bancs CONFORME.
- Date d'arrivée de Mathis RÉTABLIE le 2026-10-19 avec son accord : joinedAt 2026-09-29 → 2026-07-27T23:54:04.855Z (sauvegarde du 28/09), par outils/build/retablir-arrivee.mjs (Admin SDK, ce seul champ). Écrit directement dans la vraie ligue, rien à pousser pour ça.
---
# POUSSÉ et vérifié en ligne le 2026-10-19 : en-tête du profil refait une 3e fois, en carte compacte (v827, app.js?v=401)
- Demande de Mathis : « refais toute cette partie, ce bordel » (l'en-tête), plus de rareté sur les préférées, et le nombre d'espèces sur CHAQUE palier de Rareté.
- Son choix (question à options) : carte compacte. Identité à gauche (nom, statut, Plus belle obs / Espèce de rêve / Objectif en lignes courtes, date d'arrivée), 4 chiffres en grille 2 x 2 à droite avec le bouton dessous ; sous 640 px les chiffres passent en une rangée de 4. « Ta plus rare » calculée retirée (doublon de Plus belle obs, la rareté a son onglet).
- Préférées : plus de pastille de palier (_carteEspeceHtml(sci, nom, false)) ; les plus rares et les uniques la gardent.
- Rareté : chiffre sur les 10 paliers, 0 compris.
- Vérifié dans la démo : ordinateur, téléphone sombre (rien ne déborde), préférées sans pastille, chiffres 13,26,25,46,40,33,28,1,0,0. 11 bancs CONFORME.
- Poussé (commit 2684af09), v827 servie en ligne, nouvel en-tête vu dans la démo en ligne.
---
# POUSSÉ et vérifié en ligne le 2026-10-19 : onglet Espèces refait, jalons retirés des Statistiques (v826, app.js?v=400, commit c8b82bfd)
- Espèces : Rareté (barres par palier 1-10 aux couleurs de rareté + ses 5 plus rares en cartes photo) ; Espèces uniques dans la ligue (cartes, 10 max) ; Familles vues / présentes en France, compte du Birdydex (_catalogueFR, même filtre que _pkdxRender), 12 puis « Voir les N autres », triées par nombre vu ; Où (régions FR-ARA… et pays, le bloc pays seulement s'il y en a plus d'un).
- Fait sans questions : Mathis a refusé la question à choix et dit « reprend ».
- Jalons retirés des Statistiques à sa demande (« on s'en fout ») : _jalonsDe, _stFriseHtml et leur CSS supprimés.
- DÉFAUT DE LA DÉMO, CORRIGÉ et poussé le 2026-10-19 (session à part, commit a6197049, fusion 6b60648b ; régions déduites des lieux). Avant : outils/build/genere-demo.mjs écrit d'anciens codes de région INSEE (FR-11…) au lieu de FR-ARA… ; les régions n'apparaissent donc pas dans la démo, et le trophée Terroir y reste à 0. La vraie ligue a les bons codes (vérifié sur la sauvegarde du 04/10).
- Vérifié dans la démo : ordinateur, sombre, téléphone ; photos des cartes chargées 5/5 ; bulle des barres ; clic carte = fiche espèce ; profil de Samir (78 uniques, 12 hors barème). Erreurs console = xeno-canto qui refuse le navigateur de test (préchargement au survol, déjà existant). 11 bancs CONFORME.
---
# POUSSÉ (2026-10-19) : onglet Statistiques du profil en tableau de bord (v825, app.js?v=399)
- Mathis : « pas dingue ». Ses choix sur maquette : disposition B (frise des jalons en haut, courbe à gauche, années et mois à droite) ; autres membres en gris, nom au survol ; objectif et records fondus dans les graphiques.
- Fait : courbe en vrai temps (l'ancienne plaçait les dates sur AAAAMMJJ, d'où de fausses marches au changement d'année), escalier par espèce, objectif en pointillé s'il est un nombre et pas plus du double du maximum ; barres par année (années vides comprises) et par mois, record en accent avec chiffre et rang dans la ligue ; frise sur 4 rangées d'étiquettes sans chevauchement, remplacée par une liste sous 760 px. Les « 1re espèce de l'année » ne sont plus des jalons (les années sont sur la frise). Texte des graphiques en HTML (le SVG ne trace que les lignes). Anciens styles stat-*/goal-* et la courbe SVG retirés.
- Vérifié dans la démo : ordinateur, sombre, téléphone ; survol de la courbe (date + nombre), des lignes grises (nom de chaque membre, ligne allumée), des barres ; profil d'un autre membre ; 0 chevauchement sur la frise ; aucune erreur ; 11 bancs CONFORME.
- Dans la démo, les objectifs sont du texte libre : la ligne d'objectif n'y paraît pas. À regarder sur la vraie ligue.
---
# POUSSÉ et vérifié en ligne le 2026-10-19 : profil refait une 2e fois, en onglets (v824, app.js?v=398, commit 935e250e)
- Retour de Mathis sur la v823 en ligne : « trop le bordel », emojis partout, ne ressemble pas au reste du site ; préférées voulues en photos comme le Birdydex.
- Ses choix (maquette en deux directions) : onglets Aperçu / Espèces / Photos / Statistiques ; PAS de jetons de personne en haut ; préférées en grandes cartes photo sur toute la largeur.
- Fait : aucun emoji ajouté (titres, boutons, timeline : points ronds) ; chiffres en ligne comme le compteur du Birdydex ; parties titre + note + filet comme les Trophées ; dernières coches dans le tableau de Ma liste ; pays et familles (10) dans Espèces ; Objectif, Progression, Jalons dans Statistiques, sans la boîte grise. Champ « Ton espèce la plus rare » renommé « Plus belle obs » (c'est ce qu'il affiche).
- Vérifié dans la démo (Playwright) : 4 onglets sur ordinateur et téléphone, sans débordement ni erreur ; navigation par les noms (classement, tchat, photos, fil), préférées ajout/retrait. Seul emoji restant : l'avatar choisi par le membre. 11 bancs CONFORME.
- Reste : Mathis regarde en local (recharger deux fois), puis pousse s'il valide.
---
# POUSSÉ et vérifié en ligne le 2026-10-19 : page Profil refaite, ouverte à tous (v823, app.js?v=397, commit 5f15e1fe)
- Demande : profil « plus complet » et consultable par les autres. Choix de Mathis (questions + maquette fil de fer en trois directions) : une seule colonne (A), jusqu'à 5 espèces préférées, champs à remplir derrière « Modifier mon profil », tout visible sauf les réglages, nouveaux blocs = préférées, dernières coches, pays, photos.
- Un clic sur un nom ouvre la page de la personne : classement, tchat (messages et liste « En ligne »), fil, photos (carte et fiche), commentaires, requêtes. PAS fait, exprès : en-têtes de colonnes de « Qui a vu quoi » (le clic y choisit le joueur principal), bulles de la carte (Leaflet garde ses clics), sélecteurs de personne des Trophées. Le menu « Profil » ramène toujours au sien. La petite fenêtre « Fiche joueur » a disparu ; son bouton admin « Retirer de la ligue » est passé sur la page.
- Tranché par moi : préférées rangées dans le champ fav existant, séparées par « | » (règles Firestore inchangées, RIEN à coller ; une ancienne fiche à une espèce se lit telle quelle). Dernières coches triées par date d'OBSERVATION (addedAt est le même pour toute une liste déposée). Pays = pays de la 1re observation (le seul connu pour chaque espèce, mesuré sur la sauvegarde du 04/10). Aucun abonnement de plus (toujours 15) ; seules les vignettes photo se lisent à l'approche de l'écran, comme dans Photos. Tuile « la plus rare » = espèce calculée avec son niveau ; le texte libre du champ « la plus rare » s'affiche à part (« Plus belle obs »), comme dans l'ancienne fiche. Textes des stats du profil remontés à 14 px, dates de la timeline élargies (elles étaient coupées).
- Bug trouvé en testant : le profil se dessinait avant build() (différé d'une image) et trouvait des fiches sans liste. renderProfil() est désormais appelé à la fin de _renderResultsImpl.
- Vérifié dans la démo (Playwright, le navigateur intégré masqué ne dessine rien) : mon profil, celui d'un autre, retour par le menu, ajout/retrait de préférées, clic depuis tchat (panneau refermé), photos, fil ; photo publiée puis vue dans le profil et ouverte en grand ; ordinateur 1280 et téléphone 390 sans débordement ; aucune erreur console. 11 bancs CONFORME.
- Reste : Mathis regarde en local (recharger deux fois), puis pousse s'il valide. À vérifier sur la vraie ligue, impossible dans la démo : profil d'un autre membre, vrais noms de lieux eBird (souvent longs), vraies photos. Ticket qg #62 (plusieurs oiseaux préférés) fermé : choisies parmi les espèces de sa liste, dans « Modifier mon profil », pas depuis la page Birdydex.
---
# POUSSÉ et validé sur téléphone le 2026-10-18 : progression du quiz sur tous les appareils (v822, app.js?v=396, commit 9a5852e0)
- En ligne vérifié : app.js?v=396 servi, démo en ligne abonnée à sa fiche. Règles collées par Mathis, et VALIDÉ par lui sur son téléphone le 2026-10-18 : sa progression y apparaît. Réglages non synchronisés, par choix (« pas important »).
- Choix de Mathis parmi « les trucs annexes du quiz ». Progression (étapes de parcours, réponses, séries et paliers) recopiée dans leagues/<ligue>/quizProgress/<uid>, privée (seul le propriétaire lit). Le navigateur reste la référence.
- Tranché par moi : fusion « le meilleur des deux » case par case, jamais une somme (sinon double compte) ; série en cours prise du côté qui a le plus entendu l'oiseau ; envoi 15 s après la dernière réponse ou en quittant la page ; un écouteur ouvert au démarrage (15 abonnements au lieu de 14) ; ordinateur partagé : mb-quiz-proprio, la progression d'un autre compte est remplacée, jamais fusionnée. Réglages (oiseaux cochés de l'entraînement, indices masqués) NON synchronisés.
- Règles : nouveau bloc quizProgress dans outils/config/firestore.rules, à COLLER dans la console Firebase après avoir poussé. Avant, rien ne casse : tout reste local. Suppression RGPD : la fiche est ajoutée.
- Vérifié dans la démo : envoi au démarrage, fusion de deux appareils (meilleur score par étape, deux parcours), deuxième fusion sans effet ni écriture, compte différent remplacé, accueil redessiné à l'arrivée, partie jouée puis envoyée à 15 s. 11 bancs CONFORME. PAS vérifiable ici : deux vrais appareils (navigateur intégré déconnecté). Test à faire par Mathis : jouer sur l'ordinateur, ouvrir le quiz sur le téléphone.
---
# POUSSÉ et vérifié en ligne le 2026-10-18 : paliers à partir de 4 oiseaux (v821, app.js?v=395, commit e9b01eb5)
- Choix de Mathis : une partie à 2 ou 3 oiseaux (étapes 1-2, entraînement avec 2-3 cochés) ne fait ni monter ni tomber la série ; réussite et confusions comptent toujours. Seuils et paliers déjà gagnés : inchangés. Dit seulement dans la bulle des étapes 1 et 2 : « Les paliers comptent à partir de 4 oiseaux. »
- Vérifié dans la démo : partie à 2 oiseaux (séries à 0), à 4 (record monte), bulles à 1280 et 375 sombre. 11 bancs CONFORME.
---
# POUSSÉ le 2026-10-18 : paliers par oiseau, qg#58 (v818, app.js?v=392)
- Maquette notes-privees/maquettes/quiz-paliers/. Choix de Mathis : palier sur la meilleure série d'affilée (5, 10, 25, 50, 100), gardé ; anneau autour du rond (bronze, argent, or, diamant, prismatique) ; noms Repéré, Reconnu, Familier, Sûr, Infaillible ; « Mes oiseaux » en cartes sur l'accueil, fiche de l'oiseau (paliers, série, réussite, enregistrements entendus, confusions, « S'entraîner sur cet oiseau »). qg#63 fermé (remplacé).
- Tranché par moi : tous les modes comptent ; « Presque » compte juste ; une erreur ne remet à zéro que l'oiseau à trouver ; séries dans mb-quiz-reponses (champ serie) ; anciennes réponses sans ordre, donc séries à zéro sauf oiseau jamais raté (série = toutes ses réponses). Bilan oiseau par oiseau ajouté aussi à la fin des étapes de parcours, comme sur la maquette.
- Vérifié dans la démo (1280 clair, 375 sombre) : gain de palier, série remise à zéro, fiche, retour, entraînement sur un oiseau, fin d'étape. 11 bancs CONFORME.
- Poussé et vérifié en ligne (démo : app.js?v=392, section Mes oiseaux affichée). Toujours ouvert : ordre et noms de tous les parcours.
---
# POUSSÉ le 2026-10-18 : chants douteux retirés des deux parcours (v817, app.js?v=391)
- XC 692351 était un Pouillot de Sibérie (collybita tristis, Herblay en décembre) : retiré. Puis les 146 fiches xeno-canto relues : espèce, « song », mois, sons et sonagrammes tous bons ; retirés aussi 400300 (nonnette ou boréale), 879546 (noire près d'une boréale), 884077 et 804603 (grimpereau des jardins atypique). Raisons notées dans outils/build/chants-gardes.mjs.
- Restent 63 chants (mésanges) et 79 (phrases). Vérifié en ligne. Les deux parcours sont ARRÊTÉS là pour le moment (Mathis).
- Suite décidée par Mathis : « les trucs annexes du quiz » (à préciser avec lui). Toujours ouvert : ordre et noms de tous les parcours.
---
# POUSSÉ le 2026-10-18 : progression du quiz protégée + sonagramme après le chant (v815, app.js?v=389)
- Progression « réinitialisée à chaque mise à jour », toujours sur le site en ligne : aucun code ne l'efface. Cause probable (non prouvée chez lui) : mémoire du site pleine, les 40 anciennes versions du cache de photos (mb-sp-photo-cache-v1 à v40) n'étant jamais effacées ; l'écriture de mb-parcours-* échouait en silence. Corrigé : purge des anciennes versions au démarrage, _stockageEcrire() (libère les caches et réessaie) pour progression, stats, oiseaux de l'entraînement, indices ; cache de photos plafonné à 2 500 espèces.
- Testé en remplissant la mémoire du navigateur intégré : anciennes versions purgées, progression gardée, réglage enregistré malgré la mémoire pleine.
- Sonagramme : téléchargé seulement au premier « playing » du chant, fetchPriority low (il retardait le chant). Vérifié : démarre après le chant, prêt au verdict.
- Poussé. Vérifié en ligne (navigateur intégré) : une progression écrite en v387 est toujours là après le passage à v389. Reste à voir si elle tient chez lui.
- Ouvert : ordre et noms de tous les parcours (demande de Mathis, à réfléchir).
---
# EN LOCAL le 2026-10-17, PAS POUSSÉ : cercles d'indices, réécouter, numéros des chants (v805, app.js?v=379)
- Commits 5c7426eb, 8bfc073e, 6dae1a20. Cercles DANS chaque réponse « Quel oiseau chante ? » : strophe (courte/moyenne/longue), motif (une note / deux hauteurs / petits pics / aigu puis trille), onomatopée (oreille, pas pour la bleue). Couleurs « sous-bois », textes de Mathis au survol (PC_CERCLES, sans répéter le titre). Absents des étapes 6 et 7 ; « Masquer / Afficher les indices », état gardé en mémoire de page.
- « Réécouter (n) » : menu dans l'entête de la question, et liste sur les écrans de fin. Chaque chant affiche « Chant n° XC <id> · <enregistreur> » en gris clair : Mathis signalera un son bizarre par ce numéro.
- Boutons à anneau partout (trois chants de « Nom vers chant » / étape 5, Réécouter) ; anciens ronds orange retirés.
- Vérifié sur la démo (1300 clair, 375 sombre), 11 bancs CONFORME. Reste : qu'il revérifie « Afficher les indices » chez lui (cause probable non prouvée : écriture localStorage qui échouait), puis pousser.
- Maquettes de cette conversation dans notes-privees/maquettes/criteres/ (remarques.html, cercles.html, sonos/). Vocabulaire fixé : strophe > motif > note. À reporter : « le pouillot alterne entre deux hauteurs » dans docs/criteres-chants.md (corrigé seulement dans criteres/index.html).
---
# EN LOCAL le 2026-10-17, PAS POUSSÉ : accueil du quiz refait en tableau (v799, app.js?v=373)
- Maquette C choisie (notes-privees/maquettes/quiz-accueil-2/) : collé en haut et pleine largeur comme les autres pages, phrase d'intro, entraînement en boîtes de Ma liste, parcours en lignes comme son tableau. Le chemin et les parties restent centrés et agrandis.
- 10 familles « Bientôt » ajoutées pour voir la place (fausses, assumé par Mathis). Dans l'entraînement, leurs oiseaux grisés sont remplacés par une ligne.
- Vérifié sur la démo à 1280 clair et 375 sombre ; aller-retour accueil, chemin, page d'un mode.
---
# EN LOCAL le 2026-10-17, PAS POUSSÉ : entraînement du quiz, qg#56 (v798, app.js?v=372)
- Sous les parcours, 4 cartes : Chant vers nom, Nom vers chant, Nom à écrire, Points faibles. Choix de Mathis sur la maquette notes-privees/maquettes/quiz-entrainement/ : E1, N2, noms C. Décisions dans docs/refonte-quiz.md.
- Vérifié sur la démo : les 4 modes joués jusqu'au bout à 1280 clair, page de choix et nom à écrire à 375 sombre (cibles 44 px), parcours inchangé, 11 bancs CONFORME.
- Reste : qu'il essaie en local, puis pousser.
---
# EN LOCAL le 2026-10-16, PAS POUSSÉ : étoiles sur l'écran de fin d'étape (v795, app.js?v=369)
- Trois grandes étoiles (44 px) au-dessus du score : celles de CETTE partie, le chemin garde la meilleure. Les pleines arrivent l'une après l'autre.
- Vérifié sur la démo : 10/10 (3) à 1280 clair, 9/10 (2) à 375 sombre, 5/10 (0, trois vides) ; 11 bancs CONFORME.
---
# 2026-10-16, fin de journée : critères des chants, OÙ ON EN EST (qg#60)
- Forme VALIDÉE pour de bon (cases figées dans la maquette notes-privees/maquettes/criteres/index.html, 5 chants par oiseau).
- Notes refaite (cases indépendantes, ✓ / parfois / ✗, définitions dans docs/criteres-chants.md) ; bleue tout en « parfois », charbonnière « notes variées » parfois, nom « Notes variées » gardé. Famille « Début et fin » retirée.
- Mathis a du mal à tout classer (« j'ai vraiment du mal ») : les oiseaux varient trop pour des cases nettes. Ne pas enchaîner les familles suivantes sans lui demander comment il veut avancer.
- Page d'écoute : notes-privees/maquettes/criteres/ecoute-charbonniere.html (un cri possible dans 862138, pas vérifié).
---
# 2026-10-16 : critères des chants, les 66 chants analysés (qg#60, docs seulement)
- Grille de docs/criteres-chants.md complétée : hauteur mesurée sur les 66, rythme et forme à l'œil sur 21 strophes, « Ralentit » ajouté. Rapport : notes-privees/analyse-sons/2026-10-16-criteres-mesanges/RAPPORT.md.
- Le comptage automatique des notes a échoué (notes à crochet comptées double) : ne pas réutiliser strophes.py/juge.py pour le rythme.
- Tranché par Mathis : « très aigu » = haut des notes ; ligne « Notes qui glissent d'un trait » ajoutée (sépare charbonnière et noire).
- EN ATTENTE DE MATHIS : valider la grille à l'oreille ; note à crochet = une ou deux ; timbre ; « sans s'arrêter ». La maquette notes-privees/maquettes/criteres/ ne suit plus la grille.
---
# EN LOCAL le 2026-10-16, PAS POUSSÉ : nouvel accueil du quiz, L1 + C3 (v793, puis v794 / app.js?v=368)
- v794 : anneau de l'étape choisie recentré sur le rond + son relief ; oiseaux tirés au hasard avec minimums (3/2/1/1, docs/refonte-quiz.md), vérifié sur 10 000 tirages.
- Onglet Quiz = les parcours en cartes (mésanges ouvert, « Merle et grives » et « Fauvettes » grisés « Bientôt ») ; toucher la carte ouvre le chemin.
- Chemin : ondule en largeur à partir de 700 px de large (pixels du parcours), vertical en dessous. Icône par genre, étoiles sous les étapes faites, l'étape en cours cerclée d'orange, bulle sous l'étape touchée.
- Tranché seul : une étape fermée montre aussi sa bulle (« Réussis l'étape N pour l'ouvrir », sans bouton) ; la hauteur du chemin est réservée pour la plus haute bulle, sinon tout le parcours sautait à chaque étape touchée (il est centré dans le panneau).
- Étoiles : 1 au seuil, 2 à une erreur, 3 sans faute (_pcEtoiles) ; l'écran de fin d'étape ne les montre pas encore.
- Vérifié sur la démo locale : 1200 px et 375 px, clair et sombre, partie jouée jusqu'au bout puis retour au chemin, cas rien joué / tout fini / épreuve 13 et 11 sur 15. Bancs : 11 conformes.
---
# EN LOCAL le 2026-10-16, PAS POUSSÉ : le parcours grandit avec l'écran (v792, app.js?v=366)
- Facteur --pc-k (zoom CSS) calculé par _pcHauteur sur la place disponible : 1 jusqu'à ~1280x720, 1,33 à 1680x1050, 1,37 à 1920x1080, plafond 1,5. Référence : question à 5 réponses + verdict = 720 px CSS.
- Page des étapes en colonne centrée (880 px avant zoom), étapes restantes sur deux colonnes au-dessus de 900 px.
- Place du verdict réservée (140 px) : les réponses ne bougent plus quand il apparaît (mesuré).
---
# EN LOCAL le 2026-10-16, PAS POUSSÉ : panneau du Quiz plein écran (v791, app.js?v=365)
- Tout l'onglet Quiz : le panneau descend jusqu'en bas de l'écran (_pcHauteur, recalculé au redimensionnement), le parcours se centre en hauteur dedans, le pied de page n'apparaît qu'en défilant. Mesuré à 1680x1050, 1280x720 et au téléphone.
---
# EN LOCAL le 2026-10-16, PAS POUSSÉ : réponses revenues en barres (v789, app.js?v=363)
- Grandes cartes photo jugées « bof » : barres pleine largeur (680 px max), photo 52 px à gauche du nom, coche/croix à droite.
- Bouton pause : variante D choisie (planche notes-privees/maquettes/quiz-visuel/pause.html), en place en v790 (app.js?v=364) : rond clair, anneau orange qui avance avec le chant, triangle centré sur son centre de gravité (écart mesuré 0,15 px). L'étape 5 garde ses petits boutons orange.
---
# EN LOCAL le 2026-10-16, PAS POUSSÉ : cartes plus grandes, pause de 2 s, plus de trait (v788, app.js?v=362)
- La partie prend la largeur des cartes (jusqu'à 290 px chacune), photos carrées : 5 cartes de 230 px d'écran à 1280 (141 avant). Téléphone : photos en 4/3, les 5 tiennent dans 812 px.
- Pause après la réponse : 2 s (1 s passait trop vite). Le trait qui se vidait pendant la pause est retiré.
---
# EN LOCAL le 2026-10-16, PAS POUSSÉ : visuel du quiz refait, « Sentier » + grandes cartes photo (v787, app.js?v=361)
- 3 directions maquettées (notes-privees/maquettes/quiz-visuel/) ; Mathis a choisi A « Sentier », avec les réponses en grandes cartes photo de B.
- Page des étapes : oiseaux de l'étape en photos rondes (la nouvelle entourée d'accent, mot « nouvelle » toujours caché), liste numérotée, icônes au trait au lieu de ✓ et 🔒.
- Question : 10 segments verts/rouges, son dans un bandeau (bouton orange, temps écoulé), cartes photo 4/3 avec coche/croix, ligne « C'était : … » et trait qui se vide pendant la pause de 1 s. Sonagramme gardé sous le verdict.
- Étape 5 (un oiseau, 3 chants) : mise en page inchangée, couleurs alignées.
- Vérifié 1280, 375 et sombre sur la démo, aucune erreur, 11 bancs CONFORME. Au téléphone, les oiseaux de l'étape passent sur deux lignes (3 + 1).
---
# EN LOCAL le 2026-10-16, PAS POUSSÉ : barre fluide, suite automatique, vignettes photo sans nom latin (v786, app.js?v=360)
- Barre du chant suivie à chaque image (requestAnimationFrame) au lieu de timeupdate. « , nouvelle » reste pour les lecteurs d'écran.
- Après une réponse : plus de boutons Suivante ni Réécouter, la suite arrive seule après 1 s (PC_PAUSE_SUITE_MS). Touche Entrée retirée.
- Parcours : nom scientifique retiré partout (choix, photo, verdict) ; petite photo arrondie 48 px à gauche de chaque choix (.pc-vign, _fetchWikiPhoto). Prototype : même photo à côté du nom.
- Prototype du tableau des critères : notes-privees/maquettes/criteres/ (familles en colonnes, oiseaux en lignes, coches et croix dessinées, 3 exemples à écouter par oiseau).
- Critères des chants (qg#60) : grille universelle dans docs/criteres-chants.md, 18 critères en 6 familles + « Sans s'arrêter » mis de côté au bout. Familles validées par Mathis ; « Ralentit » à ajouter dans Rythme.
- EN PAUSE. Pour reprendre : commencer par analyser moi-même les 66 chants gardés (voir « Pour reprendre » dans docs/criteres-chants.md), puis remplir les « ? ».
- Affichage voulu : dans chaque parcours pour ses espèces, plus un tableau d'ensemble depuis la page Quiz, là où seront regroupés tous les parcours.
---
# EN LOCAL le 2026-10-16, PAS POUSSÉ : le parcours joue les chants choisis par Mathis (v783)
- 66 chants écoutés et gardés, dans data/parcours-mesanges.json (outils/build/chants-gardes.mjs). Plus de _fetchXenoSound dans le parcours.
- Corrigé en testant : un audio retiré de la page continuait de télécharger, 25 questions rapides bloquaient le chant suivant (_pcLibererSons).
- Rien en attente de son côté. Suite possible : qg#65 (cris, enregistrements comme dehors).
---
# EN LOCAL le 2026-10-15, PAS POUSSÉ : parcours du quiz (v782, app.js?v=356)
- Page Quiz = parcours en 7 étapes (maquette C, notes-privees/maquettes/parcours-quiz/), mésanges + pouillot véloce. Décisions dans docs/refonte-quiz.md.
- Ancien quiz (défis, classé, classement) masqué dans #quizAncien, plus initialisé ; code gardé (_quizAncienInit).
- Progression dans le navigateur seulement (mb-parcours-mesanges), pas dans Firestore. Enregistreurs variés dans une partie.
- Vérifié 1280 et 375 sur la démo, étapes 1, 5, 6, 7 jouées, déblocage à 8/10, 11 bancs CONFORME. Visuel à retravailler plus tard (dit par Mathis).
---
# EN LIGNE le 2026-10-15 : entête immobile en défilant (v781, app.js?v=355)
- .entete-fixe en top:0 (le top:-16px de la v779 la faisait remonter au début du défilement : bizarre pour Mathis).
- 24 px au-dessus du logo (26 avant, 20 essayé), onglets à 12 px sous le logo (16 avant) : les onglets restent à la même hauteur.
- Vérifié 1280 et 375 sur la démo, logo et onglets fixes de 0 à 3000 px défilés, 11 bancs CONFORME.
---
# EN LIGNE le 2026-10-15 : entête fixe, plus de « ? » au Birdydex, moins de vide en bas (v779, app.js?v=353)
- Birdydex : les espèces à découvrir gardent fond doré et aura, sans le « ? » (photo toujours cachée jusqu'au toucher).
- Logo, thème et onglets dans .entete-fixe (sticky, top:-16px) : restent en haut en défilant, 10 px au-dessus du logo ; au repos rien ne bouge.
- Pied de page : 28 px sous le texte (80 avant) ; la démo garde 80 px pour son bandeau (genere-demo.mjs, « html .wrap »).
- Vérifié 1280 et 375 sur la démo, 11 bancs CONFORME. Rien en attente.
---
# EN LIGNE le 2026-10-15 : interrupteur de thème, entête à mi-chemin (26 et 16 px), carte « À ne pas confondre » retirée du code (v776, app.js?v=350)
- Interrupteur soleil/lune (variante B de notes-privees/maquettes/theme/), bille placée par la CSS selon le thème réel.
- Onglets à 10 px sous le logo (22 avant) ; haut de page 24 px (28 avant, 18 essayé et jugé trop haut).
- Vérifié 1280 et 375, clair et sombre, 11 bancs CONFORME. Vu en passant : le thème n'est pas retenu d'une visite à l'autre.
- Syrinx : idées notées en qg#55 à qg#64 (en réserve), détail dans docs/inspiration-syrinx.md.
---
# EN LIGNE le 2026-10-15 : pastille TOI et palette d'emojis (v772, app.js?v=348)
- « TOI » : variante C (11,5 px gras, maquette notes-privees/maquettes/toi/tailles-gras.html), centrée par flexbox à côté du prénom dans le classement et « Les observations de qui ? » ; 8 px avant.
- Emojis : EMOJI_GROUPES, 363 en 9 familles titrées, grille 8 colonnes. Emojis iPhone sur PC : non (dessins d'Apple non réutilisables), réponse donnée.
Vérifié 1100 px et 375 px, 11 bancs CONFORME. Reste : qu'il regarde en local, puis pousser.
---
# EN LIGNE le 2026-10-14 : fil, tchat et photos refaits (v768, app.js?v=344). Chantier clos.
# (détail ci-dessous ; dernier correctif : un clic redessiné ne ferme plus le panneau)
- Photos : grille 2 colonnes (1 au téléphone) qui défile seule, cartes = moitié de sa hauteur (container-type,
  100cqh) : pas de photo coupée en haut, 10 px d'air. Fiche d'une photo (_ouvrirFichePhoto) pour réactions,
  commentaires, suppression. Zoom de l'image ouverte (_zoomImg : molette, pincement, double-clic, glisser).
  Préchargement des vignettes rapporté à la grille (_thumbIOZones) ; banc photos ouvre le panneau et défile pas à pas.
- Tchat : heure à côté du nom, actions au survol à côté de la bulle (dans le flux au doigt) : 7 px entre messages.
- Palette d'emojis contre le bouton qui l'ouvre (_placeEmojiPop). Envoyer/supprimer en icônes au trait.
- Fil : chiffre blanc partout, niveau en couleur, drapeau du pays, plus d'« ajout manuel », latin à 90 % d'--ink-3,
  bulles d'aide sur Nouveautés/Chronologique, pastilles numérotées dans le choix de rareté.
- Panneaux recalés au redimensionnement et arrêtés au-dessus du bandeau de la démo.
Vérifié 780 px et 375 px, 11 bancs CONFORME. Reste : qu'il regarde en local, puis pousser.

# FAIT le 2026-10-14 (pas poussé) : fil refait, écrou, tchat (v763, app.js?v=339)
- Fil : maquette A choisie (notes-privees/maquettes/fil/), rangé par jour (jour d'ajout en Nouveautés, d'observation en
  Chronologique), pastille numérotée (chiffre blanc ou foncé selon le contraste, _texteSur), prénoms sans couleur,
  réagir/commenter en icônes au bout de la ligne, une ligne « depuis ta dernière visite ». Filtres personne et rareté
  en fenêtre centrée (_openFilterPicker), voulu par Mathis plutôt qu'une liste déroulante.
- Écrou à la place du ☰, panneaux jusqu'en bas, icônes au trait colorées dans le tchat, champ du nom masqué.
- Fil, Photos, Tchat en icônes dans la barre (commit b559c9d7).
Vérifié 1000 px et 375 px, 11 bancs CONFORME. Reste : qu'il regarde en local, puis pousser.
---
# EN LIGNE le 2026-10-14 : schéma « D'où vient la rareté » dans À propos (v760, app.js?v=336, ticket qg#50 déjà fermé)
Variante A de la maquette du QG, en HTML (classes `.rar-titre` à `.rar-ici` dans styles.css), sous le texte des 10 niveaux :
barres du martin en France (freq_48.json), moyenne pondérée 8,1 %, échelle des 10 niveaux. Vérifié 1280 clair et 375 sombre,
pas de défilement horizontal, étiquettes de seuils sans chevauchement, bancs CONFORME, démo régénérée.
Écartés par Mathis : rareté pays par pays (aucune). Gardés en idées : taille comparée (qg#53), comparer aux espèces qui se ressemblent (qg#54).
Vus en passant, pas touchés : Sri Lanka trié après les pays « absente » dans le sélecteur de pays ; `REAL_FREQ` est l'ancien pic
(0,178 contre 0,081 pour le martin) et sert encore à départager deux espèces de même niveau ; chiffre blanc sur pastille jaune (niveau 5) à 2,2:1.
---
# EN LIGNE le 2026-10-12 : page À propos refaite (v758, app.js?v=334)
Pleine largeur (bridée à 900 px avant), textes relus contre le code et allégés : rareté par pays, zones,
sources à jour (iNaturalist, INPN), plus d'anglicismes, phrase « facteur 3 » et date du 23/09 retirées.
Plus le schéma ci-dessous, allégé à sa demande.

# schéma « D'où viennent les cartes » dans À propos (v754, app.js?v=330, commit 9f8c6498)
Ticket qg#49, demandé par la session QG. Refait en HTML (classes .carto-*), cases empilées sous 760 px.
Chiffres revérifiés : 10 896 cartes, 82,7 Mo de PNG, 1 775 781 186 observations (API GBIF).
Vérifié dans la démo : ordi 1280 et téléphone 375, clair et sombre, 11 bancs CONFORME.
Ticket qg#49 fermé une fois en ligne.

---
# FAIT le 2026-10-12 (pas poussé) : Classement et fiche espèce (v743, app.js?v=319)
- Qui a vu quoi : en-tête et colonne Espèce collés (tableau borné à 75 vh), colonnes dans l'ordre du
  classement sans filtre, lignes à 37,9 px aux trois tris (étiquette de rareté amincie).
- Liste des pays de la fiche : se retrie quand les données des pays étrangers arrivent (elle restait
  dans l'ordre du code à la première ouverture).
- Monténégro : paliers recalculés (293/308 faux, remis à l'ancienne version le 27/09 ; profil
  d'effort effacé le 26/09 par inject-rarity-multi-country, qui fusionne désormais).
- Exotiques (v745, app.js?v=321) : _exoticCategory lit eBird FR (Cygne noir, Faisan vénéré, Colin de
  Californie passent N, donc comptent dans le score de rareté réelle) ; plus de lettre sur une ligne
  de pays « absente » (Capucin bec-de-plomb en Suisse).
- Carte des statuts exotiques : bleu partout où l'espèce est vue sans classement, gris = non observée.
- Pays sans statut national : lettres des zones si au moins la moitié des zones où l'espèce est vue
  la classent (EXOTIQUES_ZONES_MAJORITAIRES, outils/build/exotiques-majoritaires.mjs, 96 cas ; à
  relancer après inject-exotic-by-region). Capucin en Italie : X. Seul cas douteux : Oie cendrée ME.
- Étiquette TOI : variante B (pastille d'origine 20 px, texte 10,5 px centré à l'encre), choisie sur
  notes-privees/maquettes/toi/.
Dernière version : v750, app.js?v=326. Vérifié dans la démo, 11 bancs CONFORME. Reste : qu'il
regarde en local, puis pousser.

---
# FAIT le 2026-10-11 (pas poussé) : le dépôt eBird fait foi (v738, app.js?v=314, commit 307ca46a)
Un ajout à la main absent du CSV disparaît désormais au dépôt suivant (avant : gardé pour toujours, et aucun bouton pour retirer).
Vérifié dans la démo : dépôt 3 espèces + 1 à la main, redépôt de 2 -> il en reste 2. Bancs CONFORME.
Quota Firestore dépassé le 11/10 (lecture admin refusée) : son redépôt doit se faire après la remise à zéro (~9 h).
En suspens : texte du formulaire d'ajout (« pas encore dans ton export eBird ») à revoir avec lui.

---
# EN LIGNE le 2026-10-11 (tard) : cases « à découvrir » dorées (v737, app.js?v=313)
Plus de photo sur une espèce à découvrir : vignette légèrement dorée, « ? » doré, aura dorée (variante 8f,
choisie sur deux planches : notes-privees/variantes-a-decouvrir/). Indices de la scène : plus de flou en sortie.
Son « bug » venait de la démo : elle compare un dépôt à la fausse liste de 212 espèces, pas à la sienne.
Sur le vrai site, son dépôt du soir a bien trouvé ses 10 nouvelles (vérifié dans Firestore).

---
# EN LIGNE le 2026-10-08 : le guide s ouvre a chaque ouverture de la demo (v733, app.js?v=309)
Demande depuis la conversation portfolio. Script ajoute par outils/build/genere-demo.mjs (clic sur « Guide du site »
une fois connecte et les boutons flottants visibles) : la vraie appli ne l ouvre toujours qu apres le premier depot.
demo/?sansguide le laisse ferme, pour les captures. Ordre du guide (vraie appli aussi) : accueil, Carte, Birdydex,
fiche, pays, Ma liste, Classement, puis la suite. Verifie ordi 1280 et telephone 375, 18 bulles, bancs CONFORME.

---
# FAIT le 2026-10-11 (nuit) : « Bruant lapon ? » bord de mer, 6:15-6:35 (son seul, hors appli)
Rapport : notes-privees/analyse-sons/2026-10-11-bruant-lapon/RAPPORT.md (3 passes). Merlin proposait lapon ET farlouse.
Bruant lapon, bonne confiance sans certitude : DEUX crécelles jumelles (6:24,3 et 6:24,9), dessin que
12 autres espèces côtières (222 enr., dont 54 Pipits farlouses) ne reproduisent pas. Le gazouillis
aigu seul ne sépare pas lapon et farlouse. Linotte écartée (50 enr.) : ses notes ont une trace grave vers 2-3 kHz, pas les tiennes. Passe 5 : 20 espèces, 549 enr. ; 14 jumelles hors lapon, 6 écartées par la trace grave, 8 à l'œil (trilles de Bruant jaune, Verdier, Tarier...). La longueur des séries n'a pas pu être mesurée (series.py échoue). Prochaine étape utile : un expert (vérificateur eBird, forum) avec l'extrait et les sonagrammes. Passe 7 (12/10) : le Bruant zizi n'est PAS exclu (un enregistrement, XC385614, fait des groupes très proches) ; lapon toujours le plus probable. Dossier neutre pour Faune France prêt (faune-france-neutre/). Passe 8 : lieu = Bouin (85), buissons ; lapon absent des données eBird de Vendée, zizi 4-23 % ; seul un JEUNE zizi (XC385614) fait la même crécelle. Verdict : le son dit lapon, le lieu dit zizi, indécidable sans expert. Puis (vu par Mathis) : ses tics montent puis descendent (« ∧ »), comme le lapon ; le jeune zizi ne fait que descendre -> le son repenche lapon. EN PAUSE le 12/10 : Mathis attend l'avis du forum Faune France ; pour reprendre, section « POUR REPRENDRE » en tête du RAPPORT. Sonagramme et extraits à écouter : dossier ecoute/.
Outils : crecelle.py, qui_crecelle.py, deuxieme_crecelle.py, duel.py, fenetres.py (LISEZMOI). Rien à pousser.

---
# EN LIGNE le 2026-10-11 : espèces à découvrir (v736, app.js?v=312, fusionné avec le guide de la démo)
3e passe, à sa demande : après un dépôt eBird, fenêtre « N nouvelles espèces ! » -> « Voir le Birdydex » ;
les nouvelles y attendent sur fond teinté (.a-decouvrir, gardées en localStorage par compte), les toucher
joue la scène. Scène ralentie (indices 1,3 s, carte à 4,7 s). Carte au style du site (grande case du
Birdydex), plus de bronze/argent/or. Ajout manuel : scène tout de suite (validé par lui). Vérifié dans la
démo, ordi et téléphone sombre. Poussé à sa demande.

# (2e passe) espèce débloquée façon walkout (commit f5d76aff, v734)
2e passe, à sa demande : bouton renommé « Ajouter à ma liste » ; la carte sobre (« pas ouf ») remplacée par
une scène plein écran façon FIFA (faisceaux, indices pays/famille/palier, carte bronze/argent/or/spéciale
qui arrive en tournant, flash, étincelles). Vérifié dans la démo : ordi 1280, téléphone 375, dépôt de
5 espèces (la plus rare en vedette), passer d'un clic. Reste : son avis sur la scène, puis pousser.
Historique de la 1re passe ci-dessous (le bouton s'y appelait encore « Je l'ai vu »).

# (1re passe) espèce débloquée + « Je l'ai vu » (commit 9bdbc0d7, v733)
Demandé par Mathis : une animation quand on débloque un oiseau, et ajouter un oiseau depuis le Birdydex.
Ses choix (questions à choix) : bouton DANS LA FICHE ; animations « révélation de la vignette » ET
« carte plein écran », à tester toutes les deux.
- « ＋ Je l'ai vu » (en-tête de la fiche, seulement si l'espèce est grisée) -> fenêtre d'ajout pré-remplie
  (espèce + pays de la fiche ; date et lieu à donner). Visible dans toutes les fiches, pas seulement
  depuis le Birdydex : à lui de dire si ça lui va. La fenêtre d'ajout vit désormais au niveau de la page.
- Ajout réussi (fiche ou Ma liste) ou re-dépôt eBird avec des nouveautés (pas au 1er dépôt, ni les « sp. »)
  -> carte au centre (photo silhouette -> couleur) ; en la fermant depuis la fiche, la fiche se ferme
  et la case du Birdydex se révèle (rebond, halo) + bandeau 3 s. Interrupteurs DEBLOQUE_CARTE /
  DEBLOQUE_REVELATION dans app.js.
- Vérifié dans la démo : ordi 1280 clair, téléphone 375 sombre (pointer coarse, 44 px), filtre
  « Manquantes » (pas de révélation, pas d'erreur), Échap/flèches. Re-dépôt eBird SIMULÉ dans la démo
  avec un export fabriqué (2 espèces + un « duck sp. » écarté). Bancs CONFORME.
- Reste : ses retours sur les deux effets (garder les deux, ou un seul) et les textes (bouton, carte,
  bandeau) ; puis pousser.

---
# FAIT le 2026-10-11 (soir) : vidéo 3, Les Moutiers-en-Retz (bruant.mp4, 25 s)
Section « Vidéo 3 » du même RAPPORT.md. Bruant des roseaux sûr (cri net à 20,3 s), trois autres cris
du même dessin non prouvés par la mesure ; le reste est surtout des voix humaines. Références ajoutées :
Bergeronnette grise (14) et des ruisseaux (15). Rien à pousser.

---
# FAIT le 2026-10-11 : analyse des deux vidéos « Bruant roseaux » (son seul, hors appli)
Rapport : notes-privees/analyse-sons/2026-10-11-bruant-roseaux/RAPPORT.md (257 références xeno-canto).
Bruant des roseaux sûr (5 cris « tsiu »), Pouillot véloce probable (1 « huit »), 5 notes plates
vers 4 kHz sans nom, babil de la vidéo 1 non attribué. Milieu donné (roselière) : 6 espèces d'étang testées,
aucune ne colle ; piste non prouvée : notes de chant du Bruant. Rien à pousser.

---
# EN LIGNE le 2026-10-07 : « France entier » retiré (e714d7ff, v732, app.js?v=308)
Bouton pays du Birdydex : « France » ; première ligne des listes de zones (Birdydex et fiche) :
« Tous les départements » en France, « Toutes les régions » ailleurs (`libelleToutesZones`) ; note du
graphique des mois : « affichage pour tout le pays ». Vérifié dans la démo (ordi + téléphone, Espagne), bancs CONFORME.
Vérifié en ligne (v732, app.js?v=308). Capture du Birdydex du portfolio refaite sur la démo en ligne.

---
# EN LIGNE le 2026-10-07 : le guide du site (v730, app.js?v=306), vérifié sur la démo en ligne
Choix de Mathis (questions à choix) : **visite guidée** qui pointe chaque partie du vrai écran,
**proposée juste après le premier dépôt** (« Plus tard » / « Découvrir le site », le tuto ne change
pas), **rouvrable par « 🧭 Guide du site » dans le menu ☰**.
- 17 étapes + accueil : les six onglets, la fiche espèce (ouverte puis refermée par le guide), le pays du Birdydex, Fil, Photos, Tchat, le menu ☰ puis chacune de ses lignes (Profil, Requêtes, À propos, Inviter, Guide du site), menu ouvert par le guide.
  Tout est dans `GUIDE_ETAPES` (app.js, après les fenêtres de Ma liste) ; styles `.guide-*`.
- Vérifié dans la démo : ordinateur 1280×800 et téléphone 375 (pointer coarse, boutons 44 px
  d'écran), clair et sombre ; bulle dans l'écran et hors de sa cible à chaque étape ; Échap,
  Retour, « Plus tard » ; l'onglet de départ revient à la fin ; nouveau venu simulé (fiche
  retirée dans le bouchon + code `mb-invite`) -> la proposition s'ouvre après le dépôt. Bancs CONFORME.
- Reste : rien d obligatoire ; il peut encore retoucher les textes des bulles.
- Ticket qg#45 « Faire le guide » fermé.

---
# EN LIGNE le 2026-10-06 : relecture « recruteur », schémas communs, noms latins en police du texte (v722, app.js?v=298)
Suite de la revue : la prochaine page qu'il choisira. Il regarde en local, puis on pousse.
- Noms latins : une seule règle en fin de styles.css, police du texte en italique (Palatino essayé puis refusé).

- Infos privées retirées du public : trophées en pause (nom complet d'un ami) déplacés dans
  notes-privees/TROPHEES-EN-PAUSE.md, « Maël ne l'a pas » ôté du Pic noir, prénoms du banc de perf
  neutres, README remis à jour (plus de Cornell S&T ni de lien vers un tableau privé). L'historique
  git garde l'ancienne version : le réécrire reste son choix (non fait).
- Toute l'appli au tutoiement ; visiteur de la démo renommé Alex (« Alex (toi) ») ; espèces « la plus
  rare » des fiches de la démo ajoutées à leurs listes ; « Jalouse » -> « Jaloux » (Samir).
- À propos : ni « par email » sans adresse, ni double authentification invérifiable ; anglicismes ôtés.
- Schémas alignés sur toutes les pages, écrits dans la charte (section « Schémas récurrents ») :
  police unique, 14 px minimum, contrôles de filtre à 34 px, 12 px sous le titre, raretés 1 -> 10.
- Emojis des titres de blocs et du menu : GARDÉS (son choix).

---
# Page Classement TERMINÉE le 2026-10-05 (validée par Mathis), EN LIGNE - v719, app.js?v=296
Suite de la revue page par page : la prochaine page qu'il choisira.

Ce qui a changé (détail dans les commits du 2026-10-05 et la charte) :
- tableau des joueurs et « Qui a vu quoi » alignés sur le tableau de Ma liste (en-têtes 13 px capitales,
  texte 14 px, une police) ; podium or/argent/bronze sur la seule case du rang ;
- explication de chaque tri + barème de la rareté réelle dans une bulle au survol des boutons
  (#triBulle, _bulleTri) ; plus de « ? », de phrase sous le titre ni de barème sur la page ;
- règle générale du survol : curseur « ? » (--curseur-aide) et 250 ms (DELAI_SURVOL), dans la charte ;
- « Qui a vu quoi » toujours affichée (repli refusé), sans colonne Rareté au tri « Nombre d'espèces » ;
  filtres de rareté en étiquettes (ils étaient écrasés en ronds) ; pastilles du tableau pleines comme
  les filtres ;
- onglets : Birdydex avant Carte ; textes d'introduction des pages tous au style de Ma liste ;
- fiche espèce : les habitats se chargent aussi hors Birdydex (ils manquaient depuis le 2026-09-28).
Au tri « Nombre d'espèces », le tri « Par rareté » et le filtre de rareté sont masqués et ignorés (oui de Mathis).

# FAIT : onglets 15 -> 17 px, poussés le 2026-10-05 (qg#41 déjà fermé).

# FAIT et EN LIGNE le 2026-10-05 (poussé, vérifié sur la démo en ligne) : refonte de l'onglet Ma liste, v706, app.js?v=286

Maquette : `notes-privees/maquettes/ma-liste/` -> direction C retenue (box à pictogramme au trait),
**titres seuls**, sans petite ligne (« ça surcharge »). Accueil : « Ajoute ta liste eBird et rejoins
la ligue ! ». Fin du tuto : aucune phrase. Vérifié dans la démo : membre (4 box, 3 fenêtres, carte du
lieu au-dessus de la fenêtre d'ajout, Échap ferme la carte seule) ; nouveau venu simulé (seule
« Charger ma liste », prénom exigé dans la dernière étape, dépôt -> fenêtre fermée, liste affichée) ;
téléphone + sombre. Bancs CONFORME. Reste : qu'il regarde en local, puis pousser.
Note : au dépôt d'un nouveau venu, le code d'invitation est encore demandé par une fenêtre du
navigateur (`prompt()` dans saveMyList) - pas touché.

Décisions de Mathis (questions à choix, réponses fermes) :
- L'onglet n'affiche plus que **la liste** (le tableau « Mes espèces » actuel), et au-dessus **quatre
  petites box cliquables** : **Charger ma liste** (tuto), **Ajouter une espèce** (l'ajout manuel actuel,
  dans une fenêtre au centre), **Mon prénom** (fenêtre pour changer le nom), **Retirer ma liste**
  (confirmation).
- Le bloc vert « 212 espèces chargées » est **retiré** : le nombre reste dans le titre de la liste.
- Le **tuto** s'ouvre au centre et guide **une étape à la fois** : choix liste simple / avec GPS, puis
  chaque étape seule avec « Suivant », jusqu'à la zone où déposer le fichier.
- Le guide en blocs fléchés, la ligne prénom + retirer et le bloc vert disparaissent de la page.

Points à tenir en le faisant :
- Quelqu'un qui n'a PAS encore de liste : la page ne doit pas être vide - la box « Charger ma liste »
  doit sauter aux yeux, et le prénom est exigé avant le dépôt (voir handleFiles / attend-saisie).
- Garder les identifiants que le code branche (#file, #drop, #myName, #removeMineBtn, #manualAdd…)
  ou suivre chaque usage dans app.js ; .onboarding est partagé avec Profil.
- Maquetter d'abord si le doute porte sur l'aspect des box (règle des projets).
- Textes à 14 px écrits minimum, pas d'emoji décoratif dans les intitulés.

---

# En cours le 2026-10-05 (nuit) : revue de la charte page par page, avec Mathis

Mathis parcourt le site et commente ; on corrige page par page. **Rien n'est poussé** depuis
`8aa112da` : tout est commité sur `main`, il valide en local (localhost:8765) avant de pousser.
v704, app.js?v=285.

**Ma liste, refaite (fini sauf nouveau commentaire)** :
- « Inviter des amis » quitte la page : ligne du menu ☰, ouvre une fenêtre `<dialog id="inviteDialog">`.
- Guide d'import en blocs fléchés : deux départs (liste simple / avec GPS) → bloc de fin commun
  « Dépose le fichier ici ». Il a refusé la version en deux cartes détaillées (« trop complexe »).
- « Retirer ma liste » à côté du prénom ; tableau « Mes espèces » en bas (recherche, clic = fiche),
  « Ajouter une espèce manuellement » dessous.
- Petites étiquettes en capitales : GARDÉES (tranché).

**Règles décidées ce soir** (dans la charte ou la mémoire) :
- Première observation = la plus ancienne, tous pays confondus (`ingest()` ; `seenFR` lit `v.fr`).
  Les listes déposées avant gardent l'ancienne date tant qu'elles ne sont pas redéposées.
- Le gras s'arrête à 700 (`b, strong`), sauf les pastilles rondes chiffrées.

**Suite** : continuer la revue sur les autres pages, au fil de ses commentaires.

---

# Fait le 2026-10-05 soir : logo et mascotte EN LIGNE (poussé, vérifié sur la démo en ligne)

- `1ab89c0c` : le martin-pêcheur entier (retouché par Mathis dans Figma, source
  `assets/logos/sources/martin-figma.svg`) remplace la huppe : `martin.svg`, sur l'écran de
  connexion et l'écran d'attente. `mix-blend-mode:multiply` retiré (noircissait le logo en sombre).
- `5bcd682a` puis le commit suivant : le logo = la tête dans un cadre vert pâle #ddedec (essai n° 17), sur sapin #1d524e en thème sombre (`logo-sombre.svg`, bascule dans app.js après le bouton Thème) : `logo.svg`
  (entête, favicon), `logo-192/512.png` pleins (manifeste, apple-touch). v691, app.js?v=277.
- Tout se refait avec `node outils/build/icones-martin.mjs` ; les essais de cadrage et de fonds avec
  `tete-martin.mjs` (sortie dans `notes-privees/logos-candidats/martin-2026-10-05/`, hors dépôt).
- Bancs CONFORME, vérifié en local ordinateur + téléphone, clair + sombre.
- `09c858d1` puis le suivant (poussés) : la tête encadrée aussi sur les écrans de connexion et d'attente (suit clair/sombre), fond foncé à #d3e7e6 (accent à 18 %). Le choix d'un logo personnel en cliquant sur la pastille est retiré (v693, app.js?v=279).

- **Logo définitif (2026-10-05, poussé)** : la tête avec les points de la calotte et de l'aile (motifs Arrow reportés puis retouchés par Mathis dans Figma, deuxième retouche le même soir : poitrine, bande crème, haut de l'aile) ; source unique `assets/logos/sources/martin-figma.svg`, l'outil des motifs est dans `archives/logos-motifs/`. Essais rangés dans `notes-privees/logos-candidats/`, huppe dans `archives/logos-huppe/`. v696.

---

# Point fait avec Mathis le 2026-10-05 (nuit) : ce qui reste, trié

- **Poses de la mascotte : ABANDONNÉES le 2026-10-05** (« pas très utile »). Deux essais Arrow 2 à
  partir du martin du logo (poisson, jumelles devant les yeux) n'ont pas gardé son dessin ; la pose
  jumelles au cou faite sans Arrow (`outils/build/pose-jumelles.mjs`) reste dans
  `notes-privees/mascotte/poses/`. Le martin reste le logo, sans poses.
- **Vidéo : plus tard**, ticket [qg#39](https://github.com/Mathiiis7/qg/issues/39) avec toutes les retouches.
- **Fait (2501dcdf, commité, PAS poussé)** : tout ce qui servait Cornell Status & Trends est aux
  archives (`archives/status-trends/` : scripts R, injecteurs, guide, 233 `st_by_species.json`) et le
  dernier recours S&T est retiré d'`app.js` (~60 endroits, branches mortes). v697, app.js?v=281.
  Bancs CONFORME, fiche vérifiée en France et en Espagne, téléphone compris.
- Branche `sauvegarde/avant-rangement-2026-10-04` et `outils/build/build-range-gbif.mjs` supprimés
  par Mathis le même soir.
- Habitats IUCN : clos (BIRDBASE en ligne depuis le 30/09). Espèces sans carte : on n'y touche pas.
- Restent ouverts : petites étiquettes en capitales, refonte de la page des trophées (5 spéciaux en pause).

---

# Prochain sujet (décidé le 2026-10-05) : la mascotte

Design et charte finis et en ligne (voir plus bas, section du 2026-10-02 complétée le 05/10).
**Espèce choisie le 2026-10-05 : le martin-pêcheur** (il porte l'accent bleu-vert et l'orange de
la charte). Demande Arrow 2 de la fiche personnage écrite : `docs/LOGOS-DEMANDES.md`, section
« La mascotte ». Envoyée ; Mathis a retenu deux planches, copiées dans `notes-privees/mascotte/`
(planche-3.svg, planche-4.svg). Choix : **poses de la 4, tuile de la 3** (meilleur bec en petit).
`node outils/build/mascotte.mjs` en fait `mascotte-poses.svg` et `mascotte-tuile.svg` : couleurs
recalées sur la charte, fentes bouchées (2 841 pixels de trou au rendu 2400 px -> 0 ; les 336
restants sont l'espace normal entre les pattes). Comparaison avant/après :
localhost:8765/notes-privees/mascotte/voir.html. Trois retouches High ont suivi (retouche-1 à 3.svg, bilan dans LOGOS-DEMANDES section 1). **Nouvelle méthode décidée : valider d'abord le perché seul**, base = perché de la retouche 3 avec les pattes du 1er envoi greffées par `node outils/build/perche-pattes.mjs` -> `perche-base-2.svg` (échelle des pattes 1,03 réglée avec Mathis, reflet de l'œil gardé). Comparaison A/D/E : localhost:8765/notes-privees/mascotte/perches.html. **E validé par Mathis ; il le retouche dans Canva et rapporte le fichier (SVG de préférence)**, puis la demande en tête de LOGOS-DEMANDES est périmée (Arrow 2 a fait des pattes minuscules) : écrire une demande par pose avec perche-base-2.svg joint. Puis chaque pose seule, ce perché joint. Arrow 2 a échoué deux fois en fin de journée (crédit épuisé ? non vérifié). Ensuite : tuile au banc des
logos, puis manifeste, favicon, entête, démo ; décider où vont les poses. Charte à respecter : `docs/charte-graphique.md`. Logos candidats déjà essayés : mémoire
« Logo : deux candidats retenus » et `notes-privees/logos-candidats/` (hors git).

---

# Fait le 2026-10-05 : cartes GBIF en ligne (les deux dépôts poussés, démo en ligne vérifiée)

Commits : `afd03b30` (ce dépôt : code, crédits, manifeste `data/cartes-index.json`, anciens
manifestes Cornell retirés) et `43d29357` (`ornitheque-data` : 21 793 images dans `cartes/`).
Le design reste NON commité dans le dossier de travail, à part (choix de Mathis : cartes seules).
10 896 cartes (10 660 eBird, 236 présence seule, 39 espèces sans assez de données), 82,7 Mo.
Vérifié dans la démo, ordinateur et téléphone : carte annuelle, animation 12 mois, espèce en présence.
Tous les bancs CONFORME.

**Pour mettre en ligne, dans cet ordre** : pousser `ornitheque-data`, attendre que
`https://mathiiis7.github.io/ornitheque-data/cartes/hoopoe-a.png` réponde, puis pousser ce dépôt.
FAIT : poussés dans cet ordre, puis `range/` et `range-weekly/` retirés d'`ornitheque-data` (250 Mo, vérifié en ligne : 404).
Si le design doit partir en même temps, le commiter avant de pousser.

Reste éventuel : `outils/build/build-range-gbif.mjs` (ancien générateur, écrit dans
`data/range-index.json` qui n'existe plus) est obsolète.

---

# Fait le 2026-10-04 : rangement commun (e8041ead, poussé et contrôlé en ligne)

`tools/` est devenu `outils/`, et `_config.yml` retire `docs/`, `outils/`, `CLAUDE.md` et
`en-cours.md` du site. Le détail est dans la section « Rangement » de `CLAUDE.md`. Le dossier
`tools/` vide a été supprimé après redémarrage. Reste :
- la branche locale `sauvegarde/avant-rangement-2026-10-04` (la photo d'avant, design compris)
  peut être supprimée quand Mathis aura validé le design.

**Le même jour, `Documents\Projets` est devenu `Documents\0-Claude`.** Chemins corrigés partout
(a049dadb), venv de `.onetake` recréé, tâche de sauvegarde Firestore réparée. Restent les scripts
R de `outils/ebirdst/`, à corriger seulement si on les relance :
- 5 ne dépendent que du chemin du projet et remarcheront une fois ce chemin corrigé :
  `build-abundance-by-country.R`, `build-abundance-by-region-fr.R`,
  `build-abundance-by-region-multi.R`, `build-abundance-multi-country.R`, `build-st-catalogs.R` ;
- les 8 autres (et `run-parallel.ps1`) ont aussi besoin du dossier `clc` (CORINE, CGLC), qui a
  disparu avant le renommage.

# En cours - 2026-10-02 (nuit) : le design de l'appli, avant le logo

**Poussé le 2026-10-03 (c30c0696)** : les 5 « Trophées spéciaux » (Kimono, Nécrophile,
Bourriche d'huître, Wallaby, Gros Bébé) sont retirés de l'appli, gardés dans
`TROPHEES_EN_PAUSE` d'`app.js`, à reprendre avec la refonte de la page des trophées.

**EN PAUSE à la demande de Mathis.** Il reprendra par le style du site, « pas encore fini ».
Repartir de là : lui demander ce qui le gêne encore, la liste ci-dessous est l'état exact.
Tout est resté NON commité dans le dossier de travail : ne pas lancer de `git checkout` ni de
`git clean` dessus.

**Ordre décidé par Mathis** : juger le design de l'appli -> écrire une charte graphique ->
choisir l'espèce de la mascotte -> fiche personnage Arrow 2 (plusieurs poses + tête en tuile
pour le logo, sur UNE planche). L'espèce n'est pas choisie (« on va y réfléchir »).

**Fait, NON commité, à faire valider en local** (puis monter CACHE_VERSION et les deux
`app.js?v=` avant de commiter) :
- maquettes de 3 styles du Birdydex : `notes-privees/maquettes/design-birdydex.html` (servie sur
  localhost:8765/notes-privees/...). Il garde SON style, et emprunte au style A « guide de terrain » ;
- onglets sans emojis, actif seul en gras ; titres de page `h2.page-title` (24 px, 21 px tel.)
  sans emoji ni surtitre ; plus aucun `.eyebrow` (ceux qui étaient le seul nom d'un bloc sont
  devenus `.bloc-titre`) ;
- police des titres Source Serif 4 (`--titre`), 600 et 700 servis depuis `assets/fonts/`, licence OFL à côté ;
- Birdydex : compteur « **212** espèces vues sur 466 », titres de famille « X · vues sur total ».

**Le 2026-10-05** : essai de la charte commune des projets perso sur la démo (« inspiré » et
« complète », `notes-privees/maquettes/charte/`) -> refusé, **Mathis garde le style actuel et veut
une charte propre à l'Ornithèque** : ÉCRITE et commitée (a56b34cf), `docs/charte-graphique.md` ; noté au QG
(`decisions.md` et `charte-graphique.md`, commit db4028c du dépôt qg). Ticket #12 laissé ouvert
(reste l'espèce de la mascotte et le logo). Titres : essai plus petit / police du texte refusé, on
garde. **TOUT LE DESIGN EST POUSSÉ le 2026-10-05 (76349c82, v687, app.js?v=273), vérifié en
ligne** (démo : bonne version, police servie, aucune erreur). Corrigé dans ce lot : titres de page tous à la même hauteur (Ma liste avait 2 px de marge
en plus, le compteur du Birdydex poussait son titre de 4,8 px), titre « Quiz » ajouté (seule page
sans titre), fondu glissé à l'ouverture du Classement retiré. Démo régénérée. Bancs CONFORME.

**Question ouverte** : passer aussi en minuscules les petites étiquettes en capitales restantes
(AVATAR, PROGRESSION AU FIL DU TEMPS, RARETÉ, INVITER DES AMIS, en-têtes de colonnes) ?

---

# En cours - 2026-10-02 (soir)

**Retours de Mathis sur le brouillon v2 (moments 1 et 2), dans l'ordre où on les traite :**
1. **Le logo d'abord, avant toute vidéo** : il n'aime pas vraiment la huppe actuelle. Reprendre le
   travail sur le logo (voir la mémoire « Logo : deux candidats retenus » : 1-oiseau-plat et
   3-tete-sarcelle-clair, dans `notes-privees/logos-candidats/`, non suivis par git).
2. **FAIT le 02/10 : la démo étalée.** 337 points sur 84 départements au lieu de 10. Chaque membre
   a 8 coins dans son département (Indre, Bouches-du-Rhône, Jura, Gironde, Finistère) et 2 dans
   chaque département visité ; l'espèce va là où eBird la donne fréquente ce mois-là
   (`freq_by_region.json`), points tirés dans les vrais contours, nommés par le département.
   `v2-carte.py` relancé (1 349 points lus) ; le film n'est pas encore réassemblé.
3. **La vidéo, après** :
   - la police ne lui plaît pas (aujourd'hui Instrument Serif, via `.onetake/look-ornitheque.json`) :
     proposer 2-3 polices ;
   - les photos d'oiseaux qui surgissent : « top », mais leur cadre est carré alors que les cases du
     Birdydex ont des coins arrondis -> découper la carte avec le même arrondi ;
   - ça manque de rythme : plus de contraste entre moments rapides et pauses.
   Le reste du brouillon lui va.

**Vidéo, déroulé v2 : moments 1 et 2 construits, brouillon 16,8 s** (`.onetake/v2-brouillon.mp4`,
1080p30, sans son, oracle PASS). Phrases choisies par Mathis : colonne A de
`docs/VIDEO-DEROULE-V2.md`. La huppe se dessine facette par facette (59, tirées de l'image
embarquée dans `huppe.svg`), son oeil ouvre un iris sur la carte, la huppe et le nom se rangent
en haut à gauche, 12 points arrivent, 5 photos vont dans le compteur 0 à 212.
Reconstruire : `v2-extrait-logo.py`, `v2-facettes.py` (depuis `.onetake/v2/`), `v2-carte.py`,
`assemble-v2.py`, puis `render.py .onetake/film2/comp.html`.
**La démo n'a que 12 lieux** (1 349 cochages superposés aux mêmes GPS) : pas plus de points sans
inventer des données. Reste : moments 3 à 9, son, crédits, retouches de Mathis sur ce brouillon.

---

# En cours - 2026-10-02

**Sujet du moment : la vidéo de présentation, déroulé v2.** Tout est dans
`docs/VIDEO-DEROULE-V2.md` (9 moments, ~60 s, ouverture sur la huppe qui se dessine, tranché
le 02/10). Prochaines étapes : voir à quoi ressemble le gain d'un trophée, vérifier les
observations récentes dans la démo, proposer 2-3 variantes par phrase, écrire le fil qui relie
les moments. Le compteur validé vient de `outils/onetake/essai-compteur.py`.

---

Sujet précédent, toujours ouvert (cartes GBIF) :

# En cours - 2026-10-01

**Sujet : remplacer les cartes Status & Trends (Cornell interdit l'usage sur un site sans accord
écrit) par nos propres cartes, faites à partir des observations eBird publiées sur GBIF (CC BY 4.0).**

Décisions :
- pas de mail à Cornell pour l'instant (brouillon gardé : `notes-privees/MAIL-CORNELL-STATUS-TRENDS.md`) ;
- méthode validée sur 10 espèces : fréquence = observations de l'espèce / observations de tous
  les oiseaux, par case et par mois, lissée avec les cases voisines. Détail et limites dans
  `docs/sources-cartes.md` ;
- Mathis trouve les cases de 155 km beaucoup trop grosses. Les cartes « à la demande » de GBIF ne
  descendent pas plus bas : il faut le téléchargement SQL.

Où on en est :
- compte GBIF créé par Mathis (identifiant dans notes-privees, pas ici : ce fichier est public). Je n'utilise jamais son mot de passe :
  c'est LUI qui lance la demande, curl lui demande le mot de passe ;
- requête prête et validée par GBIF : `notes-privees/essai-cartes/gbif-requete.json`
  (espèce × mois × case de 0,25° via GBIF_DMSGCode(900), eBird seul, depuis 2015) ;
- **demande lancée le 2026-10-01 : clé `0006511-260928105237408`** (aussi dans
  `notes-privees/essai-cartes/gbif-cle.txt`), état RUNNING au lancement. L'état se lit sans mot de
  passe sur `https://api.gbif.org/v1/occurrence/download/0006511-260928105237408` ; quand c'est
  SUCCEEDED, le zip est sur `.../download/request/0006511-260928105237408.zip` et le DOI dans l'état ;
- pour relancer une demande : `notes-privees/essai-cartes/lancer-gbif.ps1` (lancé PAR LUI avec
  `powershell -ExecutionPolicy Bypass -File ...`). curl.exe ne marche pas dans le terminal de
  l'appli : la saisie masquée du mot de passe n'arrive jamais.

**Premier essai vide, cause trouvée** : la base SQL de GBIF a changé de classification. Les clés
y sont des codes (Aves = « V2 », pas 212), d'où 0 ligne avec `classKey = 212` (diagnostic
`0006538-260928105237408`). Requête refaite sans classe ni clé GBIF : elle regroupe par
`v_scientificName`, le nom tel qu'eBird le publie, donc déjà en taxonomie eBird (le piège des
sizerins disparaît). Validée par GBIF. L'ancienne requête vide n'est pas gardée.

**Vraie demande réussie : clé `0006562-260928105237408`, DOI `10.15468/dl.c7y4kg`** (celui à citer),
45 881 584 lignes, zip de 1,33 Go, gardé par GBIF jusqu'au 1er avril 2027 (indéfiniment si on cite le DOI).
Zip : `https://api.gbif.org/v1/occurrence/download/request/0006562-260928105237408.zip`.

Reste à faire :
1. récupérer le zip (taille inconnue, peut-être plusieurs centaines de Mo), le traiter en flux ;
2. FAIT le 2026-10-01 : correspondance des noms. Zip téléchargé (`notes-privees/essai-cartes/gbif-ebird.zip`,
   1,33 Go, lu en flux en 55 s par `bilan-gbif.mjs`) : 1 485 098 423 obs, 10 716 noms, 132 954 cases.
   59 noms GBIF suivent une autre version de la taxonomie : tous rattachés dans `gbif-renommages.json`
   (`fige-renommages.mjs` ; les espèces que GBIF sépare et que l'appli range en sous-espèces sont
   ADDITIONNÉES à l'espèce parente). Le rapprochement par épithète seule s'est trompé une fois
   (grive -> Akialoa disparu), corrigé à la main. Bilan : 10 699 espèces vivantes sur 10 994 ont des
   données ; 295 n'en ont pas (`especes-sans-donnees.txt`), surtout les espèces sensibles qu'eBird
   masque (perroquets, chouettes, tétras rares). 61 d'entre elles ont une carte aujourd'hui :
   Décision de Mathis : le plus de cartes possible. 239 des 295 ont des observations dans les AUTRES
   sources GBIF (381 532 obs depuis 2000, `autres-sources.tsv`), dont 51 des 61 qui ont une carte
   aujourd'hui ; les 56 restantes sont quasi disparues ou des séparations récentes, « on verra ».
   La récolte page par page par l'API (`recolte-autres-sources.mjs`) était trop lente (~7 h, pages
   figées) : remplacée par une demande groupée, **clé `0006783-260928105237408`, DOI
   `10.15468/dl.rb9sut`** (à citer aussi), `gbif-autres.zip` (1,9 Mo, 78 792 lignes, mêmes cases
   0,25°, colonnes species, v_scientificName, mois, case, n). Relu par `bilan-autres.mjs` avec
   `gbif-autres-noms.json` : **236 des 239 espèces**, toutes les lignes rattachées. Piège : la base
   SQL range certaines espèces eBird en sous-espèces (« Gygis alba microrhyncha ») : genre + 3e mot.
   Écarts avec le comptage API = observations sans mois (Chouette de l'Oural : 73 000 sur 103 000),
   inutilisables pour les cartes mensuelles. Ces cartes-là sont des cartes de présence : pas de
   correction par l'effort comme pour eBird ;
3. générer cartes annuelles + 12 mois pour toutes les espèces, rendu fondu
   (`notes-privees/essai-cartes/essai-fondu.mjs` comme base), comparer, puis brancher dans l'appli
   et retirer Status & Trends (cartes, animation hebdo, mentions) ;
4. citer le DOI du téléchargement + CC BY 4.0 dans l'À propos.

Page de comparaison : http://localhost:8765/notes-privees/essai-cartes/
