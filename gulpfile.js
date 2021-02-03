const gulp = require("gulp"),
  rename = require("gulp-rename"),
  replace = require('gulp-replace');
  sass = require("gulp-sass"),
  cleanCSS = require("gulp-clean-css"),
  sourcemaps = require("gulp-sourcemaps"),
  noop = require("gulp-noop"),
  header = require("gulp-header"),
  cssBase64 = require("gulp-base64"),
  wait = require("gulp-wait"),
  concatCss = require("gulp-concat-css"),
  babel = require("gulp-babel"),
  // ToDo: Deprecated, durch gulp-bro ablösen: https://github.com/ngryman/gulp-bro
  browserify = require("browserify"),
  fs = require("fs-extra");

require("dotenv").load();

const srcFolder = "src";
const outputFolder = "dist";

let rawEnv = process.env.NODE_ENV;
let env = typeof rawEnv == "undefined" ? "production" : rawEnv.toLowerCase();
const productionBuild = Boolean(env == "" || env == "production");
console.log(`Prod: ${productionBuild} - Raw env: ${env} (${rawEnv})`);

let cleanCssOptions = {
  compatibility: "*",
  debug: true,
  level: 2
};
let outputFiles = {
  css: {
    baseDir: `${outputFolder}/css`,
    lib: 'custom-lib.css',
    custom: 'custom.css',
    fullBundle: 'custom-all.css',
    indexInputFile: `${srcFolder}/scss/index.scss`
  }, 
  cssTouchpoint: {
    baseDir: `${outputFolder}/css`,
    fullBundle: 'custom-touchpoint.css',
    indexInputFile: `${srcFolder}/scss/dedicated-bundles/touchpoint/touchpoint.scss`
  }, 
  js: {
    baseDir: `${outputFolder}/js`,
    custom: 'custom.js'
  }
}
let cleanCssCallback = details => {
  let saved = details.stats.minifiedSize - details.stats.originalSize;
  console.log(`\t${details.name}:  ${details.stats.minifiedSize / 1000}/${details.stats.originalSize / 1000} => ${saved / 1000} KB gespart`
  );
};

// We seperate some apps cause they were not properly integrated into CNX from a UI perspective. So it doesn't make sense to include our CNX bundle here,
// it doesn't match and would only cause a lot of overhead/potential for conflicts. But we can still use our color-vars in them, to give them the same
// look and feel like we applied for connections without redundance.
gulp.task("scss-touchpoint", () => {
  return gulp
  .src(outputFiles.cssTouchpoint.indexInputFile)
  .pipe(wait(200))
  .pipe(productionBuild ? noop() : sourcemaps.init())
  .pipe(sass())
  .pipe(rename(outputFiles.cssTouchpoint.fullBundle))
  .pipe(
    productionBuild ? cleanCSS(cleanCssOptions, cleanCssCallback) : noop()
  )
  .pipe(productionBuild ? sourcemaps.write() : noop())
  .pipe(header('/*`This file was automatically generated using gulp. Please apply changes to the original scss sources files. */\n'))
  .pipe(gulp.dest(outputFiles.cssTouchpoint.baseDir));
})

// Divide own CSS and included libraries for faster live-reloading (when usually just our own css changes)
gulp.task("scss", () => {
  gulp.src(["node_modules/@fortawesome/fontawesome-free/webfonts/*"])
    .pipe(gulp.dest(`${outputFolder}/webfonts`));

  let targetFile = "css/" + outputFiles.css.custom
  const cssBase64Config = {
    baseDir: "img",
    // To override sprite-positions, we include the original images directly from the CNX server
    exclude: [/^connections\/resources/, /\.(woff2?|ttf|svg|eot)/, /data:image\/svg\+xml/],
    // Encode all with base64 to avoid rewriting issues from WebSphere
    maxImageSize: 100000000000,
    debug: true,
    useRelativePath: true
  };
  let generationDate = new Date().toLocaleString();
  let headerNotice = `/* This file was automatically generated using build. Please fork the repo and apply changes in the scss files instead of editing this file.
    Environment: ${productionBuild ? "Production" : "Development"}
    Bundle: ${targetFile}
    Builddate: ${generationDate}
    */\n`;
  return gulp
    .src(outputFiles.css.indexInputFile)
    .pipe(wait(200))
    .pipe(productionBuild ? noop() : sourcemaps.init())
    .pipe(sass())
    .pipe(cssBase64(cssBase64Config))
    .pipe(rename(targetFile))
    .pipe(
      productionBuild ? cleanCSS(cleanCssOptions, cleanCssCallback) : noop()
    )
    .pipe(productionBuild ? sourcemaps.write() : noop())
    .pipe(header(headerNotice))
    .pipe(gulp.dest(outputFolder));
});
gulp.task("css-lib", () => {
  let faCss = "node_modules/@fortawesome/fontawesome-free/css"
  let base64Conf = {
    baseDir: faCss,
    maxImageSize: 100000000000
  };
  return gulp
    .src([
      `${faCss}/fontawesome.css`,
      "src/lib/fontawesome-fonts.scss",
      "node_modules/mobius1-selectr/dist/selectr.min.css",
      "node_modules/vanilla-tags-input/tags-input.css"
    ])
    .pipe(sass())
    .pipe(cssBase64(base64Conf))
    .pipe(concatCss(outputFiles.css.lib))
    .pipe(
      productionBuild ? cleanCSS(cleanCssOptions, cleanCssCallback) : noop()
    )
    .pipe(gulp.dest(outputFiles.css.baseDir));
});
gulp.task("bundle-all", gulp.series("scss", "css-lib", () => {
  let files = [`${outputFiles.css.baseDir}/${outputFiles.css.lib}`, `${outputFiles.css.baseDir}/${outputFiles.css.custom}`];
  return gulp
    .src(files)
    .pipe(concatCss(outputFiles.css.fullBundle))
    .pipe(
      productionBuild ? cleanCSS(cleanCssOptions, cleanCssCallback) : noop()
    )
    .pipe(replace("/*! addWithoutChange ", ""))
    .pipe(replace(" addWithoutChange */", ""))
    .pipe(gulp.dest(outputFiles.css.baseDir));
}));
gulp.task("css", gulp.series("scss", "scss-touchpoint", "css-lib", "bundle-all"));

gulp.task("watch-css", () => {
  var watcher = gulp.watch("src/**/*.scss", gulp.series("scss", "bundle-all"));
  watcher.on("change", filePath =>
    console.log(`[SASS-Watcher] File ${filePath} has changed`)
  );
});

gulp.task("js", () => {
  let jsSources = ["src/js/Index.js"];

  fs.mkdirpSync(outputFiles.js.baseDir);
  return browserify(jsSources)
    .transform("babelify")
    .bundle()
    .pipe(fs.createWriteStream(`${outputFiles.js.baseDir}/${outputFiles.js.custom}`));
});
gulp.task("watch-js", () => {
  var watcher = gulp.watch("src/**/*.js", gulp.series("js"));
  watcher.on("change", filePath =>
    console.log(`[JS-Watcher] File ${filePath} has changed`)
  );
});

gulp.task("watch", gulp.parallel("watch-css", "watch-js"));

gulp.task("default", gulp.series("css", "js"))