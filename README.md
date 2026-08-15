# Bookara

Lecteur de livres PDF et EPUB — application de bureau multiplateforme construite avec **Tauri 2** et **Angular 20**.

Développé par [Martzcode](https://github.com/Martzcode).

## Fonctionnalités

- **Ouvrir un livre** (PDF ou EPUB) : menu *Fichier → Ouvrir…* ou `Ctrl+O`
- **Fermer le livre** : menu *Fichier → Fermer* ou `Ctrl+W`
- **Quitter** : menu *Fichier → Quitter* (`Alt+F4`)
- **Navigation** : boutons ‹ › (page précédente/suivante pour le PDF, chapitre précédent/suivant pour l'EPUB), compteur page/chapitre
- **Paramètres → Langue** : sous-menu français / anglais / espagnol / allemand, choix mémorisé
- **Aide → À propos de Bookara** : description, version de l'app, développeur (lien vers le profil GitHub)

## Technologies

| Composant | Technologie |
| --- | --- |
| Backend | Rust + Tauri 2 |
| Frontend | Angular 20 (TypeScript, standalone components, signaux) |
| PDF | pdfjs-dist |
| EPUB | epubjs |
| Boîtes de dialogue & ouverture de liens | plugins Tauri `dialog`, `opener` |

## Prérequis

- Node.js et npm
- Rust (toolchain stable) et les dépendances de compilation Tauri propres à votre plateforme (voir la [documentation Tauri](https://tauri.app/start/prerequisites/))
- `@tauri-apps/cli` installé (déclaré dans `package.json`)

## Développement

```sh
npm install
npm run tauri dev
```

`npm run tauri dev` lance automatiquement le serveur Angular puis la fenêtre Tauri.

## Build de production

```sh
npm run tauri build
```

Les installeurs/snapshots sont générés dans `src-tauri/target/release/bundle/`.

## Notes techniques

- **EPUB** : epubjs est utilisé uniquement pour le *parsing*. Le rendu est fait section par section via un `requestMethod` personnalisé (`book.archive.request`) : les requêtes XHR vers l'origine Tauri sont interceptées par Tauri, il faut donc lire les ressources directement dans le zip en mémoire. Le contenu est injecté dans une iframe via **blob URL** (et non `srcdoc`, mal interprété par WebKit).
- **PDF** : le worker pdfjs est copié vers `src/assets/pdf.worker.min.mjs` par le script npm `copy:worker` (exécuté via `prebuild`/`prestart`/`pretauri`). À relancer après une mise à jour de pdfjs-dist.
- **Sécurité** : `npm overrides` force `xmldom` vers `@xmldom/xmldom` pour corriger une CVE.
- **Ouverture des fichiers** : la boîte de dialogue utilise le plugin Tauri `dialog`, puis la commande Rust `read_book_file` renvoie le contenu binaire du fichier.
- **Version** : semver strict (`X.Y.Z`, sans zéro non significatif, ex. `2026.8.1`). La même valeur doit être alignée dans `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml` et `package.json`. Elle est affichée dans *À propos*.

## Structure

```
src/                 Application Angular (composants, services, i18n)
  app/
    titlebar/        Barre de titre + menus
    menubar/         Menus Fichier / Édition / Affichage / Paramètres / Aide
    book-viewer/     Affichage et navigation PDF / EPUB
    about-dialog/    Boîte de dialogue « À propos »
    i18n/            Traductions (fr, en, es, de)
    services/        BookService (ouverture/fermeture des livres)
src-tauri/           Backend Rust (commande read_book_file, configuration, capabilities)
```
