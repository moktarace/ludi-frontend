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

## Acces aux outils prives

L'espace d'entree des outils est disponible sur :

```text
http://127.0.0.1:4200/#outils-ludi
```

Le code adherent local est :

```text
ludi1997
```

Il deverrouille les outils LUDI, le planning spectacle et le kit reseaux sur
l'appareil utilise. La Gestion des dates demande un mot de passe separe, reserve
au bureau et configure cote serveur.

## Gestion des dates

L'espace d'edition est disponible sur :

```text
http://127.0.0.1:4200/#programmation-admin
```

En local, le mot de passe de test est defini par le service local de Gestion des dates.

Les dates sont stockees dans :

```text
src/assets/programmation/data.json
```

Ce fichier est local et n'est pas versionne. S'il n'existe pas, le service local
le cree automatiquement au demarrage.

L'interface permet d'ajouter, modifier, dupliquer, supprimer, filtrer, trier et modifier plusieurs dates en meme temps.

Pour les logos des dates, l'interface permet de choisir un logo du kit LUDI ou d'uploader une image JPEG/PNG. Les images sont reduites avant l'envoi pour garder une bonne qualite sans stocker des fichiers enormes.

Les images envoyees depuis l'interface sont stockees dans :

```text
src/assets/programmation/uploads
```

Quand les dates sont sauvegardees, les images uploadees qui ne sont plus utilisees par aucune date sont supprimees automatiquement.

## Configuration en production

Les fichiers `src/assets/programmation/data.json`, `src/assets/programmation/config.php`
et le dossier `src/assets/programmation/uploads` ne sont pas inclus dans les releases.
Ils doivent rester propres a chaque serveur pour eviter d'ecraser les dates,
la configuration ou les images uploadees lors d'un deploiement.

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

Le dossier d'upload doit rester accessible publiquement et inscriptible par PHP. Les variables optionnelles `$GESTION_DATES_UPLOAD_DIR` et `$GESTION_DATES_UPLOAD_URL` permettent de changer son emplacement.

## Build

```bash
npm run build
```

Le resultat est genere dans `dist/`.

## Deploiement FTP

Le workflow GitHub `Build Release` construit le site puis l'envoie sur le FTP
dans `/www`.

Il faut creer ces secrets dans GitHub :

```text
FTP_HOST
FTP_USER
FTP_PASSWORD
```

Pour deployer depuis la machine locale apres un build :

```bash
FTP_HOST=... FTP_USER=... FTP_PASSWORD=... npm run build:ftp
```

Le deploiement FTP n'efface pas les fichiers distants. Il n'upload jamais :

```text
assets/programmation/config.php
assets/programmation/data.json
assets/programmation/uploads
```
