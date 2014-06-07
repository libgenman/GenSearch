// Set the require.js configuration for your application.
require.config({
  urlArgs: "v=" + (new Date()).getTime(), // prevent script caching for debug
  
  deps: ["main"],

  priority: ["jquery", "underscore", "backbone"],

  paths: {    
    "jquery": "../vendor/jquery/jquery",
    // Use the underscore build of Lo-Dash to minimize incompatibilities.
    "lodash": "../vendor/lodash/lodash.underscore",

    "backbone": "../vendor/backbone/backbone",
    "backbone.deepmodel": "../vendor/backbone-deep-model/deep-model",
    "backbone.marionette": "../vendor/backbone.marionette/backbone.marionette",

    "backbone.paginator": "../vendor/backbone.paginator/backbone.paginator",           
    "bootstrap": "../vendor/bootstrap/js/bootstrap",
    "jqueryui": "../vendor/jquery-ui/ui/jquery-ui",
    "widgets": "libs/widgets"
  },

  map: {
    // Ensure Lo-Dash is used instead of underscore.
    "*": { "underscore": "lodash" }

    // Put additional maps here.
  },

  shim: {    
    "jquery" : {
      exports : '$'
    },
    "underscore" : {
      exports : '_'
    },
    "backbone" : {
      deps : ['jquery', 'underscore'],
      exports : 'Backbone'
    },
    "backbone.deepmodel" : {
      deps : ['jquery', 'underscore', 'backbone'],
      exports : 'DeepModel'
    },
    "backbone.marionette" : {
      deps : ['jquery', 'underscore', 'backbone'],
      exports : 'Marionette'
    },
    "backbone.paginator" : {
      deps : ['jquery', 'underscore', 'backbone'],
      exports : 'Paginator'
    },
    "jqueryui" : {
      deps: ['jquery']
    },
    "bootstrap": {
      deps: ['jquery']
    },
    "widgets" : {
      deps : ['jquery', 'jqueryui']
    }
  }

});
