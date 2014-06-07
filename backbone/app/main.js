require([
  // Libs
  "jquery",
  "underscore",
  "backbone",
  "bootstrap", 
  "backbone.marionette",    
  
  // Application
  "app",

  // Modules
  "modules/common",
  "modules/search"
],

function($, _, Backbone, Marionette, Bootstrap, app, Common, Search) {

  var JST = window.JST = window.JST || {};  
  var realget = Backbone.Marionette.TemplateCache.get;
  
  Backbone.Marionette.TemplateCache.get = function(templateId) { 
    if (JST[templateId]) return JST[templateId]; // return compiled version from JST
    return realget.call(this,templateId);
  };
  
  Backbone.Marionette.TemplateCache.prototype.loadTemplate = function(templateId) {    
    var self = this;
    
    // Concatenate the file extension.
    //var path = templateId + ".html";

    // Fetch it synchronously (!) if not available from JST or cache, 
    // ensure that template requests are never cached 
    // and prevent global ajax event handlers from firing.
    return $.ajax({
      url: app.root + templateId,
      type: "get",
      dataType: "text",
      cache: false,
      global: false,
      async: false
    }).responseText; // Marionette.TemplateCache will compile and cache result

  };
      
  $(document).ready(app.start());
});
