/*
 * Scrollbar - a jQuery plugin for custom scrollbars
 *
 * @author     Thomas Duerr, me@thomd.net
 * @date       03.2010
 * @requires   jquery v1.4.2 
 *
 *
 * Usage:
 * ======
 *
 *
 *
 *
 *
 *
 * CSS:
 * ====
 *
 *
 */
;(function($){

    $.fn.scrollbar = function(options){

        // Extend default options
        var options = $.extend({}, $.fn.scrollbar.defaults, options);

        
        //
        // append scrollbar to every found container and return jquery object for chainability
        //
        return this.each(function(i){

            var container = $(this), 
                props = {};
            
            // determine container height
            props.containerHeight = container.height();

            // determine inner content height
            props.contentHeight = 0;
            container.children().each(function(){
                props.contentHeight += $(this).outerHeight();
            });
            
            // do nothing and return if a scrollbar is not neccessary
            if(props.contentHeight <= props.containerHeight) return true;
            
            // create scrollbar
            var scrollbar = new $.fn.scrollbar.Scrollbar(container, props, options);
        });
    }



    //
    // default options
    //
    $.fn.scrollbar.defaults = {
        handleMinHeight: 30,         // min-height of handle (height is actually dependent on content height) 
        arrowScrollSpeed: 100,       // TODO
        arrowScrollDistance: 10      // TODO
    };



    //
    // Scrollbar class properties
    //
    $.fn.scrollbar.Scrollbar = function(container, props, options){
        this.container = container;
        this.props =     props;
        this.opts =      options;
        this.mouse =     {};
        
        // initialize
        this.buildHtml();
        this.setHandlePosition();
        this.appendEvents();
    };
    
    //
    // Scrollbar class methods
    //
    $.fn.scrollbar.Scrollbar.prototype = {
        
        //
        // build DOM nodes for pane and scroll-handle
        //
        //      <div class="scrollbar">
        //          <div class="scrollbar-pane">
        //              [...]
        //          </div>
        //          <div class="scrollbar-handle-container">
        //              <div class="scrollbar-handle"></div>
        //          </div>
        //          <div class="scrollbar-handle-up"></div>
        //          <div class="scrollbar-handle-down"></div>
        //      </div>
        //
        buildHtml: function(){
            this.container.children().wrapAll('<div class="scrollbar-pane" />');
            this.container.append('<div class="scrollbar-handle-container"><div class="scrollbar-handle" /></div>')
                .append('<div class="scrollbar-handle-up" />')
                .append('<div class="scrollbar-handle-down" />');

            this.container.handle = this.container.find('.scrollbar-handle');
            this.container.handleContainer = this.container.find('.scrollbar-handle-container');
            this.container.handleArrows = this.container.find('.scrollbar-handle-up, .scrollbar-handle-down');
        },
        
        //
        // append events on handle and handle-container
        //
        appendEvents: function(){
            
            // append hover event on scrollbar-handle
            this.container.handle.hover(this.hoverHandle);
            
            // append hover event on scrollbar-arrows
            this.container.handleArrows.bind('mouseenter mouseleave', this.hoverHandle);
            
            // append drag-drop event on scrollbar-handle
            this.container.handle.bind('mousedown.handle', $.proxy(this, 'moveHandleStart'));
            
            // append click event on scrollbar-handle-container
            this.container.handleContainer.bind('click.handle', $.proxy(this, 'clickHandleContainer'));
            
            // append click event on scrollbar-up- and down-handles
            this.container.handleArrows.bind('mousedown.handle', $.proxy(this, 'clickHandleArrows'));
        },

        //
        // calculate height of handle.
        // height of handle should indicate height of content.
        //
        setHandlePosition: function(){
            this.props.handleContainerHeight = this.container.handleContainer.height();
            this.props.handleHeight = Math.max(this.props.containerHeight * this.props.handleContainerHeight / this.props.contentHeight, this.opts.handleMinHeight);
            this.props.handleTop = {
                min: 0,
                max: this.props.handleContainerHeight - this.props.handleHeight
            };
            this.container.handle.height(this.props.handleHeight);
            this.container.handle.top = 0;
        },
        
        //
        // get mouse position
        //
        mousePosition: function(ev) {
			return ev.pageY || (ev.clientY + (document.documentElement.scrollTop || document.body.scrollTop)) || 0;
		},


        // ---------- event handler ---------------------------------------------------------------

        //
        // start moving of handle
        //
        moveHandleStart: function(ev){
            ev.preventDefault();
            this.container.handle.start = this.container.handle.start || this.container.handle.top;
            this.mouse.start = this.mousePosition(ev);
    		$(document).bind('mousemove.handle', $.proxy(this, 'moveHandle')).bind('mouseup.handle', $.proxy(this, 'moveHandleEnd'));
    		this.container.handleArrows.unbind('mouseenter mouseleave', this.hoverHandle);
            this.container.handle.addClass('move');
        },

        //
        // on moving of handle
        //
        moveHandle: function(ev){
            this.mouse.delta = this.mousePosition(ev) - this.mouse.start;
            this.container.handle.top = this.container.handle.start + this.mouse.delta;
            
            // stay within range [handleTop.min, handleTop.max]
            this.container.handle.top = (this.container.handle.top > this.props.handleTop.max) ? this.props.handleTop.max : this.container.handle.top;
            this.container.handle.top = (this.container.handle.top < this.props.handleTop.min) ? this.props.handleTop.min : this.container.handle.top;

            this.container.handle[0].style.top = this.container.handle.top + 'px';
        },

        //
        // end moving of handle
        //
        moveHandleEnd: function(ev){
            this.container.handle.start = this.container.handle.top;
    		$(document).unbind('mousemove.handle', this.moveHandle).unbind('mouseup.handle', this.moveHandleEnd);
            this.container.handle.removeClass('move');
            this.container.handleArrows.bind('mouseenter mouseleave', this.hoverHandle);
        },
        
        //
        // append click handler on handle-container (to click up and down the handle) 
        //
        clickHandleContainer: function(ev){
            ev.preventDefault();
            if(!$(ev.target).hasClass('scrollbar-handle-container')) return false;
            
            var direction = (this.container.handle.offset().top < this.mousePosition(ev)) ? 1 : -1;
            
            if(direction == 1){
                this.container.handle.top = this.container.handle.top + (this.props.handleTop.max - this.container.handle.top) * 0.5;
            } else {
                this.container.handle.top = this.container.handle.top - (this.container.handle.top - this.props.handleTop.min) * 0.5;
            }
            this.container.handle.start = this.container.handle.top;
            this.container.handle[0].style.top = this.container.handle.top + 'px';
        },

        //
        // append click handler on handle-arrows
        //
        clickHandleArrows: function(ev){
            ev.preventDefault();
            var direction = $(ev.target).hasClass('scrollbar-handle-up') ? -1 : 1;
            var self = this;
            var timer = setInterval(function(){
                if(direction == 1){
                    self.container.handle.top = Math.min(self.container.handle.top + self.opts.arrowScrollDistance, self.props.handleTop.max);
                } else {
                    self.container.handle.top = Math.max(self.container.handle.top - self.opts.arrowScrollDistance, self.props.handleTop.min);
                }
                self.container.handle.start = self.container.handle.top;
                self.container.handle[0].style.top = self.container.handle.top + 'px';
            }, this.opts.arrowScrollSpeed);
    		$(document).bind('mouseup.arrows', function(){clearInterval(timer);});
        },

        //
        // event handler for hovering the scrollbar-handle
        //
        hoverHandle: function(ev){
            $(this).toggleClass('hover');
        }
    };

})(jQuery);  // inject global jQuery object
