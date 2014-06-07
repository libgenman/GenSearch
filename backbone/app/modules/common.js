define([
  // Libs
  "underscore",
  "backbone",
  "backbone.marionette",
  
  // Application
  "app"
 ],

function(_, Backbone, Marionette, app) {

  var Common = {};
  
  Common.Loading = Backbone.Marionette.ItemView.extend({
    template: _.template( '<div class="container-fluid well">Loading…</div>' )
  });

  Common.Error = Backbone.Marionette.ItemView.extend({
    template: _.template( '<div class="alert alert-error"><b>Error!</b></div>' )
  });

  Common.ErrorModel = Backbone.Model.extend({
  });
  
  Common.ErrorResponse = Backbone.Marionette.ItemView.extend({
    template: _.template( '<div class="alert alert-error"><b>Error: <%- error %></b></div>' )
  });

  Common.EmptySet = Backbone.Marionette.ItemView.extend({
    template: _.template( '<div class="container-fluid well">No results found.</div>' )
  });

  Common.ErrorRegion = Backbone.Marionette.Region.extend({
    initialize: function(options) {
      if (options) {
        if (options.parentEl) {
          this.getEl = function(selector) {
            var parentEl = options.parentEl;
            if (_.isFunction(parentEl)){
              parentEl = parentEl();
            }
            return parentEl.find(selector);
          };
        }
      }
    }
  });

  return Common;

});
