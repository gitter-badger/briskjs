'use strict';

/**
 * Config file for Gulp tasks
 */

module.exports = {
    // Used for BrowserSync
    localUrl: 'localhost:3000',
    stylesEntryFile: __base + 'app/assets/styles/main.styl',
    stylesWatch: __base + 'app/assets/styles/**/*.styl', // what files to watch to trigger the styles task
    cssDir: __base + 'public/styles' // destination
}