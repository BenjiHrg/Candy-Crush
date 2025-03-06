class LutinBonbon {
    /**
     * Constructeur de la classe LutinBonbon.
     * @param {number} bonbonNum - Le numéro du bonbon pour déterminer son apparence.
     * @param {number} x - Position initiale en x sur le canvas.
     * @param {number} y - Position initiale en y sur le canvas.
     * @param {number} destinationY - Position finale en y (pour l'animation).
     */
    constructor(bonbonNum, x, y, destinationY) {
        console.log("Création du bonbon avec x:", x, "y:", y, "destinationY:", destinationY);
        this.spriteSheet = new Image(); // Image contenant les sprites des bonbons
        this.spriteSheet.src = "images/spriteSheet.png";  // Chargement de la sprite sheet

        this.bonbonNum = bonbonNum; // Identifiant du type de bonbon
        this.x = x;  // Position actuelle sur l'axe x
        this.y = y;  // Position actuelle sur l'axe y
        this.destinationY = destinationY;  // Destination en y (fixe pour l'animation)

        this.width = 50;  // Largeur d'une case du sprite
        this.height = 50; // Hauteur d'une case du sprite

        console.log("Bonbon créé:", this);
    }

    /**
     * Détermine la position du bonbon dans la sprite sheet en fonction de son numéro.
     * @returns {Object} - Un objet contenant les coordonnées {x, y} du sprite dans la sprite sheet.
     */
    getSpritePosition() {
        // Détermine la position de l'image du bonbon dans la sprite sheet en fonction de bonbonNum
        const spritePositions = {
            1: { x: 0, y: 0 },
            2: { x: 1, y: 0 },
            3: { x: 2, y: 0 },
            4: { x: 3, y: 0 },
            5: { x: 4, y: 0 }
        };
        return spritePositions[this.bonbonNum] || { x: 0, y: 0 }; // Par défaut, retourne le premier bonbon
    }

    /**
     * Dessine le bonbon sur le canvas à sa position actuelle.
     * @param {CanvasRenderingContext2D} ctx - Contexte 2D du canvas où dessiner le bonbon.
     */
    draw(ctx) {
        const spritePos = this.getSpritePosition();
        ctx.drawImage(
            this.spriteSheet,
            spritePos.x * this.width,  // Décalage x dans la sprite sheet
            spritePos.y * this.height, // Décalage y dans la sprite sheet
            this.width,  // Largeur du bonbon dans la sprite sheet
            this.height, // Hauteur du bonbon dans la sprite sheet
            this.x,       // Position sur le canvas
            this.y,       // Position sur le canvas
            this.width,   // Largeur du bonbon sur le canvas
            this.height   // Hauteur du bonbon sur le canvas
        );
    }
}

class Vue {
    /**
     * Constructeur de la classe Vue.
     * @param {number} tailleJeu - Taille de la grille de jeu (nombre de cases par ligne/colonne).
     * @param {Object} monControleur - Instance du contrôleur qui gère la logique du jeu.
     * @param {Object} monModele - Instance du modèle qui contient les données du jeu.
     * @param {number} tailleLutin - Taille des bonbons (lutin) à dessiner sur le canvas.
     * @param {HTMLCanvasElement} monCanvas - Le canevas sur lequel dessiner les éléments du jeu.
     */
    constructor(tailleJeu, monControleur, monModele, tailleLutin, monCanvas) {
        this.monControleur = monControleur;
        this.monModele = monModele;
        this.tailleJeu = tailleJeu;
        this.tailleLutin = tailleLutin;
        this.monCanvas = monCanvas; // Ajout de monCanvas en paramètre
        this.bonbonsADescendre = [];  // Liste des bonbons à animer
        this.finiDescente = true;
        this.monCanvas.addEventListener("click", this.handleClick.bind(this));
        this.nbAppelAAnimerSuivant = 0;
    }

    /**
     * Méthode pour gérer le clic sur le plateau de jeu.
     * @param {MouseEvent} event - L'événement du clic sur le canevas.
     */
    handleClick(event) {
        // Récupérer les coordonnées du clic
        const x = event.offsetX;
        const y = event.offsetY;

        // Calculer la case dans laquelle le clic a eu lieu
        const colonne = Math.floor(x / this.tailleLutin);
        const ligne = Math.floor(y / this.tailleLutin);

        // Vérifier si le clic est dans les limites du plateau
        if (colonne >= 0 && colonne < this.tailleJeu && ligne >= 0 && ligne < this.tailleJeu) {

            console.log(`Clic détecté dans la case: (${ligne}, ${colonne})`);

            this.monModele.printModele();

            let bonbonNum = this.monModele.maGrille[ligne][colonne];

            console.log("num bonbon ", bonbonNum);

            let bonbon = new LutinBonbon(bonbonNum, colonne * this.tailleLutin, ligne * this.tailleLutin);

            this.griseBonbon(bonbon);

            this.monControleur.gestionClicSurCase(ligne, colonne);
        }
    }


    /**
     * Méthode pour afficher la grille de base sans les bonbons animés.
     */
    affiche() {
        console.log('entre dans affiche')
        let ctx = this.monCanvas.getContext('2d');
        // Efface la zone de dessin sans toucher aux bonbons en animation
        for (let i = 0; i < this.tailleJeu; i++) {
            for (let j = 0; j < this.tailleJeu; j++) {
                let bonbonNum = this.monModele.maGrille[i][j];

                if (bonbonNum === 0) {
                    // Case vide
                    ctx.fillStyle = "white";
                    ctx.fillRect(this.tailleLutin * j, this.tailleLutin * i, this.tailleLutin, this.tailleLutin);
                } else {
                    // Bonbon statique (pas animé)
                    let lutin = new LutinBonbon(bonbonNum, j * this.tailleLutin, i * this.tailleLutin);
                    lutin.spriteSheet.onload = () => {
                        lutin.draw(ctx);  // Utilisation de la méthode draw
                    };
                }
            }
        }
    }

    /**
     * Méthode pour animer les bonbons qui descendent sans redessiner la grille.
     * @param {Array} bonbonADescendre - Liste des bonbons à animer (avec leurs indices de position).
     */
    animerDescente(bonbonADescendre) {
        // Récupérer les bonbons à animer et leur position de départ
        this.bonbonsADescendre = bonbonADescendre;

        console.log("liste bonbon a des ",this.bonbonsADescendre);

        let compteur = 0;
        let enregistreColonne = 0;

        for (let [i, j] of this.bonbonsADescendre) {
            // Réinitialiser le compteur pour les autres colonnes
            if (enregistreColonne !== j) {
                compteur = 0;
            }
            enregistreColonne = j;
            console.log(compteur);
            // Initialiser l'animation pour chaque bonbon
            let bonbonNum = this.monModele.maGrille[i][j];

            let newDestinationY = this.trouverProchaineCaseVide(j, compteur);

            // Créer un objet bonbon avec sa nouvelle destination en Y
            let bonbon = new LutinBonbon(bonbonNum, j * this.tailleLutin, i * this.tailleLutin, newDestinationY);
            console.log(bonbon);
                this.animerBonbon(bonbon, i, j);

            // Incrémenter le compteur après avoir animé chaque bonbon
            compteur++;
        }

        this.monModele.reorganiserColonnes();

        setTimeout(() => {
            console.log("detection align")
            this.monControleur.detecteAlignements();
            console.log("bool plus align ",this.monControleur.boolPlusAlignement);
        }, 500);
    }

    /**
     * Fonction pour animer un bonbon en utilisant requestAnimationFrame.
     * @param {LutinBonbon} bonbon - Le bonbon à animer.
     * @param {number} i - Index de la ligne du bonbon dans la grille.
     * @param {number} j - Index de la colonne du bonbon dans la grille.
     */
    animerBonbon(bonbon, i, j) {
        let ctx = this.monCanvas.getContext('2d');

        console.log("pos" + bonbon.destinationY)
        console.log(bonbon.y)

        if (bonbon.destinationY !== -1 && bonbon.y < bonbon.destinationY * this.tailleLutin) {
            // Déplace le bonbon de 5 pixels vers le bas
            bonbon.y += 5;

            // Redessiner le bonbon à la nouvelle position
            this.redessinerBonbon(bonbon);

            // Utiliser requestAnimationFrame pour une animation fluide
            requestAnimationFrame(() => this.animerBonbon(bonbon, i, j));
        } else if (bonbon.destinationY === -1) {
            // Quand le bonbon a atteint sa destination, mettre à jour la grille
            this.monModele.maGrille[i][j] = 0;
            this.monModele.maGrille[bonbon.destinationY][j] = bonbon.bonbonNum;
            this.dessinerBonbons();
        }
    }

    /**
     * Mméthode qui trouve la première case vide dans une colonne donnée.
     * @param {number} j - L'indice de la colonne à analyser.
     * @param {number} compteur - Un compteur pour gérer les cases déjà prises.
     * @returns {number} - L'indice de la première case vide dans la colonne, ou -1 si aucune case n'est vide.
     */
    trouverProchaineCaseVide(j, compteur) {
        // Parcours les lignes de la colonne à partir du bas pour trouver la première case vide
        for (let i = this.tailleJeu - 1; i >= 0; i--) {
            if (this.monModele.maGrille[i][j] === 0) {  // 0 signifie que la case est vide
                return i - compteur;  // Retourne l'index de la première case vide
            }
        }
        return -1;  // Si aucune case vide n'est trouvée, retourne -1
    }

    /**
     * Méthode pour faire descendre de nouveaux bonbons créés.
     * @param {number} nombreDeBonbons - Le nombre de bonbons à faire descendre.
     * @param {number} colonne - La colonne dans laquelle faire descendre les bonbons.
     * @param {number} maxZero - Le nombre maximal de cases vides à prendre en compte.
     */
    faireDescendreNouveauBonbonsCreer(nombreDeBonbons, colonne, maxZero) {

        this.finiDescente = false;
        // Initialisation des paramètres
        this.bonbonsADescendre = nombreDeBonbons;
        this.colonne = colonne;
        let compteur = 0;



        // Crée un tableau d'objets bonbons avec leurs informations
        let bonbons = [];
        for (let i = 0; i < this.bonbonsADescendre; i++) {
            let bonbonNum = this.monModele.maGrille[i][this.colonne];
            let destinationY = compteur * this.tailleLutin;  // Position de descente
            let bonbon = new LutinBonbon(bonbonNum, this.colonne * this.tailleLutin, -50, destinationY);  // Position initiale juste au-dessus de la grille
            bonbons.push(bonbon);
            compteur++;
        }

        // Trier les bonbons par destinationY de manière croissante (le plus bas en premier)
        bonbons.sort((a, b) => b.destinationY - a.destinationY);

        console.log("nb bonbons ", bonbons.length);

        // Lancer l'animation pour chaque bonbon dans l'ordre trié
        if (this.nbAppelAAnimerSuivant < bonbons.length-1 || bonbons.length === 1) {
            this.animerBonbonsSequential(bonbons, (bonbonIndex) => {

                console.log("bonbonIndex ", bonbonIndex);
                console.log("maxBonbon test", maxZero)

                //Permet l'appel de la méthode de detecteAlignements(), si on a fini d'animer la colonne qui avait le plus de nouveaux bonbons créé à faire descendre
                if (bonbonIndex === maxZero) {
                    // Une fois tous les bonbons animés, appeler la méthode detecteAlignements
                    setTimeout(() => {
                        this.finiDescente = true;
                        this.monControleur.detecteAlignements();
                    }, 100);
                }
            });
        }
    }

    /**
     * Fonction pour animer les bonbons dans un ordre séquentiel.
     * @param {Array} bonbons - Liste des bonbons à animer.
     * @param {function} callback - Fonction de rappel appelée une fois l'animation terminée pour tous les bonbons.
     */

    animerBonbonsSequential(bonbons, callback) {
        let bonbonIndex = 0; // Index du bonbon à animer

        // Fonction récursive pour animer chaque bonbon après le précédent
        const animerSuivant = () => {
            if (bonbonIndex < bonbons.length) {
                let bonbon = bonbons[bonbonIndex];

                // Appel de la fonction d'animation pour ce bonbon
                this.animerBonbonCreer(bonbon, () => {
                    bonbonIndex++;
                    this.nbAppelAAnimerSuivant ++;
                    animerSuivant();  // Appel récursif pour animer le bonbon suivant
                });
            } else {
                this.nbAppelAAnimerSuivant = 0;
                // Quand tous les bonbons ont été animés, appeler le callback
                if (callback) callback(bonbonIndex);
            }
        };

        // Démarrer l'animation du premier bonbon
        animerSuivant();
    }

    /**
     * Fonction pour animer la descente du bonbon.
     * @param {Object} bonbon - L'objet bonbon à animer.
     * @param {function} callback - Fonction de rappel appelée une fois l'animation terminée.
     */
    animerBonbonCreer(bonbon, callback) {
        const deplacementStep = 5; // Distance de déplacement par frame

        // Fonction récursive pour animer la descente
        const animer = () => {
            // Si le bonbon n'a pas encore atteint sa destination
            if (bonbon.y < bonbon.destinationY) {
                // Déplace le bonbon de 5 pixels vers le bas
                bonbon.y += deplacementStep;

                // Redessiner le bonbon à la nouvelle position
                this.redessinerBonbonsGenerer(bonbon);

                // Utiliser requestAnimationFrame pour une animation fluide
                requestAnimationFrame(animer);
            } else {
                // Lorsque le bonbon atteint sa destination, on appelle le callback
                if (callback) callback();
            }
        };

        setTimeout(animer);
    }

    /**
     * Fonction pour animer l'échange de deux bonbons entre deux positions.
     * @param {number} ligne1 - Ligne de la première position.
     * @param {number} colonne1 - Colonne de la première position.
     * @param {number} ligne2 - Ligne de la seconde position.
     * @param {number} colonne2 - Colonne de la seconde position.
     */
    animeEchangeBonbons(ligne1, colonne1, ligne2, colonne2) {
        let ctx = this.monCanvas.getContext('2d');

        // Récupérer les bonbons à échanger
        let bonbon1Num = this.monModele.maGrille[ligne2][colonne2];
        let bonbon2Num = this.monModele.maGrille[ligne1][colonne1];

        let bonbon1 = new LutinBonbon(bonbon1Num, colonne1 * this.tailleLutin, ligne1 * this.tailleLutin);
        let bonbon2 = new LutinBonbon(bonbon2Num, colonne2 * this.tailleLutin, ligne2 * this.tailleLutin);

        // Calcul des positions de destination pour les bonbons (échange)
        let destinationX1 = colonne2 * this.tailleLutin;
        let destinationY1 = ligne2 * this.tailleLutin;

        let destinationX2 = colonne1 * this.tailleLutin;
        let destinationY2 = ligne1 * this.tailleLutin;

        // Fonction d'animation pour les bonbons
        const animerEchange = () => {
            // Vérifier si les deux bonbons ont atteint leur destination respective
            let mouvementBonbon1 = (bonbon1.x !== destinationX1 || bonbon1.y !== destinationY1);
            let mouvementBonbon2 = (bonbon2.x !== destinationX2 || bonbon2.y !== destinationY2);

            if (mouvementBonbon1 || mouvementBonbon2) {
                // Déplacer le bonbon 1 vers la position de bonbon 2
                if (bonbon1.x < destinationX1) bonbon1.x += 5;
                if (bonbon1.x > destinationX1) bonbon1.x -= 5;
                if (bonbon1.y < destinationY1) bonbon1.y += 5;
                if (bonbon1.y > destinationY1) bonbon1.y -= 5;

                // Déplacer le bonbon 2 vers la position de bonbon 1
                if (bonbon2.x < destinationX2) bonbon2.x += 5;
                if (bonbon2.x > destinationX2) bonbon2.x -= 5;
                if (bonbon2.y < destinationY2) bonbon2.y += 5;
                if (bonbon2.y > destinationY2) bonbon2.y -= 5;

                // Effacer l'ancienne position des bonbons
                ctx.clearRect(bonbon1.x, bonbon1.y, this.tailleLutin, this.tailleLutin);
                ctx.clearRect(bonbon2.x, bonbon2.y, this.tailleLutin, this.tailleLutin);

                // Dessiner les bonbons à leur nouvelle position
                bonbon1.draw(ctx);
                bonbon2.draw(ctx);

                // Répéter l'animation jusqu'à ce que les bonbons arrivent à destination
                requestAnimationFrame(animerEchange);
            } else {
                // Une fois l'animation terminée, mettre à jour les positions dans le modèle
                this.monModele.maGrille[ligne1][colonne1] = bonbon2Num;
                this.monModele.maGrille[ligne2][colonne2] = bonbon1Num;

            }
        };

        // Démarrer l'animation
        animerEchange();

        //this.finiDescente = true;
        setTimeout(() => {
            this.monControleur.detecteAlignements();
        }, 100);
    }

    /**
     * Fonction pour redessiner un bonbon à sa nouvelle position.
     * @param {Object} bonbon - L'objet bonbon à redessiner.
     */
    redessinerBonbonsGenerer(bonbon) {
        let ctx = this.monCanvas.getContext('2d');

        // Effacer le bonbon à sa position précédente (bonbon.y - 3, parce que la distance de déplacement par frame est de 5).
        ctx.clearRect(bonbon.x, bonbon.y - 3, this.tailleLutin, this.tailleLutin);  // Effacer le bonbon à sa position précédente.

        // Dessiner le bonbon à sa nouvelle position
        bonbon.draw(ctx);
    }

    /**
     * Fonction pour redessiner un bonbon après une animation (exclusivement).
     * @param {Object} bonbon - L'objet bonbon à redessiner.
     */
    redessinerBonbon(bonbon) {
        let ctx = this.monCanvas.getContext('2d');
        ctx.clearRect(bonbon.x, bonbon.y - 10, this.tailleLutin, this.tailleLutin);  // Effacer le bonbon à sa position précédente
        bonbon.draw(ctx);  // Dessiner le bonbon à sa nouvelle position
    }

    /**
     * Fonction pour dessiner les bonbons dans leur position finale après la descente.
     */
    dessinerBonbons() {
        let ctx = this.monCanvas.getContext('2d');
        console.log(this.bonbonsADescendre)
        for (let bonbon of this.bonbonsADescendre) {
            if (bonbon.y === bonbon.destinationY) {
                bonbon.draw(ctx);  // Dessiner chaque bonbon à sa position finale
            }
        }
    }

    /**
     * Fonction pour appliquer un effet gris semi-transparent à un bonbon.
     * @param {Object} bonbon - L'objet bonbon à griser.
     */
    griseBonbon(bonbon) {
        let ctx = this.monCanvas.getContext('2d');

        // Dessiner le bonbon normalement
        bonbon.draw(ctx);

        // Appliquer un effet gris semi-transparent
        ctx.fillStyle = "rgba(128, 128, 128, 0.5)";
        ctx.fillRect(bonbon.x, bonbon.y, this.tailleLutin, this.tailleLutin);
        ctx.globalCompositeOperation = "source-over"; // Remettre le mode normal
    }

    /**
     * Fonction pour échanger deux bonbons et les dégriser après l'échange.
     * @param {number} ligne1 - Ligne de la première position.
     * @param {number} colonne1 - Colonne de la première position.
     * @param {number} ligne2 - Ligne de la seconde position.
     * @param {number} colonne2 - Colonne de la seconde position.
     */
    echangeEtDegriseBonbons(ligne1, colonne1, ligne2, colonne2) {
        let ctx = this.monCanvas.getContext('2d');

        // Récupérer les bonbons à échanger
        let bonbon1Num = this.monModele.maGrille[ligne1][colonne1];
        let bonbon2Num = this.monModele.maGrille[ligne2][colonne2];

        let bonbon1 = new LutinBonbon(bonbon1Num, colonne1 * this.tailleLutin, ligne1 * this.tailleLutin);
        let bonbon2 = new LutinBonbon(bonbon2Num, colonne2 * this.tailleLutin, ligne2 * this.tailleLutin);

        // Effacer l'ancienne position des bonbons
        ctx.clearRect(bonbon1.x, bonbon1.y, this.tailleLutin, this.tailleLutin);
        ctx.clearRect(bonbon2.x, bonbon2.y, this.tailleLutin, this.tailleLutin);

        // Dessiner les bonbons à leur nouvelle position
        bonbon1.draw(ctx);
        bonbon2.draw(ctx);
    }

    /**
     * Fonction pour dégriser un bonbon spécifique.
     * @param {number} ligne - Ligne de la position du bonbon.
     * @param {number} colonne - Colonne de la position du bonbon.
     */
    degriseBonbon(ligne, colonne){
        let ctx = this.monCanvas.getContext('2d');

        // Récupérer les bonbons à échanger
        let bonbonNum = this.monModele.maGrille[ligne][colonne];


        let bonbon = new LutinBonbon(bonbonNum, colonne * this.tailleLutin, ligne * this.tailleLutin);


        // Effacer l'ancienne position des bonbons
        ctx.clearRect(bonbon.x, bonbon.y, this.tailleLutin, this.tailleLutin);


        // Dessiner les bonbons à leur nouvelle position
        bonbon.draw(ctx);
    }
}





class Modele {
    /**
     * Constructeur de la classe Modele.
     * @param {number} tailleJeu - La taille de la grille de jeu.
     */
    constructor(tailleJeu) {
        this.tailleJeu = tailleJeu;
        this.maGrille = this.genererGrille();
    }

    /**
     * Génère une grille de jeu aléatoire de taille `tailleJeu` x `tailleJeu`.
     * Chaque case contient un numéro de bonbon entre 1 et 5.
     * @returns {Array} La grille générée sous forme de tableau 2D.
     */
    genererGrille() {
        let grille = [];
        for (let i = 0; i < this.tailleJeu; i++) {
            grille[i] = [];
            for (let j = 0; j < this.tailleJeu; j++) {
                grille[i][j] = Math.floor(Math.random() * 5) + 1; // Bonbons numérotés de 1 à 5
            }
        }
        return grille;
    }

    /**
     * Supprime les bonbons situés aux positions spécifiées en les remplaçant par 0.
     * @param {Array} positions - Liste des positions des bonbons à supprimer (tableaux [i, j]).
     */
    supprimerBonbons(positions) {
        for (let [i, j] of positions) {
            this.maGrille[i][j] = 0; // Remplace les bonbons par 0
        }
    }


    /**
     * Fait descendre les bonbons dans la grille pour combler les cases vides.
     * Recherche les bonbons au-dessus de vides et les descend.
     * @returns {Array} La liste des bonbons à descendre avec leurs positions.
     */
    faireDescendreBonbons() {
        let bonbonsADescendre = [];

        for (let j = 0; j < this.tailleJeu; j++) { // Parcourir chaque colonne
            let colonne = this.maGrille.map(row => row[j]); // Récupérer les bonbons non vides de la colonne

            console.log("colonne",colonne);

            for (let i = this.tailleJeu - 2; i >= 0; i--) { // Parcourir de bas en haut
                if (colonne[i] !== 0 && colonne[i + 1] === 0) { // Si un bonbon est trouvé avec un 0 en dessous

                    console.log("Bonbon trouvé à descendre à la position", i, j);

                    // Ajouter ce bonbon et tous ceux au-dessus dans la liste des bonbons à descendre
                    for (let k = i; k >= 0; k--) { // Parcours du bonbon courant et ceux au-dessus
                        if (colonne[k] !== 0) { // Si le bonbon est non nul
                            bonbonsADescendre.push([k, j]); // Ajouter les coordonnées du bonbon [i, j]
                        }
                    }

                    break; // Sortir de la boucle dès qu'un bonbon est trouvé
                }
            }
        }
        return bonbonsADescendre
    }

    /**
     * Réorganise les colonnes de la grille pour combler les cases vides en haut.
     * Fait descendre les bonbons non vides et insère des 0 dans les cases vides.
     */
    reorganiserColonnes() {
        for (let j = 0; j < this.tailleJeu; j++) { // Parcours des colonnes
            let nouvelleColonne = this.maGrille.map(row => row[j]).filter(val => val !== 0); // Récupère les valeurs non nulles
            let nbZeros = this.tailleJeu - nouvelleColonne.length; // Nombre de zéros à insérer en haut
            let colonneFinale = Array(nbZeros).fill(0).concat(nouvelleColonne); // Complète avec des 0 en haut

            // Mise à jour de la colonne dans la grille
            for (let i = 0; i < this.tailleJeu; i++) {
                this.maGrille[i][j] = colonneFinale[i];
            }
        }
    }

    /**
     * Génère un certain nombre de bonbons dans une colonne spécifiée.
     * @param {number} nbBonbon - Le nombre de bonbons à générer.
     * @param {number} colonne - La colonne où les bonbons doivent être générés.
     */
    genererNbBonbons(nbBonbon, colonne) {
        for(let i = 0; i < nbBonbon; i++) {
            this.maGrille[i][colonne] = Math.floor(Math.random() * 5) + 1; // Bonbons numérotés de 1 à 5
        }
    }

    /**
     * Échange deux bonbons dans la grille aux positions spécifiées.
     * @param {number} ligne1 - La ligne du premier bonbon.
     * @param {number} colonne1 - La colonne du premier bonbon.
     * @param {number} ligne2 - La ligne du second bonbon.
     * @param {number} colonne2 - La colonne du second bonbon.
     */
    echangeBonbons(ligne1, colonne1, ligne2, colonne2) {

        this.printModele();
        console.log("\n");
        // Vérifier si les coordonnées sont valides
        if (this.estCoordonneeValide(ligne1, colonne1) && this.estCoordonneeValide(ligne2, colonne2)) {
            // Échanger les bonbons
            let temp = this.maGrille[ligne1][colonne1];
            this.maGrille[ligne1][colonne1] = this.maGrille[ligne2][colonne2];
            this.maGrille[ligne2][colonne2] = temp;

            this.printModele();

            console.log(`Bonbons échangés : (${ligne1}, ${colonne1}) avec (${ligne2}, ${colonne2})`);
        } else {
            console.log("Coordonnées invalides pour l'échange.");
        }
    }

    /**
     * Vérifie si les coordonnées spécifiées sont valides (dans la grille).
     * @param {number} ligne - La ligne à vérifier.
     * @param {number} colonne - La colonne à vérifier.
     * @returns {boolean} True si les coordonnées sont valides, sinon false.
     */
    estCoordonneeValide(ligne, colonne) {
        return ligne >= 0 && ligne < this.tailleJeu && colonne >= 0 && colonne < this.tailleJeu;
    }

    /**
     * Augmente le score en fonction du nombre de bonbons supprimés.
     * @param {number} score - Le score actuel du joueur.
     * @param {number} n - Le nombre de bonbons supprimés.
     * @returns {number} Le nouveau score.
     */
    ajouterAuScore(score, n) {
        score += n;
        console.log("Nouveau score:", score);
        return score;
    }

    /**
     * Affiche la grille du modèle dans la console.
     */
    printModele() {
        for (let i = 0; i < this.tailleJeu; i++) {
            let ligne = '';
            for (let j = 0; j < this.tailleJeu; j++) {
                ligne += this.maGrille[i][j] + ' ';
            }
            console.log(ligne);
        }
    }
}

class Controleur {
    /**
     * Constructeur de la classe Controleur.
     * Initialise le modèle et la vue, ainsi que les différentes variables nécessaires au jeu.
     * Vérifie également les alignements après un délai.
     * @param {number} tailleJeu - La taille du jeu (taille du plateau de jeu).
     * @param {number} tailleLutin - La taille du lutin dans le jeu.
     * @param {number} score - Le score initial du joueur.
     */
    constructor(tailleJeu, tailleLutin, score) {
        this.monModele = new Modele(tailleJeu);
        let canvas = document.getElementById("dessin");
        this.maVue = new Vue(tailleJeu, this, this.monModele, tailleLutin, canvas);
        this.boolPlusAlignement = false;
        this.bonbonsADescendre = [];
        this.nbClicks = 0;
        this.noClicks = false;
        this.score = score;
        this.lancementScore = false

        // Vérification des alignements après un délai de chargement du plateau
        setTimeout(() => {
            this.detecteAlignements();
            this.monModele.printModele();
        }, 1000);
    }

    /**
     * Détecte les alignements de bonbons dans le modèle (horizontaux et verticaux).
     * Si des alignements sont trouvés, les bonbons correspondants sont supprimés et un score est ajouté.
     * Après la suppression des bonbons, l'animation des bonbons qui descendent est lancée.
     */
    detecteAlignements() {
        //this.noClicks = false;
        let aSupprimer = new Set();
        console.log('detecteAlignements appelle1');

        // Vérification des alignements horizontaux
        for (let i = 0; i < this.monModele.tailleJeu; i++) {
            for (let j = 0; j < this.monModele.tailleJeu - 2; j++) {
                let bonbon = this.monModele.maGrille[i][j];
                if (bonbon !== 0 && bonbon === this.monModele.maGrille[i][j + 1] && bonbon === this.monModele.maGrille[i][j + 2]) {
                    aSupprimer.add(`${i},${j}`);
                    aSupprimer.add(`${i},${j + 1}`);
                    aSupprimer.add(`${i},${j + 2}`);
                }
            }
        }

        // Vérification des alignements verticaux
        for (let j = 0; j < this.monModele.tailleJeu; j++) {
            for (let i = 0; i < this.monModele.tailleJeu - 2; i++) {
                let bonbon = this.monModele.maGrille[i][j];
                if (bonbon !== 0 && bonbon === this.monModele.maGrille[i + 1][j] && bonbon === this.monModele.maGrille[i + 2][j]) {
                    aSupprimer.add(`${i},${j}`);
                    aSupprimer.add(`${i + 1},${j}`);
                    aSupprimer.add(`${i + 2},${j}`);
                }
            }
        }

        // Convertir le Set en liste de positions exploitables
        let positionsASupprimer = Array.from(aSupprimer).map(pos => pos.split(",").map(Number));

        this.monModele.printModele();
        console.log("pos Sup: ",positionsASupprimer.length);

        if(this.lancementScore) {
            this.score = this.monModele.ajouterAuScore(this.score, positionsASupprimer.length);
            console.log("Score: ", this.score);
        }

        // Vérification si des bonbons doivent être supprimés
        if (positionsASupprimer.length > 0) {
            console.log("Bonbons supprimés :", positionsASupprimer);

            this.monModele.supprimerBonbons(positionsASupprimer);
            this.bonbonsADescendre = this.monModele.faireDescendreBonbons();

            this.monModele.printModele();

            console.log('etat de finiDescente ',this.maVue.finiDescente);

            if(this.maVue.finiDescente) {
                // Mettre à jour la vue pour afficher la suppression
                this.maVue.affiche();

                // Faire descendre les bonbons après une petite pause
                setTimeout(() => {
                    this.maVue.animerDescente(this.bonbonsADescendre);
                }, 150);
            }
        } else if (positionsASupprimer.length === 0) {
            this.maVue.finiDescente = false;
            console.log("entre dans creation new bonbon");
            this.calculDeBonbonsAGenerer();
        }

        // Réinitialiser le Set pour la prochaine vérification
        aSupprimer.clear();
    }

    /**
     * Calcule les bonbons à générer après la suppression des bonbons alignés.
     * Gère les colonnes où des espaces vides existent et génère de nouveaux bonbons.
     * Met à jour la vue après la génération des nouveaux bonbons.
     */
    calculDeBonbonsAGenerer() {
        console.log("rentre dans genereBonbons");
        let colonnesAvecZeros = new Map();
        let nombreDeZeros = 0;

        // Vérification des colonnes contenant des espaces vides
        for (let j = 0; j < this.monModele.tailleJeu; j++) {
            nombreDeZeros = 0;

            for (let i = 0; i < this.monModele.tailleJeu; i++) {
                if (this.monModele.maGrille[i][j] === 0) {
                    nombreDeZeros++;
                }
            }

            if (nombreDeZeros > 0) {
                colonnesAvecZeros.set(j, nombreDeZeros);

            }
        }

        console.log("nombre de 0 ", nombreDeZeros)

        console.log("contenu colonne de 0 ", colonnesAvecZeros.forEach((nb, c)=> {console.log("nb + c", nb + " " + c)}));

        let maxZero = 0;

        colonnesAvecZeros.forEach((nb, c) => {if(nb > maxZero){maxZero = nb}});

        console.log("val maxZeo ", maxZero)

        // Génération de nouveaux bonbons pour chaque colonne avec des espaces vides
        colonnesAvecZeros.forEach((nombreDeZeros, colonne) => {
            console.log("nb de 0: " + nombreDeZeros + " de la colonne : " + colonne);
            this.monModele.genererNbBonbons(nombreDeZeros, colonne);
            this.monModele.printModele();
            console.log("faire des new bonbons");
            setTimeout(() => {
                this.maVue.faireDescendreNouveauBonbonsCreer(nombreDeZeros, colonne, maxZero);
            }, 500);
        });

        if(colonnesAvecZeros.size === 0 && !this.maVue.finiDescente) {
            this.noClicks = true;
            this.maVue.finiDescente = true;
        }
    }

    /**
     * Gère les clics sur les cases du plateau de jeu.
     * Vérifie si les bonbons sélectionnés sont voisins et échange leurs positions si nécessaire.
     * Si un alignement est détecté après l'échange, les bonbons sont supprimés et un score est mis à jour.
     * @param {number} ligne - La ligne de la case sélectionnée.
     * @param {number} colonne - La colonne de la case sélectionnée.
     */
    gestionClicSurCase(ligne, colonne) {
        console.log("etat noClicks ", this.noClicks);
        console.log("etat de finiDes ", this.maVue.finiDescente);
        if(this.noClicks && this.maVue.finiDescente) {
            this.lancementScore = true
            if (this.nbClicks === 0) {
                // Premier clic, mémoriser la position du bonbon sélectionné
                this.firstClick = {ligne, colonne};
                this.nbClicks++;
                console.log("nb click ", this.nbClicks);
            } else if (this.nbClicks === 1) {
                this.nbClicks++;
                // Deuxième clic
                this.secondClick = {ligne, colonne};
                console.log("nb click ", this.nbClicks);
                // Vérifier si les deux bonbons sont voisins (adjacents)
                if (this.sontVoisins(this.firstClick, this.secondClick)) {
                    // Échanger les deux bonbons dans le modèle
                    this.monModele.echangeBonbons(this.firstClick.ligne, this.firstClick.colonne, this.secondClick.ligne, this.secondClick.colonne);

                    let alignement = new Set();
                    console.log('detecteAlignements appelle');

                    // Vérification des alignements horizontaux
                    for (let i = 0; i < this.monModele.tailleJeu; i++) {
                        for (let j = 0; j < this.monModele.tailleJeu - 2; j++) {
                            let bonbon = this.monModele.maGrille[i][j];
                            if (bonbon !== 0 && bonbon === this.monModele.maGrille[i][j + 1] && bonbon === this.monModele.maGrille[i][j + 2]) {
                                alignement.add(`${i},${j}`);
                                alignement.add(`${i},${j + 1}`);
                                alignement.add(`${i},${j + 2}`);
                            }
                        }
                    }

                    // Vérification des alignements verticaux
                    for (let j = 0; j < this.monModele.tailleJeu; j++) {
                        for (let i = 0; i < this.monModele.tailleJeu - 2; i++) {
                            let bonbon = this.monModele.maGrille[i][j];
                            if (bonbon !== 0 && bonbon === this.monModele.maGrille[i + 1][j] && bonbon === this.monModele.maGrille[i + 2][j]) {
                                alignement.add(`${i},${j}`);
                                alignement.add(`${i + 1},${j}`);
                                alignement.add(`${i + 2},${j}`);
                            }
                        }
                    }

                    // Convertir le Set en liste de positions exploitables
                    let positionAligner = Array.from(alignement).map(pos => pos.split(",").map(Number));

                    console.log("nb d'echange ", positionAligner.length)

                    if (positionAligner.length > 0) {
                        this.noClicks = false;
                        this.maVue.animeEchangeBonbons(this.firstClick.ligne, this.firstClick.colonne, this.secondClick.ligne, this.secondClick.colonne);
                    } else {
                        // Si aucun alignement n'est détecté, annuler l'échange
                        this.monModele.echangeBonbons(this.firstClick.ligne, this.firstClick.colonne, this.secondClick.ligne, this.secondClick.colonne);
                        setTimeout(() => {
                            this.maVue.echangeEtDegriseBonbons(this.firstClick.ligne, this.firstClick.colonne, this.secondClick.ligne, this.secondClick.colonne);
                        }, 100);
                    }

                    // Réinitialiser l'état des clics
                    this.nbClicks = 0;
                } else {
                    this.maVue.echangeEtDegriseBonbons(this.firstClick.ligne, this.firstClick.colonne, this.secondClick.ligne, this.secondClick.colonne);
                    // Si les bonbons ne sont pas voisins, réinitialiser les clics
                    this.nbClicks = 0;
                }
                //this.noClicks = false;
                //this.maVue.finiDescente = false;
            }
        }else{
            console.log("attent minute papillon, les animations sont pas encore finies");
            this.maVue.degriseBonbon(ligne, colonne);
        }
    }

    /**
     * Vérifie si deux bonbons sont voisins (adjacents).
     * @param {Object} click1 - Le premier bonbon sélectionné avec ses coordonnées.
     * @param {Object} click2 - Le second bonbon sélectionné avec ses coordonnées.
     * @returns {boolean} - Retourne true si les bonbons sont voisins, false sinon.
     */
    sontVoisins(click1, click2) {
        let diffLigne = Math.abs(click1.ligne - click2.ligne);
        let diffColonne = Math.abs(click1.colonne - click2.colonne);

        return (diffLigne === 1 && diffColonne === 0) || (diffLigne === 0 && diffColonne === 1);
    }

    /**
     * Retourne le score actuel du joueur.
     * @returns {number} - Le score actuel du joueur.
     */
    getScore(){
        return this.score;
    }

    /**
     * Met à jour la vue en affichant l'état actuel du jeu.
     */
    mettreAJourVue() {
        this.maVue.affiche();
    }

    /**
     * Lance le jeu en mettant à jour la vue.
     */
    lancement() {
        this.mettreAJourVue();
    }
}

function afficherScore() {
    cahier.fillStyle = "white";
    cahier.fillRect(500, 0, 200, 100); // Efface l'ancien score
    cahier.font = "20px Arial";
    cahier.fillStyle = "black";
    cahier.fillText(`score: ${jeu.getScore()}`, 500, 20);
}


function init() {
    cahier = document.getElementById("dessin").getContext("2d");
    cahier.largeur = document.getElementById("dessin").width;
    cahier.hauteur = document.getElementById("dessin").height;

    cahier.fillStyle = "white";
    cahier.fillRect(0, 0, cahier.largeur, cahier.hauteur);

    let score = 0;

    jeu = new Controleur(10, 50, score);
    jeu.lancement();

    // Mettre à jour le score toutes les 100ms
    setInterval(afficherScore, 100);
}

window.onload = init;
