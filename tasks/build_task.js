module.exports = function (grunt) {

    // Concat and Minify the src directory into dist
    grunt.registerTask('build', [
        'copy',
        'htmlmin',
        'cssmin',
        'requirejs',
        'clean',
        'uglify'
    ]);
};
