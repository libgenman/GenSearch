define([
  // Libs
  "jquery",
  "jqueryui",
  "backbone",
  "backbone.deepmodel",
  "backbone.marionette",
  "backbone.paginator",
  "widgets",

  // Application
  "app",
  "modules/common"
],

function($, jQueryUI, Backbone, DeepModel, Marionette, Paginator, widgets, app, Common) {

  var Search = app.module('Search');

  Search.Model = Backbone.Model.extend({
    
    defaults: {
      'id':0
    },
    
    /*
    url: function() {
      return app.api_url+'book/'+encodeURIComponent(this.get('MD5'));
    },
    */

    navigateView: function() {
      var fragment='book/view/';
      fragment=fragment+encodeURIComponent(this.get('MD5'));
      Backbone.history.navigate(fragment);
    }

  });

  Search.MetaModel = Backbone.DeepModel.extend({
    defaults: {
      'preferred_pagesizes': [10,15,20,25,30,50,100,1000]
    }
  });

  Search.Collection = Backbone.Paginator.clientPager.extend({
    model: Search.Model,

    paginator_core: {
      url: app.api_url+'search?',
      dataType: 'json'
    },

    paginator_ui: {
      firstPage: 1, // Paginator.clientPager always use 1
      currentPage: 1,
      defaultPerPage: 10,
      perPage: 10,  // server will return default value
      totalPages: 1, // default value in case server request will not respond
      //pagesInRange: 1, // not used
      sortColumn: null,       // Paginator.clientPager internal
      filterExpression: null, // Paginator.clientPager internal
      searchQuery: '',
      defaultSortOrder: 'title',
      sortOrder: 'title',
      defaultFields: 'taspuyve',
      fields: 'taspuyve',
      defaultShow: '',
      show: ''
    },

    server_api: {
      'fields': function() { return encodeURIComponent(this.fields=='-'?'':this.fields); },
      'show': function() { return encodeURIComponent(this.show); },
      'sort': function() { return encodeURIComponent(this.sortOrder); },
      'query': function() { return encodeURIComponent(this.searchQuery); }
    },

    parse: function(objs) {      
      this.meta.set(objs.meta);
      this.totalFound = objs.meta.total_found;  //? refactor everywhere to meta.get()?
      this.queryTime = objs.meta.query_time; //? refactor everywhere to meta.get()?
      this.totalRecords = objs.items.length;      
      return objs.items;
    },

    initialize: function(models, options) {
      this.meta = new Search.MetaModel();
      if (options) {
        //this.paginator_ui.currentPage=options.currentPage; // this way also works // but in which order?
        this.sortOrder=options.sortOrder || this.paginator_ui.sortOrder;
        this.fields=options.fields || this.paginator_ui.fields;
        this.show=options.show || this.paginator_ui.show;
        this.currentPage=options.currentPage || this.paginator_ui.currentPage;
        this.perPage=options.perPage || this.paginator_ui.perPage;
        this.searchQuery=options.query;
      }
    },
      
    navigateList: function() {
      var fragment='search/';
      fragment=fragment+(this.sortOrder==this.defaultSortOrder?'':'sort/'+encodeURIComponent(this.sortOrder)+'/');
      fragment=fragment+(this.fields==this.defaultFields?'':this.fields===''?'fields/-/':'fields/'+encodeURIComponent(this.fields)+'/');
      fragment=fragment+(this.show==this.defaultShow?'':'show/'+encodeURIComponent(this.show)+'/');
      fragment=fragment+(this.perPage==this.defaultPerPage?'':'count/'+encodeURIComponent(this.perPage)+'/');
      fragment=fragment+(this.currentPage==this.firstPage?'':'page/'+encodeURIComponent(this.currentPage-this.firstPage+1)+'/');
      fragment=fragment+(this.searchQuery===''?'':'query/'+encodeURIComponent(this.searchQuery));
      Backbone.history.navigate(fragment);
    } 
      
  });

  Search.Item = Backbone.Marionette.ItemView.extend({
    template: "app/templates/search-item.html",

    tagName: "tr",
      
    className: function() {
      
      var visible=this.model.get('visible');
      if (visible==2) {
        return "error";
      } else
      if (visible==1) {
        return "warning";
      } else
      if (visible!==0) {
        return "info";
      } else {
        return null;
      }
    },

    templateHelpers: function() {
      return {
        'meta': this.model.collection.meta,
        'mirror_list': this.model.collection.meta.get('mirror_list'),
        'datestamp':function (unix_timestamp) {
          var dt = new Date(unix_timestamp*1000);
          return dt.getFullYear() + '-' + ('0'+(dt.getMonth()+1)).slice(-2) + '-' + ('0'+dt.getDate()).slice(-2);
        },
        'timestamp':function (unix_timestamp) {
          var dt = new Date(unix_timestamp*1000);
          return dt.getFullYear() + '-' + ('0'+(dt.getMonth()+1)).slice(-2) + '-' + ('0'+dt.getDate()).slice(-2) + ' ' +
                 ('0'+dt.getHours()).slice(-2) + ':' + ('0'+dt.getMinutes()).slice(-2) + ':' + ('0'+dt.getSeconds()).slice(-2);
        }
      };
    },

    initialize: function() {
    }
  }); 

  Search.Composite = Backbone.Marionette.CompositeView.extend({
    template: 'app/templates/search-composite.html',

    itemView: Search.Item,
    itemViewContainer: '.itemlist',

    initialize: function() {

      this.listenTo(this.collection, {        
        'request': function(sender, request) {
          if (sender==this.collection) {
            this.$el.find('.itemlist').addClass('muted');
            if (!this.collection.length) {
              this.errorRegion.show(new Common.Loading());
            }
          }
        },
        'sync': function(sender) {
          if (sender==this.collection) {
            this.$el.find('.itemlist').removeClass('muted').show();
            if (this.collection.length===0) {
              this.errorRegion.show(new Common.EmptySet());
            } else {
              this.errorRegion.close();
            }
          }
        },
        'error': function(sender, xhr) {
          // check because model inside collection also can trigger this event
          if (sender==this.collection) {
            this.collection.reset();
            this.$el.find('.itemlist').hide();
            var error = xhr.status;
            if (xhr.status == 400) {
              var response = Backbone.$.parseJSON(xhr.responseText);
              error = response.error;
            }
            this.errorRegion.show(new Common.ErrorResponse({model: new Common.ErrorModel({error: error})}));
          }
        }
      });
      
      //this.collection.navigateList(); // normalize url after routing
    },

    onRender: function() {
      this.errorRegion = new Common.ErrorRegion({el: '.messagediv', parentEl: this.$el});      

      this.$el.find(".label-total-count").text(this.collection.totalRecords);
      
      this.$el.find(".inputbox-query").val(this.collection.searchQuery);
      
      this.$el.find(".dropdown-toggle").dropdownwidget();
           
      this.$el.find('.dropdown-pagesize').dropdownwidget('value',this.collection.perPage);
      
      this.$el.find('.dropdown-sortorder').dropdownwidget('value',this.collection.sortOrder);
      
      this.initSearchCheckBoxes();
      this.initFilterCheckBoxes();
      
      var collection = this.collection;
      var $el = this.$el;
      $el.find('.pagination').paginatorwidget({
        currentPage: collection.currentPage-collection.firstPage,
        totalPages: Math.max(collection.information.totalPages,1),
        goTo: function (event, data) {
          collection.goTo(data.pageNum + collection.firstPage);
          collection.navigateList();
          $el.find('.pagination').paginatorwidget({ currentPage: data.pageNum }); // update all paginators
        }
      });
    },
      
    collectSearchCheckBoxes: function() {
      var fields='';
      this.$el.find('.checkbox-search').each(function(i, elem) {
        if ($(this).prop('checked')) {
          fields += $(this).attr('name');
        }
      });
      return fields;
    },

    collectFilterCheckBoxes: function() {
      var show='';
      this.$el.find('.checkbox-filter').each(function(i, elem) {
        if ($(this).prop('checked')) {
          show += $(this).attr('name');
        }
      });
      return show;
    },

      
    initSearchCheckBoxes: function() {
      this.$el.find('.checkbox-search').prop('checked',false);
      var fields = this.collection.fields;
      this.$el.find('.checkbox-search').each(function(i, elem) {
        $(this).prop('checked',fields.indexOf($(this).attr('name'))>=0);
      });     
      this.updateAllCheckBox();
    },

    initFilterCheckBoxes: function() {
      this.$el.find('.checkbox-filter').prop('checked',false);
      var show = this.collection.show;
      this.$el.find('.checkbox-filter').each(function(i, elem) {
        $(this).prop('checked',show.indexOf($(this).attr('name'))>=0);
      });     
    },
    
    allCheckBoxes: function() {
      var checkboxes=this.$el.find('.checkbox-search');
      var count=0;
      checkboxes.each(function(i, elem) {
        if ($(this).prop('checked')) {
          count++;
        }
      });
      return count===0 ? false : count==checkboxes.length ? true : void 0;
    },
    
    updateAllCheckBox: function() {
        var all = this.allCheckBoxes();
        var $el = this.$el.find('.checkbox-search-select-all');
        if (all===true) {
          $el.prop("checked", true);
          $el.prop("indeterminate", false);
        } else
        if (all===false) {
          $el.prop("checked", false);
          $el.prop("indeterminate", false);
        } else {
          $el.prop("checked", false);
          $el.prop("indeterminate", true);
        }      
    },
    
    fetchData: function() {
      this.collection.fields=this.collectSearchCheckBoxes();
      this.collection.show=this.collectFilterCheckBoxes();
      if (this.collection.searchQuery==='') {
        return false;
      }
      this.collection.currentPage = this.collection.firstPage;
      this.collection.reset();
      this.collection.origModels = undefined;
      var $el = this.$el;
      var view = this;
      this.collection.fetch({
        timeout: 5*60*1000, // msec
        success: function(collection){
          collection.pager();
          if (collection.totalRecords<collection.totalFound) {
            $el.find(".label-total-count").html('Found: <b class="text-error">'+collection.totalFound.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')+'</b> (showing first <b>'+collection.totalRecords+'</b>) <span class="muted">['+collection.queryTime+' sec]</span>');
          } else {
            $el.find(".label-total-count").html('Found: <b>'+collection.totalRecords+'</b> <span class="muted">['+collection.queryTime+' sec]</span>');
          }
          $el.find('.pagination').paginatorwidget({ currentPage: collection.currentPage-collection.firstPage, totalPages: Math.max(collection.information.totalPages,1) }); // update all paginators
        },
        silent: true
      });
      this.collection.navigateList();        
    },

    events: {
      'dropdownwidgetchange .dropdown-pagesize': function(event, data) {
        this.collection.perPage=parseInt(data,10);
        this.collection.currentPage=this.collection.firstPage;
        this.collection.pager();
        this.$el.find('.pagination').paginatorwidget({ currentPage: this.collection.currentPage-this.collection.firstPage, totalPages: Math.max(this.collection.information.totalPages,1) }); // update all paginators                
        this.collection.navigateList();
      },
      'dropdownwidgetchange .dropdown-sortorder': function(event, data) {
        this.collection.sortOrder=data;
        this.fetchData();
      },        
      /*
      "focusout .inputbox-query": function(event) {
        if (this.collection.searchQuery!=this.$el.find('.inputbox-query').val()) {
          this.$el.find('.button-search').click();
        }
      },
      */
      'keyup .inputbox-query': function(event) {
        if (event.keyCode==13) {
          this.$el.find('.button-search').click();
          //return false;
        }        
      },
      'click .button-search': function(event) {
        this.collection.searchQuery = this.$el.find('.inputbox-query').val();
        this.fetchData();
      },
      'click .checkbox-search': function(event) {
        this.updateAllCheckBox();
      },
      'click .checkbox-search-select-all': function(event) {
        var all = this.allCheckBoxes();
        if (all===true) {
          this.$el.find('.checkbox-search').prop('checked',false);
        } else
        if (all===false) {
          //this.$el.find('.checkbox-search').prop('checked',true);
          this.collection.fields=this.collection.defaultFields;
          this.initSearchCheckBoxes();
        } else {
          this.$el.find('.checkbox-search').prop('checked',true);
        }
        this.updateAllCheckBox();
      }
             
    }
    
  });
    
  Search.Router = Marionette.AppRouter.extend({
    controller: {
      
      goSearch: function(sort,fields,show,count,page,query) {
        app.mainLayout.contentRegion.show(new Common.Loading());
        
        var sortorder = sort || null;
        var fieldlist = fields || null;
        var showlist = show || null;
        var pagesize = +count||null;
        var curpage = page===null?null:(isNaN(page)?null:page);
        var searchquery = query || '';
        
        var options = {'sortOrder':sortorder, 'fields': fieldlist, 'show': showlist, 'currentPage': curpage, 'perPage': pagesize, 'query': searchquery};
        var collection = new Search.Collection([], options);
        
        if (searchquery!=='') {
          collection.fetch({
            success: function(data) {
              collection.pager();
              app.mainLayout.contentRegion.show(new Search.Composite({collection: collection, model: collection.meta}));
              //app.mainLayout.contentRegion.show(new Search.Composite({collection: collection}));
            },
            error: function(data) {
              app.mainLayout.contentRegion.show(new Common.Error());
            },
            silent: true
          });
        } else {
          collection.origModels=[];
          collection.info();
          app.mainLayout.contentRegion.show(new Search.Composite({collection: collection, model: collection.meta}));
          //app.mainLayout.contentRegion.show(new Search.Composite({collection: collection}));
        }
      }
    },
    
    appRoutes: {
      '': "goSearch",
      'search/(sort/:sort/)(fields/:fields/)(show/:show/)(count/:count/)(page/:page/)(query/*query)': "goSearch"
    }
  });

  // initialize router right here
  Search.router = new Search.Router({
    //controller: Search.controller
  });


  Search.addInitializer(function(){
  });

  Search.addFinalizer(function(){
  });

  // Required, return the module for AMD compliance.
  return Search;

});
