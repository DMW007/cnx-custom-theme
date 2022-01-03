const fs = require("fs");
const chokidar = require("chokidar");
const path = require("path");
const express = require("express");

let app = express();
let root = path.resolve(`${__dirname}/../..`)
let www = path.resolve(`${root}/dist`)
console.log(`wwwroot = ${www} - Main root = ${__dirname}`)
app.use(express.static(www));

var http = require("http").createServer(app);
var io = require("socket.io")(http);
io.origins( function (origin, callback) {
  return callback (null, true);
});

io.on("connection", socket => {
  // Lokale Änderungen beim händischen neu Laden bzw neu Öffnen anzeigen, ohne dass SCSS händisch gespeichert/getriggert werden muss
  sendChanges(socket);
});

let distDir = `${root}/dist/css`;
let watcherOpts = {
  cwd: path.resolve(distDir)
};
let watcher = chokidar
  .watch("*.css", watcherOpts)
  .on("change", (event, path) => {
    sendChanges();
  });
function sendChanges(socket) {
  let path = `${distDir}/custom-all.css`;
  console.log(`Lade Änderungen aus ${path}`);

  let css = "";
  let waitInterval = setInterval(() => {
    css = fs.readFileSync(path).toString();
    // Manchmal sind wir schneller als Gulp, dann ist der Dateiinhalt 0 Byte groß
    if (css.length > 0) {
      clearInterval(waitInterval);

      console.log(`Sende ${Math.round(css.length / 1024)} kb css`);
      let socketToUse = typeof socket == "undefined" ? io : socket;
      socketToUse.emit("reloadCss", css);
    } else {
      console.warn("Kein CSS gefunden, warte weitere 100ms");
    }
  }, 100);
}
http.listen(3000, () => {
  console.log("listening on *:3000");
});
