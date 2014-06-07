module.exports = function(grunt) {

  grunt.initConfig({

    // The clean task ensures all files are removed from the dist/ directory so
    // that no files linger from previous builds.
    clean: ["dist/"],

    jshint: {
      files: [
        "Gruntfile.js", "app/**/*.js"
      ],
      options: {
        //scripturl: true,
        es3: true // IE8
      }
    },

    jst: {
      "dist/debug/templates.js": [
        "app/templates/**/*.html"
      ]
    },

    stylus: {
      compile: {
        options: {
          //'include css': true,
          //'paths': ['path/to/import', 'another/to/import']
        },
        files: {
          'dist/debug/styles.css': "app/styles/index.css",
          'styles-debug.css': "styles-index.css" // version relocated to root dir
        }
      }
    },    

    // This task uses James Burke's excellent r.js AMD build tool.  In the
    // future other builders may be contributed as drop-in alternatives.
    requirejs: {
      compile: {
        options: {      
          // Include the main configuration file.
          mainConfigFile: "app/config.js",

          // Output file.
          out: "dist/debug/require.js",

          // Root application module.
          name: "config",

          // Do not wrap everything in an IIFE.
          wrap: false
        }
      }
    },

    // The concatenate task is used here to merge the almond require/define
    // shim and the templates into the application code.
    // We want to only load one script file in index.html.
    concat: {
      dist: {
        src: [
          "vendor/requirejs/almond.js",
          "dist/debug/templates.js",
          "dist/debug/require.js"
        ],

        dest: "dist/debug/source.js",

        separator: ";"
      }
    },
         
    preprocess : {
      options: {
        context : {
          //DEBUG: true
        }
      },
      // Postprocess HTML
      html : {
        src : 'index-template.html',
        dest : 'index-combined.html'
      }
    },

    cssmin: {
      minify: {
        options: {
          keepSpecialComments: 0
        },
        files: {
          'dist/release/styles.css': ['dist/debug/styles.css'],
          'styles-combined.css': ['styles-debug.css'] // version relocated to root dir
        }
      }
    },


    // Takes the built require.js file and minifies it for filesize benefits.
    uglify: {
      "dist/release/source.js": [
        "dist/debug/source.js"
      ]
    }

  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-stylus');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jst');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-preprocess');

  grunt.registerTask("default", ["clean","jshint","jst","requirejs","concat","stylus"]);

  grunt.registerTask("debug", ["default"]);

  // The release task will run the debug tasks and then minify JS and CSS files.
  grunt.registerTask("release", ["debug","uglify","cssmin","preprocess:html"]);

};
