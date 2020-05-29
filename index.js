const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const pug = require('pug');
const crypto = require('crypto');
const UPNG = require('upng-js');

const $hashLength = 20;

// use with Array::filter (remove nulls and undefined)
const compactor = function(item) {
  return item != null;
};

// webpack uses md4 by default
const hashString = function(buf) {
  return crypto.createHash('md4').update(buf).digest('hex').substring(0, $hashLength);
};

// redner ejs
const renderSync = function(filePath, locals) {
  var template;
  template = fs.readFileSync(filePath);
  return ejs.render(template.toString(), locals, {});
};

class PWAPlugin {
  constructor(options) {
    this.options = options;
  }

  generatePWA() {
    let scope;
    let templatePath = path.join(__dirname, 'templates/pwa.js.ejs');
    if (this.options.mode === 'production') {
      scope = `${this.options.scope}/`;
    } else {
      scope = '';
    }
    let js = renderSync(templatePath, {scope});
    let hash = hashString(js);
    let newFileName = `pwa.${hash}.js`;
    return {
      name: newFileName,
      source: js,
      size: js.length
    };
  }

  generateServiceWorker(assets) {
    let assetKeys;
    if (this.options.mode === 'production') {
      assetKeys = Object.keys(assets).map(function(asset) {
        return `/${this.options.scope}/${asset}`;
      }, this);
      assetKeys.push(`/${this.options.scope}/`);
    } else {
      assetKeys = Object.keys(assets);
      assetKeys.push('/');
    }
    let templatePath = path.join(__dirname, 'templates/service.js.ejs');
    let locals = {
      tag: this.options.tag,
      app: this.options.scope,
      files: assetKeys
    };
    let js = renderSync(templatePath, locals);
    return {
      name: 'service.js',
      source: js,
      size: js.length
    };
  }

  // renders Pug files in /views/ to html
  renderViews(compilation) {
    let assetKeys = Object.keys(compilation.assets);
    // =================== start local pug definitions
    const assetPath = function(_path) {
      let extname = path.extname(_path);
      let basename = path.basename(_path, extname);
      let regex = new RegExp(`${basename}\\.[\\w]{${$hashLength}}\\${extname}`);
      let foundAsset = assetKeys.find(function(asset) {
        return regex.test(asset);
      });
      if (foundAsset) {
        return foundAsset;
      } else {
        throw `could not find ${_path}`;
      }
    };
    // include sha256 integrity attribute
    let scriptAttributes = function(_path) {
      _path = assetPath(_path);
      let _asset = compilation.assets[_path];
      let sha256 = crypto.createHash('sha256').update(_asset.source()).digest('base64');
      return {
        src: _path,
        integrity: `sha256-${sha256}`
      };
    };
    // generate <links> for icon-*.png
    const iconLinks = function() {
      let regex = /icon-.*?\.png/i;
      return assetKeys.map(function(asset) {
        if (regex.test(asset)) {
          let png = UPNG.decode(compilation.assets[asset].source());
          return {
            rel: 'apple-touch-icon',
            sizes: `${png.width}x${png.height}`,
            href: asset
          };
        }
      }).filter(compactor);
    };
    const themeColor = (function() {
      return this.options.theme_color;
    }).bind(this);
    const desc = (function() {
      return this.options.description;
    }).bind(this);
    const name = (function() {
      return this.options.name;
    }).bind(this);
    let locals = {
      assetPath,
      scriptAttributes,
      iconLinks,
      themeColor,
      desc,
      name,
      pretty: true
    };
    // =================== end local pug definitions
    return fs.readdirSync('./views').map(function(fileName) {
      if (/\.pug/.test(fileName)) {
        let filePath = path.resolve('./views', fileName);
        let html = pug.renderFile(filePath, locals);
        let newFileName = fileName.replace(/pug$/, 'html');
        // add dependencies
        compilation.fileDependencies.add(filePath);
        return {
          name: newFileName,
          source: html,
          size: html.length
        };
      }
    }).filter(compactor);
  }

  // transpiles Coffee files in /javascripts/ to js
  // directly copies plain js
  copyJS(compilation) {
    return fs.readdirSync('./javascripts').map(function(fileName) {
      let filePath = path.resolve('./javascripts', fileName);
      if (/\.js$/.test(fileName)) {
        compilation.fileDependencies.add(filePath);
        let source = fs.readFileSync(filePath);
        let hash = hashString(source);
        let js = source.toString();
        let newFileName = fileName.replace(/\.js$/, `.${hash}.js`);
        return {
          name: `javascripts/${newFileName}`,
          source: js,
          size: js.length
        };
      }
    }).filter(compactor);
  }

  // transpiles SASS files in /stylesheets/ to css
  // directly copies plain css
  copyCSS(compilation) {
    return fs.readdirSync('./stylesheets').map(function(fileName) {
      let filePath = path.resolve('./stylesheets', fileName);
      if (/\.css$/.test(fileName)) {
        compilation.fileDependencies.add(filePath);
        let source = fs.readFileSync(filePath);
        let hash = hashString(source);
        let css = source.toString();
        let newFileName = fileName.replace(/\.css$/, `.${hash}.css`);
        return {
          name: `stylesheets/${newFileName}`,
          source: css,
          size: css.length
        };
      }
    }).filter(compactor);
  }

  copyImages(compilation) {
    if (fs.existsSync('./images')) {
      return fs.readdirSync('./images').map(function(fileName) {
        var extname, filePath, hash, imageData, newFileName, regexp;
        extname = path.extname(fileName);
        if (/png/i.test(extname)) {
          filePath = path.resolve('./images', fileName);
          compilation.fileDependencies.add(filePath);
          imageData = fs.readFileSync(filePath);
          hash = hashString(imageData);
          regexp = new RegExp(`\\${extname}$`);
          newFileName = fileName.replace(regexp, `.${hash}${extname}`);
          return {
            name: `images/${newFileName}`,
            source: imageData,
            size: imageData.length
          };
        }
      }).filter(compactor);
    } else {
      return [];
    }
  }

  generateManifest(assets) {
    var assetKeys, manifest, regex, str;
    assetKeys = Object.keys(assets);
    manifest = {
      name: this.options.name,
      short_name: this.options.short_name || this.options.name,
      start_url: '.',
      display: 'standalone',
      background_color: this.options.background_color || this.options.theme_color,
      theme_color: this.options.theme_color,
      description: this.options.description
    };
    regex = /icon-.*?\.png/i;
    manifest.icons = assetKeys.map(function(asset) {
      var png;
      if (regex.test(asset)) {
        png = UPNG.decode(assets[asset].source());
        return {
          src: asset,
          type: 'image/png',
          sizes: `${png.width}x${png.height}`
        };
      }
    }).filter(compactor);
    str = JSON.stringify(manifest, null, 4);
    return {
      name: 'manifest.webmanifest',
      source: str,
      size: str.length
    };
  }

  apply(compiler) {
    var pwa;
    pwa = this;
    return compiler.hooks.emit.tapAsync('PWAPlugin', function(compilation, callback) {
      var addAsset, faviconPath, imageData, outputPath;
      outputPath = compiler.outputPath;
      addAsset = function(asset) {
        return compilation.assets[asset.name] = {
          source: function() {
            return asset.source;
          },
          size: function() {
            return asset.source.length;
          }
        };
      };
      pwa.copyJS(compilation).forEach(addAsset);
      pwa.copyCSS(compilation).forEach(addAsset);
      pwa.copyImages(compilation).forEach(addAsset);
      addAsset(pwa.generatePWA());
      addAsset(pwa.generateManifest(compilation.assets));
      pwa.renderViews(compilation).forEach(addAsset);
      addAsset(pwa.generateServiceWorker(compilation.assets));
      faviconPath = path.resolve('./favicon.ico');
      if (fs.existsSync(faviconPath)) {
        imageData = fs.readFileSync(faviconPath);
        addAsset({
          name: 'favicon.ico',
          source: imageData,
          size: imageData.length
        });
      }
      return callback();
    });
  }

};

// export default PWAPlugin
module.exports = PWAPlugin;
