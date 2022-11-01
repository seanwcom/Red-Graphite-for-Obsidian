/* 
Many people use Grunt, but I sourced this from the exceptional Minimal theme
which can be found here: https://github.com/kepano/obsidian-minimal
*/
module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    /* Get the user-defined OBSIDIAN_PATH from .env file 
       so that we can live reload the theme in the vault */
    env: {
      local: {
        src: ".env"
      }
    },

    // Create red-graphite.css and red-graphite.min.css from index.scss
    sass: {
      dist: {
        options: {
          style: 'compressed',
          sourceMap: false
        },
        files: {
          'src/css/red-graphite.min.css': 'src/scss/index.scss'
        }
      }
    },

    // css used for distribution and live reload
    cssmin: {
      options: {
        advanced: false,
        aggressiveMerging: false,
        mediaMerging: false,
        restructuring: false
      },
      target: {
        files: {
          'src/css/red-graphite.min.css': 'src/css/red-graphite.min.css'
        }
      }
    },

    // Concatenate theme files adding Style Settings
    concat_css: {
      dist: {
        files: {
          // 'theme.css': ['src/css/red-graphite.min.css', 'src/css/alternate-checkboxes.css', 'src/css/style-settings.css']
          'theme.css': ['src/css/red-graphite.min.css', 'src/css/style-settings.css']
        }
      }
    },

    // Put files where they need to go
    copy: {
      local: {
        files: [
          {
            expand: true,
            src: 'theme.css',
            dest: "<%= OBSIDIAN_PATH %>"
          },
          {
            expand: true,
            src: 'manifest.json',
            dest: "<%= OBSIDIAN_PATH %>"
          }
        ]
      }
    },

    // Watch for changes, and compile new changes
    watch: {
      css: {
        files: ['src/**/*.scss', 'src/**/*.css'],
        tasks: ['env:local', 'loadconst', 'sass:dist', 'concat_css:dist', 'copy']
      }
    }
  });

  grunt.loadNpmTasks('grunt-env');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-concat-css');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('loadconst', 'Load constants', function () {
    grunt.config('OBSIDIAN_PATH', process.env.OBSIDIAN_PATH);
  });

  grunt.registerTask('build', ['env:local', 'loadconst', 'sass:dist', 'concat_css:dist', 'copy']);
  grunt.registerTask('default', ['env:local', 'loadconst', 'watch']);
}