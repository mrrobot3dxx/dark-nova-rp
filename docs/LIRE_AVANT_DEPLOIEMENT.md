# Dark Nova RP — version active avec SEO et combat RP existant

Source : `Code/nova-rp` du ZIP fourni. Le combat existant (`public/punch.js` et `/api/punch`) est conservé, sans doublon. SEO : balises dans `public/index.html`, `robots.txt`, `sitemap.xml` et routes statiques côté serveur.

## Protection des joueurs

Aucune donnée `data/`, sauvegarde, journal ou fichier privé n’est incluse. **Ne supprimez pas le volume Railway `/app/data`.** Vérifiez les sauvegardes et la configuration persistante du service avant tout déploiement. L’absence de dossier `data/` dans l’archive n’est pas une instruction pour vider le volume.

## Publication

Tester localement puis utiliser Railway CLI depuis le dossier extrait, après avoir confirmé projet/service/environnement. Vérifier `/health`, `/robots.txt`, `/sitemap.xml`, puis les connexions et sauvegardes. Enfin utiliser Google Search Console.
