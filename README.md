A [webpack](https://webpack.js.org) plugin for small [PWA](https://developer.mozilla.org/en-US/docs/Web/Apps/Progressive) that are hosted on GitHub.

Hosted on the `master` branch's `docs/` folder. This is not the default option and will need to be [setup](https://help.github.com/articles/configuring-a-publishing-source-for-github-pages/#publishing-your-github-pages-site-from-a-docs-folder-on-your-master-branch) on GitHub.


### Convention over Configuration

Assumes the following directory structure

    root
    ┣ stylesheets/
    ┃ ┣ asdf.scss
    ┃ ┗ asdf.css
    ┣ javascripts/
    ┃ ┣ asdf.coffee
    ┃ ┗ asdf.js
    ┣ images/
    ┃ ┣ icon-192.png
    ┃ ┗ icon-512.png
    ┗ views/
       ┗ index.pug


All images/icon-*.png will be used as icon listings in `manifest.webmanifest` and as <link rel=apple-touch-icon>
Will build a

* pwa.js
* service.js
* manifest.webmanifest

`views/index.pug` head tag should look something like this:

```pug
doctype html
html(lang="en")
  head
    title=name()
    meta(charset="UTF-8")
    meta(name="Description" content=desc())
    meta(name="theme-color" content=theme())
    meta(name="apple-mobile-web-app-capable" content="yes")
    meta(name="viewport" content="width=device-width, initial-scale=1")
    // scripts
    script(src=assetPath('bundle.js'))
    script(src=assetPath('pwa.js'))
    script(src=assetPath('index.js'))
    // css
    link(rel='stylesheet' href=assetPath('index.css'))
    // icons
    link(rel="icon" href="favicon.ico" type="image/x-icon")
    each icon in iconLinks()
      link(rel=icon.rel sizes=icon.sizes href=icon.href)
    // pwa
    link(rel="manifest", href="manifest.webmanifest")
```

Usage

```js
const app = new PWAPlugin({
  name: 'Marker',# name of app, will be used in <title> tag and webmanifest
  scope: 'marker',# GitHub "root" directory, typically the name of the repo
  description: "Markdown Notepad",# description of app, will be used in <meta name=description> tag and webmanifest
  theme: '#fffff0',# theme of app, will be used in <meta name=theme-color> tag and webmanifest
  tag: 2# used for cache name, should change on each deployment
})
```


### Development notes

    npm link
    npm link pwa #in other project

Continuously build index.coffee

    npx coffee -bcw index.coffee

## TODO

* webpack dev server mimic GitHubs folder
* --watch option does not pickup changes