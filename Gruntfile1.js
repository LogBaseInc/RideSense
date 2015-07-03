'use strict';
module.exports = function (grunt) {
    var config = {
        pkg: grunt.file.readJSON('package.json'),
        baseDir: '.',
        srcDir: 'app',
        destDir: 'dist',
        tempDir: 'tmp',
        docsDir: 'docs/',
        copy: {
            main: {
                files: [
                    { expand: true, src: ['app/**'], dest: '<%= tempDir %>' },
                    { expand: true, src: ['app/assets/**'], dest: '<%= tempDir %>' },
                    { expand: true, src: ['bower_components/**'], dest: '<%= tempDir %>' },
                    { expand: true, src: ['index.html'], dest: '<%= tempDir %>' },
                ]
            }
        },
        htmlmin: {
            dist: {
                options: {
                    removeComments: true,
                    collapseWhitespace: true
                },
                files: [{
                    expand: true,
                    cwd: '<%= tempDir %>',
                    src: [
                        'index.html',
                        '**/*.html'],
                    dest: '<%= tempDir %>'
                },
                ]
            }
        },
        cssmin: {
            my_target: {
                files: [{
                    expand: true,
                    cwd: '<%= tempDir %>/app/assets/css/',
                    src: ['*.css', '!*.min.css'],
                    dest: '<%= tempDir %>/app/assets/css/',
                    ext: '.min.css'
                }]
            },
            combine: {
                files: {
                    '<%= tempDir %>/app/assets/css/style.build.min.css':
                        ['<%= tempDir %>/app/assets/css/customstyles.css',
                            '<%= tempDir %>bower_components/bootstrap/dist/css/bootstrap.css',
                            '<%= tempDir %>bower_components/angularjs-toaster/toaster.css',
                            '<%= tempDir %>assets/fonts/font-awesome/css/font-awesome.css',
                            '<%= tempDir %>bower_components/ngDialog/css/ngDialog.css',
                            '<%= tempDir %>bower_components/ngDialog/css/ngDialog-theme-default.css']
                }
            }

        },
        requirejs: {
            compile: {
                options: {
                    mainConfigFile: "app/main.js",
                    appDir: "<%= tempDir %>/",
                    baseUrl: "app",
                    removeCombined: true,
                    findNestedDependencies: true,
                    normalizeDirDefines: 'all',
                    inlineText: true,
                    skipPragmas: true,
                    dir: "<%= destDir %>",
                    optimize: "none",
                    optimizeCss: "none",
                    modules: [
                        {
                            name: "main"
                        },
                        {
                            name: "lib",
                        }
                    ],
                    generateSourceMaps: false,
                    optimizeAllPluginResources: true
                }
            }
        },
        clean: {
            build: ['<%= tempDir %>', '<%= destDir %>/app/scripts', '<%= destDir %>/bower_components', '<%= destDir %>/assets/less', '<%= destDir %>/assets/plugins'],
        },
        uglify: {
            my_target: {
                files: [{
                    expand: true,
                    dest: '<%= destDir %>',
                    cwd: '<%= destDir %>',
                    src: ['app/*.js', 'app/**/*.js', '!app/**/*.min.js']
                }]
            },
            options: {
                mangle: false,
                //squeeze: true,
                //quite: true,
                compress: {
                    sequences: true,
                    dead_code: true,
                    conditionals: true,
                    booleans: true,
                    unused: true,
                    if_return: true,
                    join_vars: true,
                    drop_console: true
                },
                preserveComments: false
            }
        }
    };

    // load plugins
    require('load-grunt-tasks')(grunt);

    // load task definitions
    grunt.loadTasks('tasks');

    grunt.initConfig(config);
};