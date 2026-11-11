# Dark Nova RP — prototype alpha 0.1

Jeu RP 2D multijoueur pour navigateur mobile et ordinateur. Node.js 20 ou supérieur, sans dépendance externe.

## Jouer

Dans ce dossier : `npm start`, puis ouvrir http://localhost:3000.
Sur un téléphone connecté au même Wi-Fi, ouvrir `http://ADRESSE_IP_DU_PC:3000` si le pare-feu autorise le port. Créer un compte avec un pseudo unique (3 à 18 caractères) et un mot de passe de 10 à 128 caractères. Pour tester plusieurs comptes sur un même ordinateur, utiliser des profils de navigateur séparés : chaque navigateur partage son cookie de connexion entre ses onglets.

## Comptes et sauvegarde

Pseudo, couleur, position, argent et livraison en cours sont sauvegardés dans `data/accounts.json`, exclu de Git et inaccessible depuis les routes publiques. Les mots de passe sont dérivés avec scrypt et un sel aléatoire par compte. La session utilise un cookie HttpOnly SameSite=Strict ; une nouvelle connexion du même compte invalide la précédente. Le bouton Déconnexion sauvegarde le personnage et libère son véhicule. La sauvegarde automatique se fait chaque seconde et immédiatement lors d’une livraison ou déconnexion. Après un arrêt brutal, au plus la dernière seconde de déplacements peut manquer.

Une session inactive expire après deux minutes, mais le compte reste sauvegardé. Après redémarrage du serveur, reconnectez-vous avec le pseudo et le mot de passe. Les achats de véhicules et les locations non expirées sont sauvegardés ; le chat reste temporaire. La récupération et la suppression de compte ne sont pas encore proposées.

Flèches, ZQSD, WASD ou boutons tactiles pour marcher ou conduire. F ou Monter près d’un véhicule libre pour le prendre ; F ou Descendre pour sortir. Les véhicules apparaissent uniquement après une location ou un achat au Garage Nova. Les points jaunes sur la mini-carte indiquent les véhicules libres. Voiture : 420 unités/seconde, scooter : 300, marche : 170. Les véhicules restent à leur dernière position et sont libérés à l’expiration de la session du conducteur.

E ou Interagir près du dépôt jaune pour prendre un colis, puis près du point bleu pour gagner 75 dollars. Le chat est partagé entre les personnes connectées au même serveur.

## Garage Nova

G ou le bouton Garage ouvre le catalogue. Rejoindre le repère violet (455, 520), au sud du départ, et descendre du véhicule pour acheter, louer, rendre ou récupérer.

| Modèle | Location 10 minutes | Achat |
| --- | ---: | ---: |
| Scooter Nova | 60 dollars du jeu | 650 dollars du jeu |
| Citadine Nova | 120 dollars du jeu | 1 500 dollars du jeu |

Tarifs et solde validés côté serveur. Un exemplaire acheté par modèle et une location active par compte. Véhicules prêts au sud du repère, réservés au propriétaire ou locataire. Récupérer replace gratuitement un véhicule acheté sur le parking. Achats et position sauvegardés après redémarrage. Locations : dix minutes réelles, y compris hors ligne, sans renouvellement automatique ni remboursement en cas de retour anticipé. Le conducteur descend automatiquement à expiration. Aucun véhicule gratuit n’est placé sur la carte.

## Ville et résidences

La carte mesure 5 520 × 4 320 unités, soit quatre fois la superficie de la version précédente. Les nouvelles avenues desservent les quartiers résidentiels au sud et à l’est. Les points roses de la mini-carte indiquent les résidences.

H ou Résidences ouvre le catalogue, trié par distance. Pour louer ou résilier, rejoindre à pied le repère rose du logement (rayon de 90 unités). Un compte ne peut avoir qu’un bail actif ; un logement ne peut être loué qu’à un seul joueur. Studio Azur : 180 dollars du jeu pour 24 heures réelles. Les autres tarifs sont affichés dans le catalogue. Le paiement est unique, sans renouvellement automatique ; une résiliation anticipée ne rembourse pas le loyer. Les baux sont sauvegardés dans le compte et continuent à courir hors ligne. Les logements expirés redeviennent disponibles. Les intérieurs ne sont pas encore visitables.

## Hébergement

Un seul processus Node : commande `npm start`, variable `PORT` fournie par l’hébergeur. Compatible avec un service Node sur Railway ou un hébergement équivalent. Utiliser HTTPS en ligne et `NODE_ENV=production` pour activer le cookie Secure. Monter un volume persistant sur le dossier `data` et prévoir ses sauvegardes : un disque éphémère perd les comptes au redéploiement. Les connexions SSE doivent rester ouvertes ; désactiver la mise en tampon du proxy. Le serveur et tous les clients doivent utiliser la même instance. Aucune publication n’a été effectuée.

## Limites connues

- Stockage JSON pour un seul serveur, à remplacer par une base transactionnelle avant de multiplier les instances.
- Les logements sont louables mais pas achetables ; pas encore de métier policier, commerce ou modération administrateur. Les bâtiments sont des décors. Conduite simplifiée dans les quatre directions, sans passagers, carburant ou collisions entre véhicules.
- Serveur autoritaire : limites de vitesse, collisions et récompenses validées côté serveur. Chat limité et affiché comme texte brut. Plafond de 60 sessions pour ce prototype, sans test de charge.
- Avant une ouverture publique : récupération de compte, outils de signalement et modération, tests réseau / charge à ajouter. Les inscriptions et connexions sont limitées à 15 tentatives par adresse de connexion au serveur sur 15 minutes ; derrière un proxy, configurer une identification fiable des adresses pour éviter une limite partagée par tous les joueurs.

## Vérification

`npm test` vérifie les comptes, les sessions, la limitation des tentatives, la sauvegarde après redémarrage, les connexions de deux joueurs, le chat partagé, la conduite, les collisions et le refus des récompenses à distance. Les tests utilisent des données isolées.

## Salon vocal

Le bouton « Activer le vocal », dans le chat sous la ville, demande l’autorisation du microphone puis rejoint un salon commun limité à 60 joueurs. « Couper mon micro » met le micro en sourdine ; « Quitter le vocal » arrête les pistes du microphone. La voix passe directement entre navigateurs via WebRTC, sans enregistrement par le serveur. Les joueurs rendus muets par la modération ne peuvent pas rejoindre le vocal.

Le microphone nécessite localhost ou HTTPS. Une adresse HTTP du PC sur le Wi-Fi ne suffit pas sur téléphone. Les joueurs doivent rejoindre la même instance de jeu. Un serveur STUN public facilite la connexion ; aucun relais TURN n’est configuré, donc certains réseaux ne permettront pas la liaison audio. La transmission réelle entre deux microphones reste à vérifier sur les appareils des joueurs.

Le plafond vocal est de 60 participants. La topologie actuelle relie directement chaque navigateur aux autres : cette capacité ne constitue pas une validation de performance à 60 micros. Pour une utilisation régulière à cette échelle, un serveur de relais audio SFU sera nécessaire.

## Activités clandestines fictives

Choisir Cultivateur clandestin ou Revendeur clandestin au Pôle emploi. Le marché clandestin se trouve au repère violet (1150, 630) : E ou Marché clandestin ouvre le menu. Achats à pied sur place : pot 60 $, graine fictive 20 $, eau 10 $. Les fournitures sont ajoutées à l’inventaire.

Louer un logement actif puis rejoindre à pied son repère rose et ouvrir Culture chez moi. Une plantation utilise un pot, une eau et une graine. Trois cultures maximum par joueur ; croissance fictive de deux minutes réelles, y compris hors ligne. La récolte rend un pot et fournit une unité de CBD fictif, revendable sur place au marché pour 120 $. Le serveur contrôle les prix, les ressources, la proximité, le métier, le bail et la maturation. Les cultures sont sauvegardées ; une culture d’un ancien logement nécessite de relouer ce même logement pour la récolter. Les intérieurs ne sont pas encore visitables : la culture se gère depuis le menu au repère du logement.

## Imprimante fictive
Achat au marché clandestin : 600 dollars du jeu, un exemplaire maximum par joueur. Choisir un métier clandestin et rejoindre à pied son logement loué, puis ouvrir Imprimante chez moi pour installer, récupérer les billets ou ranger. Production fictive : 60 dollars par minute, réserve maximale de 300 dollars. La collecte relance un cycle et remet la réserve à zéro. Collecter avant de ranger. L’imprimante et son horodatage sont sauvegardés. Une imprimante dans un ancien logement reste accessible uniquement en relouant ce logement.


## Quartier des Lilas

Douze nouveaux bâtiments louables à l’est du centre : maisons, studios et lofts, de 180 à 400 dollars pour 24 heures. La grande carte propose un bouton Quartier des Lilas pour le localiser. Les entrées sont indiquées par les repères roses ; E ou H ouvre les locations. Le quartier garde les règles de bail exclusif et de sauvegarde existantes, avec un logement par compte. Les intérieurs restent non visitables.

## Plan allégé de la ville

La carte conserve 26 bâtiments physiques, un par type. Les services du centre restent à leurs repères ; les autres bâtiments sont espacés sur la carte. Les logements existants deviennent des appartements dans le bâtiment de leur type : leurs identifiants, loyers et équipements restent conservés. Le quartier des Lilas compte désormais trois bâtiments physiques (maison, studio et loft) pour ses douze logements.

## GPS

N ou le bouton GPS ouvre la liste de tous les bâtiments, recherchable et triée par distance. Sélectionner une destination active le tracé vert dans la ville et la mini-carte, avec flèche et distance restante. Le calcul contourne les bâtiments en tenant compte du gabarit du véhicule ; descendre si le passage est trop étroit. Les coordonnées personnalisées permettent aussi de choisir un point libre extérieur. Le GPS garde la destination dans la session du navigateur et indique quand elle est atteinte. Il faut sortir des intérieurs pour suivre le guidage. Le bouton × arrête le GPS.

## Entrée de la Villa des Pins

Le repère Entrée indique la porte réelle du bâtiment, y compris après son déplacement sur la carte. Rejoindre ce repère à pied, puis E ou B pour entrer. Les visiteurs ont accès à une visite meublée ; le locataire entre dans une instance privée de son logement. B, E ou Sortir permet de revenir au même point dehors. Les clés de location et les équipements du logement ne sont pas partagés avec les visiteurs.

## Heure réelle et jour/nuit

Horloge synchronisée avec le serveur et affichée en Europe/Paris, avec changement automatique entre heure d’été et d’hiver. Une journée réelle correspond à une journée de jeu : aube de 6 h à 8 h, jour de 8 h à 18 h, crépuscule de 18 h à 20 h et nuit de 20 h à 6 h. Ces horaires fixes sont une ambiance de jeu, pas un calcul astronomique des levers et couchers du soleil. La nuit assombrit uniquement la ville, avec des fenêtres et lampadaires éclairés ; les interfaces, cartes et intérieurs restent lisibles.

## Pluie

La météo suit un cycle de jeu de 30 minutes synchronisé sur l’heure serveur : 12 minutes d’éclaircies, 3 minutes de ciel couvert, 10 minutes de pluie puis 5 minutes de retour progressif aux éclaircies. Les gouttes et petites éclaboussures sont animées à l’extérieur uniquement, de jour comme de nuit. Un indicateur affiche la météo et le temps restant avant le prochain changement. Il s’agit d’une météo fictive commune aux joueurs, indépendante de la météo réelle de Paris.

## Menottes de police

Le métier Policier dispose du bouton Police ou de la touche P pour menotter et libérer un joueur proche. Les deux joueurs doivent être à pied, dans le même lieu, à 75 unités maximum et sans obstacle. Les menottes immobilisent le joueur et bloquent les actions physiques jusqu’à une libération manuelle par un policier ; le chat et le vocal restent disponibles. Un policier proche peut libérer le joueur. Aucun délai automatique : les menottes sont sauvegardées avec le compte et restent après une reconnexion ou un redémarrage du serveur. La déconnexion du policier ne les retire pas. Un policier proche utilise Libérer ce joueur pour les enlever.

## Changement de métier

Une mission en cours bloque le choix d’un autre métier ; le Pôle emploi affiche maintenant cette raison et propose Abandonner la mission sans salaire. L’abandon est explicite et ne modifie pas le solde. Le choix d’un métier peut se faire en arrivant à vélo ou en voiture, avec stationnement automatique. Les chargements sont limités à huit secondes et un bouton Actualiser les métiers permet de vérifier le dernier état. Un message confirme le métier enregistré.

## Appeler un modérateur

Le bouton Appeler un modo permet de décrire un problème et de suivre sa prise en charge. Les modérateurs reçoivent une alerte et peuvent répondre depuis leur panneau. Une demande reste enregistrée même sans modérateur connecté. Un seul appel ouvert par joueur ; accessible aussi en étant menotté.


## Porte du logement

Bouton 🔑 Ma porte : le locataire peut ouvrir aux visiteurs ou fermer et verrouiller depuis son logement ou à pied près de sa porte. Les logements sont verrouillés par défaut et le réglage est sauvegardé avec le bail. Ouvrir autorise les autres joueurs proches à entrer dans le même intérieur. Verrouiller bloque les nouvelles entrées ; les invités présents gardent la possibilité de sortir. Un bail expiré ou résilié met fin à l’accès. Les villas de visite publique restent accessibles dans leur espace de visite distinct.

## Crochets de serrure RP

Boutique du marché clandestin : crochet fictif à 90 dollars du jeu. Bouton Crocheter près d’un véhicule privé garé ou du logement verrouillé d’un autre joueur, à pied et à moins de 70 unités. Chaque tentative consomme un crochet, prend 5 secondes sur place et réussit avec une probabilité de 60 %. Attendre 30 secondes entre les tentatives. Une réussite donne un accès personnel sans limite de temps ; le véhicule et le bail restent au propriétaire. Les objets d’un logement ne sont pas transférés. L’accès réussi est sauvegardé sur le compte et conservé à la reconnexion et au redémarrage ; les crochets achetés ou consommés sont sauvegardés.
