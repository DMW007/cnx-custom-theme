// ==UserScript==
// @name         Connections testsystem live reloading
// @version      0.1
// @description  Apply design changes of connections in realtime
// @author       DMW007
// @match        https://cnx65.internal/*
// @require      https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.22.2/moment.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.2.0/socket.io.js
// @noframes
// @run-at       document-start
// ==/UserScript==
class LiveDeveloperExtension {
  constructor() {
    this.disconnectedIcon = "❌";
    this.connectedIcon = "✅";
    this.socket = null;

    this.init();
  }

  init() {
    const localDevUrl = "http://127.0.0.1:3000";
    const cssFileName = 'custom-all.css'
    this.socket = io(localDevUrl);
    let $ = window.jQuery;
    this.setConnectionStateIcons($);
    let that = this;
    this.socket.on("reloadCss", function(cssContent) {
      console.warn(`reload: ${Math.round(cssContent.length / 1024)} kb css`);

      if ($("#custom-css").length == 0) {
        let css = $(`link[href$="${cssFileName}"]`);
        // Fallback if we dont have already our custom css inserted
        if(css.length == 0) {
            css = $('head').find('link').last()
        }
        css.after(`<style id="custom-css"></style>`);
      }
      $("#custom-css").html(cssContent);

      let endBracket = document.title.indexOf("]");
      if (endBracket !== -1) {
        // Offset für Klammer selbst und anschließendes Leerzeichen
        endBracket += 2;
        document.title = document.title.substr(
          endBracket,
          document.title.length - endBracket
        );
      }

      let time = moment().format("H:mm:ss");
      document.title = `[${time}] ${document.title}`;
      that.setTitleIcon(that.connectedIcon, $);
    });
  }

  setConnectionStateIcons($) {
    this.setTitleIcon(this.disconnectedIcon, $);
    this.socket.on("connect", () => this.setTitleIcon(this.connectedIcon, $));
    this.socket.on("reconnect", () => this.setTitleIcon(this.connectedIcon, $));
    this.socket.on("disconnect", () =>
      this.setTitleIcon(this.disconnectedIcon, $)
    );
  }
  setTitleIcon(icon, $) {
    console.log(`set title icon: ${icon}`);
    var title = $("title");
    title.html(icon + this.getTitleHtmlWithoutIcons($));
  }
  getTitleHtmlWithoutIcons($) {
    return $("title")
      .html()
      .replace(this.disconnectedIcon, "")
      .replace(this.connectedIcon, "");
  }
}
(() => {
  "use strict";
  let ext = new LiveDeveloperExtension();
})();
