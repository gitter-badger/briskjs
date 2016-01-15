var gulp        = require('gulp');
var browserSync = require('browser-sync').create();

// create a task that ensures the `js` task is complete before
// reloading browsers
gulp.task('styles-watch', ['styles'], browserSync.reload);

// use default task to launch Browsersync and watch styles
gulp.task('serve', ['styles'], function () {
	// Serve files from the root of this project
    browserSync.init({
        server: {
            baseDir: __base
        },
        port: 3000
    });

    // add browserSync.reload to the tasks array to make
    // all browsers reload after tasks are complete.
    gulp.watch("app/styles/**/*.styl", ['styles-watch']);
});