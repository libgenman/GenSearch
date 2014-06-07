/**
 * jQuery UI widgets for Twitter Bootstrap markup
 *
 * Version:  0.2.1
 *
 */
(function( $, undefined ) {

$.widget( "ua.paginatorwidget", {
  options: {
    // required
    currentPage: 0,
    totalPages: 1,
    // optional
    showPages: 11 // Number of page links to show, should be odd
  },

  _create: function() {
    this._setPagePage();
    this._render();
  },

  _destroy: function() {
  },

  _setOption: function( key, value ) {
    this._super( key, value );
    
    this._setPagePage();
    this._render();    
  },

  _render: function() {
    var $list = $("<ul></ul>");
    var o = this.options;
    var item;
    var i;
    
    this.element.empty();
    this.element.append($list);
    
    $list.append(this._buildItem('«',this._buildAttr(0),o.currentPage===0));
    $list.append(this._buildItem('‹',this._buildAttr(Math.max(o.currentPage-1,0)),o.currentPage===0));
            
    if (this.pageFrom>0) {
      item = this._buildItem('…','',true);
      this._on(item, {
        click: function ( event ) {
          this._setPagePage(-1);
          this._render();
          this._trigger( "goTo", event, { pageNum: ~~((this.pageFrom+this.pageTo)/2) } );
          return false;
        }
      });
      $list.append(item);
    }
    for (i=this.pageFrom; i<=this.pageTo; i++) {
      item = this._buildItem((i+1).toString(),this._buildAttr(i),false,o.currentPage===i);
      $list.append(item);
    }
            
    // page events are bind to parent list
		this._on($list, {
			click: function( event ) {
        var $a=$(event.target).closest('a'); // link can have markup
        if ($a.attr("data-value") !== void 0) {
          this._trigger( "goTo", event, { pageNum: parseInt($a.attr("data-value"),10) } ); // simple types should be wrapped in Object
        }
        return false; // stop events
			}
    });
    
    if (this.pageTo<o.totalPages-1) {
      item = this._buildItem('…','',true);
      this._on(item, {
        click: function ( event ) {
          this._setPagePage(+1);
          this._render();
          this._trigger( "goTo", event, { pageNum: ~~((this.pageFrom+this.pageTo)/2) } );
          return false;
        }
      });
      $list.append(item);
    }

    $list.append(this._buildItem('›',this._buildAttr(Math.min(o.currentPage+1,o.totalPages-1)),o.currentPage===o.totalPages-1));
    $list.append(this._buildItem('»',this._buildAttr(o.totalPages-1),o.currentPage===o.totalPages-1));    
  },
  
  _setPagePage: function ( pagepage ) {
    var o = this.options;
    var min = Math.min, max = Math.max;
    
    var halfShow = ~~((o.showPages-1)/2);

    if (pagepage === undefined) {
      this.pageFrom = max(o.currentPage-halfShow,0);
      this.pageTo = min(o.currentPage+halfShow,o.totalPages-1);
      var pageFromExt = this.pageFrom - (halfShow-(this.pageTo-o.currentPage));
      var pageToExt = this.pageTo + (halfShow-(o.currentPage-this.pageFrom));
      this.pageFrom = max(pageFromExt,0);
      this.pageTo = min(pageToExt,o.totalPages-1);
    } else {
      var sizeShow = (halfShow*2+1);
      this.pageFrom = max(this.pageFrom+pagepage*sizeShow,0);
      this.pageTo = min(this.pageTo+pagepage*sizeShow,o.totalPages-1);
      if ((this.pageTo-this.pageFrom+1)<sizeShow) {
        this.pageFrom = max(this.pageTo - (sizeShow-1),0);
        this.pageTo = min(this.pageFrom + (sizeShow-1),o.totalPages-1);
      }
    }    
    // start/end ellipsis fixes
    if (this.pageFrom == 1) {
      this.pageFrom = 0;
    }
    if (this.pageTo == o.totalPages-1-1) {
      this.pageTo = o.totalPages-1;
    }
  },
  
  _buildAttr: function ( index ) {
    return index.toString();
  },
  
  _buildItem: function( text, attr, disabled, active  ) {
    var item = $("<li></li>");
    var aspan;
    
    if (attr === '') {
      aspan = $("<span></span>");
    } else {
      aspan = $("<a></a>");
      aspan.attr("href", "#");
      aspan.attr("data-value", attr);
    }    
    aspan.text(text);
    if (disabled) {
      item.addClass("disabled");
    }
    if (active) {
      item.addClass("active");
    }
    item.append(aspan);
    return item;
  }
});

})( jQuery );


(function( $, undefined ) {

$.widget( "ua.dropdownwidget", {
  options: {
    value: undefined
  },

  _create: function() {
    this.li = this.element.next().children();
    this.aa = this.li.children();

    if ( this.options.value !== undefined )
      this._setOption( "value", this.options.value );

    this._on( this.aa, {
      click: function( event ) {
        var $a=$(event.target).closest('a'); // link can have markup
        this.options.value = $a.parent().attr("data-value");
        this._refreshValue($a.parent(),$a);
        this._trigger('change', event, this.options.value);
        event.preventDefault();
      }
    });
  },

  _destroy: function() {
  },

  value: function( newValue ) {
    if ( newValue === undefined ) {
      return this.options.value;
    }

    this._setOption( "value", newValue );
    return this;
  },

  _setOption: function( key, value ) {
    if ( key === "value" ) {
      var $li=this.element.next().find('li[data-value="'+value+'"]');
      if ($li.length<1)
        //throw "bootstrapdropdownlist: Unable to find value '"+value+"'";
        console.log("bootstrapdropdownlist: Unable to find value '"+value+"'");
      else if ($li.length>1)
        //throw "bootstrapdropdownlist: Multipletches for value '"+value+"'";
        console.log("bootstrapdropdownlist: Multipletches for value '"+value+"'");
      this.options.value = value;
      this._refreshValue($li,$li.children());
    }

    this._super( key, value );
  },

  _refreshValue: function( li, a ) {
    this.li.removeClass('active');
    li.addClass('active');
    this.element.html(a.html()).append(' <span class="caret"></span>');
  }
});

})( jQuery );
