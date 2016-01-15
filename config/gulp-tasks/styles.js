'use strict';

var gulp = require('gulp'),
  browserSync = require('browser-sync'),
  reload = browserSync.reload,
  stylus = require('gulp-stylus'),
  sourcemaps = require('gulp-sourcemaps'),
  autoprefixer = require('gulp-autoprefixer'),
  size = require('gulp-size'),
  notify = require('gulp-notify'),
  config = require('./config'),
  minifyCss = require('gulp-minify-css');

gulp.task('styles', function () {
  gulp.src(config.stylesEntryFile)
    .pipe(sourcemaps.init())
    .pipe(stylus({ include: [__base + 'node_modules/bootstrap-styl/bootstrap/'] }))
    .pipe(autoprefixer('last 2 versions'))
    .pipe(minifyCss())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(config.cssDir))
    .pipe(reload({stream: true}))
    .pipe(size())
    .pipe(notify('Stylus compilation complete.'));
});