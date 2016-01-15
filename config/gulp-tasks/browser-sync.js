var gulp        = require('gulp');
var browserSync = require('browser-sync').create();

// create a task that ensures the `js` task is complete before
// reloading browsers
gulp.task('styles-watch', ['styles'], browserSync.reload);

// use default task to launch Browsersync and watch styles
gulp.task('browser-sync', function () {
	// Serve files from the root of this project
    browserSync.init({
        // informs browser-sync to proxy our expressjs app which would run at the following location
        proxy: 'http://localhost:4000'
    });

    // add browserSync.reload to the tasks array to make
    // all browsers reload after tasks are complete.
  gulp.watch(__base + 'app/assets/styles/**/*.styl', ['styles', browserSync.reload]);
  gulp.watch(__base + 'app/views/**/*.jade', ['bs-reload']);
});