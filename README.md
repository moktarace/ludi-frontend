# Site LUDI Toulouse

Front-end du site de la LUDI Toulouse, avec le kit reseaux et l'espace de Gestion des dates.

## Lancer le site en local

```bash
npm install
npm start
```

`npm start` lance tout ce qu'il faut pour travailler en local :

- le site Angular sur `http://127.0.0.1:4200`
- le service local de Gestion des dates
- le lien entre Angular et les donnees JSON

Il n'y a pas besoin de PHP, Docker ou Google Sheets pour tester en local.

## Gestion des dates

L'espace d'edition est disponible sur :

```text
http://127.0.0.1:4200/#programmation-admin
```

En local, le mot de passe de test est :

```text
ludi1997
```

Les dates sont stockees dans :

```text
src/assets/programmation/data.json
```

L'interface permet d'ajouter, modifier, dupliquer, supprimer, filtrer, trier et modifier plusieurs dates en meme temps.

## Configuration en production

Le fichier `src/assets/programmation/config.php` n'est pas versionne. Il faut le creer sur le serveur a partir de :

```text
src/assets/programmation/config.example.php
```

Pour generer un mot de passe :

```bash
php -r 'echo password_hash("TON_MOT_DE_PASSE", PASSWORD_DEFAULT) . PHP_EOL;'
```

Puis mettre le resultat dans `config.php`.

Si possible, stocker le fichier JSON en dehors du dossier public du site et indiquer son chemin dans `config.php` avec `$GESTION_DATES_DATA_FILE`.

## Build

```bash
npm run build
```

Le resultat est genere dans `dist/`.
