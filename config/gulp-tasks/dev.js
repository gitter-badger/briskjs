
'use strict';

var gulp = require('gulp');
var browserSync = require('browser-sync');
var nodemon = require('gulp-nodemon');

// we'd need a slight delay to reload browsers
// connected to browser-sync after restarting nodemon
var BROWSER_SYNC_RELOAD_DELAY = 500;

gulp.task('css', function () {
  return gulp.src('public/styles/*.css')
    .pipe(browserSync.reload({ stream: true }));
})

gulp.task('bs-reload', function () {
  browserSync.reload();
});

gulp.task('scripts', function () {
    // Compile client JS with Webpack
  var bundle = require('../bundle.js');
  bundle();
});

gulp.task('nodemon', function (cb) {
  var started = false;
  return nodemon({
    script: __base + 'app/app.js',
    ignore: [__base + 'app/assets/scripts/**/*.js']
  }).on('start', function () {
    // to avoid nodemon being started multiple times
    // thanks @matthisk
    if (!started) {
      cb();
      started = true; 
    }
  });
});

gulp.task('dev', ['styles', 'scripts', 'browser-sync', 'nodemon'])