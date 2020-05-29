A [webpack](https://webpack.js.org) plugin for small [PWA](https://developer.mozilla.org/en-US/docs/Web/Apps/Progressive) that are hosted on GitHub.

This is my first plugin, and could likely be much better. It was written because I had more than a couple PWAs hosted on GitHub and updating each one was a pain.

They are all hosted on the `master` branch's `docs/` folder. This is not the default option and needs to be [setup](https://help.github.com/articles/configuring-a-publishing-source-for-github-pages/#publishing-your-github-pages-site-from-a-docs-folder-on-your-master-branch) on GitHub.

Because files have cache-busting fingerprints, it is recommended to use [clean-webpack-plugin](https://github.com/johnagan/clean-webpack-plugin) to clean output directory.

### Convention over Configuration

Assumes the following directory structure

    root
    ┣ stylesheets/
    ┃ ┣ index.css
    ┃ ┗ other.css
    ┣ javascripts/
    ┃ ┣ index.js
    ┃ ┗ other.js
    ┣ images/
    ┃ ┣ icon-192.png
    ┃ ┗ icon-512.png
    ┣ favicon.ico (optional)
    ┗ views/
       ┗ index.pug

#### Stylesheets
All css files with be copied.

#### Javascripts
All js files with be copied.

#### Images
All images/icon-*.png will be used as icon listings in `manifest.webmanifest` and as `<link rel=apple-touch-icon>`

#### Views
All pug files will be rendered to html

##### Pug Helpers

* assetPath
* scriptAttributes
* iconLinks
* themeColor
* name
* desc

`views/index.pug` head tag should look something like this:

```pug
doctype html
html(lang="en")
  head
    title=name()
    meta(charset="UTF-8")
    meta(name="Description" content=desc())
    meta(name="theme-color" content=themeColor())
    meta(name="apple-mobile-web-app-capable" content="yes")
    meta(name="viewport" content="width=device-width, initial-scale=1")
    // scripts
    script&attributes(scriptAttributes('bundle.js'))
    script&attributes(scriptAttributes('pwa.js'))
    script&attributes(scriptAttributes('index.js'))
    // css
    link(rel='stylesheet' href=assetPath('index.css'))
    // icons
    link(rel="icon" href="favicon.ico" type="image/x-icon")
    each icon in iconLinks()
      link(rel=icon.rel sizes=icon.sizes href=icon.href)
    // pwa
    link(rel="manifest", href="manifest.webmanifest")
```

Plugin will build three files associated with PWA.

* pwa.js - load service worker and handle installation
* service.js - all files will be cached
* manifest.webmanifest

Usage

Install from GitHub

    npm install firien/gh-pwa

Use the same command to update package, I don't think `npm update` will fetch GitHub changes.

In webpack.config.js

```js
const app = new PWAPlugin({
  // name of app, will be used in <title> tag and webmanifest
  name: 'Marker',

  // GitHub "root" directory, typically the name of the repo
  scope: 'marker',

  // description of app, will be used in <meta name=description> tag and webmanifest
  description: "Markdown Notepad",

  // theme of app, will be used in <meta name=theme-color> tag and webmanifest
  theme_color: '#fffff0',

  // background color for webmanifest
  background_color: '#fffff0',

  // used for cache name, should change on each deployment
  tag: 2,

  // must manually match webpack mode
  // https://github.com/webpack/webpack/issues/6496
  // must use NODE_ENV=production to build proper service worker
  mode: 'development'
})
```

#### Examples

* [Marker](https://github.com/firien/marker)
* [Sconce](https://github.com/firien/sconce)
* [WiFi-QR](https://github.com/firien/wifi-qr)

---

### Development notes

    npm link
    npm link gh-pwa #in other project

