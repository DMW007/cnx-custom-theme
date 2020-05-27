![](doc/head-image.png)

The CNX Custom Theme allows customizing Connections to your needs with as less work and headaches as possible. It was started in the end of 2018 to gave Connections a more modern look & feel and adjust them to our corporate design.  

## Getting started
### Project itself
The following guide is written for Ubuntu. Make sure you have a supported NodeJS Version (LTS, currently 12):

```bash
$ nodejs --version
v10.15.2
```

In this case, the version is outdated. Uninstall the packaged version, add the official NodeJS LTS Repo and install the latest stable LTS:

```bash
sudo apt remove nodejs
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt install nodejs
```
This should install the latest LTS release:

```bash
$ nodejs --version
v12.16.3
```

We also use `npx` to execute local installed packages:

```bash
npm i -g npx
```

Now, install the NPM dependencies from the project root:

```bash
npm install
```

It will take some time until all packages are installed. Make sure that NPM can download them. When running behind a (corporate) proxy, you must set `$http_proxy`, `$https_proxy` and maybe `$no_proxy`. For example, in your `~/.bashrc` file.

### Load customized files
To apply the changes, you need to move the files from the `dist` folder to your IHS webserver and load them in a customized `header.jsp` like this:

```html
<link
  rel="stylesheet"
  type="text/css"
  href="/custom-theme/dist/css/custom-all.css?cache-control=max-age%3D0&lastModified=26052020"
/>
```

## Local live reloading
### Browser extension
1. Install [Tampermonkey](https://addons.mozilla.org/de/firefox/addon/tampermonkey/) if not already present as extension for your Browser
2. Click on the tampermonkey icon > _Create a new script_
3. Copy & paste the content of `src/tampermonkey/tampermonkey-extension.js` to the editor field
4. Adjust the `@match` directive to your connections base URL in the format `https://cnx65.internal/*`
5. Save all changes using CTRL + S.

### Server
Start the server:

```bash
$ node src/tampermonkey/tampermonkey-server.js
```

## Credits

Icon created by [monkik](https://www.flaticon.com/de/kostenloses-icon/kundendienst_1086507) from [flaticon](https://www.flaticon.com/).