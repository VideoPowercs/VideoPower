# VideoPowerCodes static website

This repository contains the public, static website source: HTML, CSS, JavaScript, and the image/font assets in `assets/`.

## Files

- `index.html` is the homepage.
- `404.html` is the not-found page.
- Root-level `.css` and `.js` files are used by the pages.
- `assets/` contains the website's visual assets.

Login, authentication endpoints, account UI, and the separate game/account system are not included. This package is intended for a static GitHub repository or GitHub Pages; it does not include server-side features.

## GitHub Pages

Upload the contents of this folder to the repository root. In the repository settings, enable GitHub Pages and select the branch and `/ (root)` folder. If deploying under a project URL such as `username.github.io/repository/`, the site currently uses root-relative URLs in some places, so those paths may need a repository base path. A custom domain or `username.github.io` root deployment avoids that adjustment.
