global.__base = __dirname + '/'

/**
 * Pull in tasks
 */

const requireDir = require('require-dir')

requireDir(__dirname + '/config/gulp-tasks')
