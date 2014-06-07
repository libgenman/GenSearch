define([
  // Libs
  "jquery",
  "underscore",
  "backbone",
  "backbone.marionette",
  "bootstrap"
],

function($, _, Backbone, Marionette, Bootstrap) {

  var app = new Backbone.Marionette.Application({
    // The root path to run the application through.
    root: "/",
    api_url: location.protocol + "//" + location.host+'/api/'    
  });

  
  var ModalRegion = Marionette.Region.extend({
    constructor: function() {
      Marionette.Region.prototype.constructor.apply(this, arguments);

      this.ensureEl();
      this.$el.on('hidden', {region:this}, function(event) {        
        // handle bootstrap event
        event.data.region.close();
      });
    },
 
    onShow: function() {
      this.$el.modal('show');
      var region=this;
      this.currentView.on('close', function() {
        // handle self-closing view
        // region.onClose will not be triggered because region.currentView is already closed
        region.$el.modal('hide');
      });      
    }
     
  });

  var AppLayout = Backbone.Marionette.Layout.extend({
    template: 'app/templates/main-layout.html',

    regions: {
      contentRegion: '.content-region'
    }
  });

  app.addRegions({
    mainRegion: "#main-region",
    modalRegion: { selector: "#modal-region", regionType: ModalRegion }
  });
    
  app.addInitializer(function(){
    this.mainLayout = new AppLayout();    
    this.mainRegion.show(app.mainLayout);
  });  
  
  app.on("initialize:after", function(options){  
    //Backbone.history.start({ pushState: true, root: app.root });
    Backbone.history.start({ hashChange: true, pushState: false, root: app.root });
    
    $(document).on("click", "a[href]:not([data-bypass])", function(evt) {
      // 'prop' is absolute path including protocol?
      // 'attr' is path as it given in tag
      var href = { prop: $(this).prop("href"), attr: $(this).attr("href") };

      var root = location.protocol + "//" + location.host + app.root;
      
      if (href.attr!='#') {

        // Ensure the root is part of the anchor href, meaning it's relative.
        if (href.prop.slice(0, root.length) === root) {
          // Stop the default event to ensure the link will not cause a page refresh.
          evt.preventDefault();

          Backbone.history.navigate(href.attr, true);
        }
      
      }
    });

  });

  return app;

});
