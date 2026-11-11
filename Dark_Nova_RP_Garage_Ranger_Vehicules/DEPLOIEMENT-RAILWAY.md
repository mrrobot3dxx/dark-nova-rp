# Dark Nova RP sur Railway

Créer un projet distinct du site d'annonces. Une seule instance du jeu doit tourner : les sessions et l'état multijoueur sont partagés en mémoire.

## Service

- Déployer ce dossier avec son Dockerfile, sans publier le dossier `data` dans une image ni dans un dépôt Git.
- Attacher un volume persistant au service, monté sur `/app/data`.
- Le Dockerfile configure `NODE_ENV=production` et `DATA_DIR=/app/data`.
- Générer un domaine HTTPS Railway. `RAILWAY_PUBLIC_DOMAIN` configure automatiquement l'origine autorisée. Avec un domaine personnalisé, configurer `PUBLIC_ORIGIN=https://votre-domaine`.
- Le serveur écoute le `PORT` fourni par Railway, sur `0.0.0.0`.
- Chemin de vérification de démarrage : `/health`.
- Une seule réplique. Ne pas activer la mise en veille du service pour un serveur de jeu.

## Transférer la progression existante

Le dossier de données est privé. Arrêter temporairement les écritures du jeu local avant le transfert final. Copier `accounts.json` et `moderators.json` dans le volume persistant, sans écraser des comptes créés en ligne. Conserver une sauvegarde datée avant la copie et vérifier ensuite la connexion d'un compte existant. Ne jamais transférer les fichiers de données dans le dossier `public`.

## Vérifications après déploiement

Vérifier `/health`, le chargement de tous les modules, l'inscription et la connexion en HTTPS, deux joueurs simultanés, l'inventaire, un achat et la conservation de ces données après un redémarrage. Le vocal demande l'autorisation du micro ; certains réseaux pourront nécessiter un relais TURN, qui n'est pas configuré actuellement.

La version reste un prototype : le plafond affiché de 60 joueurs n'a pas été validé par un test de charge. Les personnages sont conservés mais les joueurs doivent se reconnecter après un redémarrage du serveur.
