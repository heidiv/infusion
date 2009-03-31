/*
Copyright 2008-2009 University of Toronto
Copyright 2008-2009 University of Cambridge

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://source.fluidproject.org/svn/LICENSE.txt
*/

/*global jQuery*/
/*global fluid_1_0*/

fluid_1_0 = fluid_1_0 || {};

(function ($, fluid) {

    /******************
     * Pager Bar View *
     ******************/

    
    function updateStyles(pageListThat, newModel, oldModel) {
    	  if (!pageListThat.pageLinks) {
    	      return;
    	  }
        if (oldModel.pageIndex !== undefined) {
            var oldLink = pageListThat.pageLinks.eq(oldModel.pageIndex);
            oldLink.removeClass(pageListThat.options.styles.currentPage);
        }
        var pageLink = pageListThat.pageLinks.eq(newModel.pageIndex);
        pageLink.addClass(pageListThat.options.styles.currentPage); 


    }
    
    function bindLinkClick(link, events, eventArg) {
       link.unbind("click.fluid.pager");
       link.bind("click.fluid.pager", function() {events.initiatePageChange.fire(eventArg);});
    }
    
    // 10 -> 1, 11 -> 2
    function computePageCount(model) {
        model.pageCount = Math.max(1, Math.floor((model.totalRange - 1)/ model.pageSize) + 1);
    }
    
    function computePageLimit(model) {
        return Math.min(model.totalRange, (model.pageIndex + 1)*model.pageSize);
    }

    fluid.pager = function() {
        return fluid.pagerImpl.apply(null, arguments);
    };
    
    fluid.pager.directPageList = function (container, events, options) {
        var that = fluid.initView("fluid.pager.directPageList", container, options);
        that.pageLinks = that.locate("pageLinks");
        for (var i = 0; i < that.pageLinks.length; ++ i) {
            var pageLink = that.pageLinks.eq(i);
            bindLinkClick(pageLink, events, {pageIndex: i});
        }
        events.onModelChange.addListener(
            function (newModel, oldModel) {
                updateStyles(that, newModel, oldModel);
            }
        );
        that.defaultModel = {
            pageIndex: undefined,
            pageSize: 1,
            totalRange: that.pageLinks.length
        };
        return that;
    };
    
    /** Returns an array of size count, filled with increasing integers, 
     *  starting at 0 or at the index specified by first. 
     */
    
    fluid.iota = function (count, first) {
        first = first | 0;
        var togo = [];
        for (var i = 0; i < count; ++ i) {
            togo[togo.length] = first++;
            }
        return togo;
        };
    
    fluid.pager.everyPageStrategy = fluid.iota;
    
    fluid.pager.gappedPageStrategy = function(locality, midLocality) {
        if (!locality) {
            locality = 3;
        }
        if (!midLocality) {
            midLocality = locality;
        }
        return function(count, first, mid) {
            var togo = [];
            var j = 0;
            var lastSkip = false;
            for (var i = 0; i < count; ++ i) {
                if (i < locality || (count - i - 1) < locality || (i >= mid - midLocality && i <= mid + midLocality)) {
                    togo[j++] = i;
                    lastSkip = false;
                }
                else if (!lastSkip){
                    togo[j++] = -1;
                    lastSkip = true;
                }
            }
            return togo;
        };
    };
    
    fluid.pager.renderedPageList = function(container, events, pagerBarOptions, options, strings) {
        options = $.extend(true, pagerBarOptions, options);
        var that = fluid.initView("fluid.pager.renderedPageList", container, options);
        options = that.options; // pick up any defaults
        var renderOptions = {
            cutpoints: [ {
              id: "page-link:link",
              selector: pagerBarOptions.selectors.pageLinks
            },
            {
              id: "page-link:skip",
              selector: pagerBarOptions.selectors.pageLinkSkip
            },
            {
              id: "page-link:disabled",
              selector: pagerBarOptions.selectors.pageLinkDisabled
            }
            ]};
        
        if (options.linkBody) {
            renderOptions.cutpoints[renderOptions.cutpoints.length] = {
                id: "payload-component",
                selector: options.linkBody
            };
          }
        function pageToComponent(current) {
          return function(page) {
            return page === -1? {
              ID: "page-link:skip"
            } : 
              {
              ID: page === current? "page-link:link": "page-link:link",
              value: page + 1,
              pageIndex: page,
              decorators: [
                {type: "jQuery",
                 func: "click", 
                 args: function() {events.initiatePageChange.fire({pageIndex: page});}},
                {type: page === current? "addClass" : "",
                 classes: that.options.styles.currentPage} 
                 ]
            };
          };
        }
        var root = that.locate("root");
        fluid.expectFilledSelector(root, "Error finding root template for fluid.pager.renderedPageList");
        
        var template = fluid.selfRender(root, {}, renderOptions);
        events.onModelChange.addListener(
            function (newModel, oldModel) {
                var pages = that.options.pageStrategy(newModel.pageCount, 0, newModel.pageIndex);
                var pageTree = fluid.transform(pages, pageToComponent(newModel.pageIndex));
                pageTree[pageTree.length - 1].value = pageTree[pageTree.length - 1].value + strings.last;
                events.onRenderPageLinks.fire(pageTree);
                fluid.reRender(template, root, pageTree, renderOptions);
                updateStyles(that, newModel, oldModel);
            }
        );
        return that;
    };
    
    fluid.defaults("fluid.pager.renderedPageList",
        {
          selectors: {
            root: ".flc-pager-links"
          },
          linkBody: "a",
          pageStrategy: fluid.pager.everyPageStrategy
        }
        );
    
    var updatePreviousNext = function (that, options, newModel) {
        if (newModel.pageIndex === 0) {
            that.previous.addClass(options.styles.disabled);
        } else {
            that.previous.removeClass(options.styles.disabled);
        }
        
        if (newModel.pageIndex === newModel.pageCount - 1) {
            that.next.addClass(options.styles.disabled);
        } else {
            that.next.removeClass(options.styles.disabled);
        }
    };
    
    fluid.pager.previousNext = function (container, events, options) {
        var that = fluid.initView("fluid.pager.previousNext", container, options);
        that.previous = that.locate("previous");
        bindLinkClick(that.previous, events, {relativePage: -1});
        that.next = that.locate("next");
        bindLinkClick(that.next, events, {relativePage: +1});
        events.onModelChange.addListener(
            function (newModel, oldModel, overallThat) {
                updatePreviousNext(that, options, newModel);
            }
        );
        return that;
    };

    fluid.pager.pagerBar = function (events, container, options, strings) {
        var that = fluid.initView("fluid.pager.pagerBar", container, options);
        that.pageList = fluid.initSubcomponent(that, "pageList", 
           [container, events, that.options, fluid.COMPONENT_OPTIONS, strings]);
        that.previousNext = fluid.initSubcomponent(that, "previousNext", 
           [container, events, that.options, fluid.COMPONENT_OPTIONS, strings]);
        
        return that;
    };

    
    fluid.defaults("fluid.pager.pagerBar", {
            
       previousNext: {
           type: "fluid.pager.previousNext"
       },
      
       pageList: {
           type: "fluid.pager.directPageList"
       },
        
       selectors: {
           pageLinks: ".flc-pager-pageLink",
           pageLinkSkip: ".flc-pager-pageLink-skip",
           pageLinkDisabled: ".page-link-disabled",
           previous: ".previous",
           next: ".next"
       },
       
       styles: {
           currentPage: "fl-pager-currentPage",
           disabled: "disabled"
       }
    });

    function getColumnDefs(that) {
        return that.options.columnDefs;
    }

    fluid.pager.findColumnDef = function(columnDefs, key) {
        var columnDef = $.grep(columnDefs, function(def) {
              return def.key === key;
            })[0];
        return columnDef;
    };
    
    function getRoots(target, overallThat, index) {
        var cellRoot = (overallThat.options.dataOffset? overallThat.options.dataOffset + ".": "");
        target.shortRoot = index;
        target.longRoot = cellRoot + target.shortRoot;
    }
    
    fluid.pager.fetchValue = function(that, dataModel, index, valuebinding, roots) {
        getRoots(roots, that, index);

        var path = expandPath(valuebinding, roots.shortRoot, roots.longRoot);
        return fluid.model.getBeanValue(dataModel, path);
    };
    

    fluid.pager.basicSorter = function (overallThat, model) {
          var dataModel = overallThat.options.dataModel;
          var roots = {};
          var columnDefs = getColumnDefs(overallThat);
          var columnDef = fluid.pager.findColumnDef(columnDefs, model.sortKey);
          var sortrecs = [];
          for (var i = 0; i < model.totalRange; ++ i) {
              sortrecs[i] = {
                  index: i,
                  value: fluid.pager.fetchValue(overallThat, dataModel, i, columnDef.valuebinding, roots)
              };
          }
          var columnType = typeof sortrecs[0].value;
          function sortfunc(arec, brec) {
              var a = arec.value;
              var b = brec.value;
              return a === b? 0 : (a > b? model.sortDir : -model.sortDir); 
          }
        sortrecs.sort(sortfunc);
        return fluid.transform(sortrecs, function (row) {return row.index;});
    };

    
    fluid.pager.directModelFilter = function (model, pagerModel, perm) {
        var togo = [];
        var limit = computePageLimit(pagerModel);
        for (var i = pagerModel.pageIndex * pagerModel.pageSize; i < limit; ++ i) {
        	  var index = perm? perm[i]: i;
            togo[togo.length] = {index: index, row: model[index]};
        }
        return togo;
    };
   
  
    function expandPath(EL, shortRoot, longRoot) {
        if (EL.charAt(0) === "*") {
            return longRoot + EL.substring(1); 
        }
        else {
            return EL.replace("*", shortRoot);
        }
    }
    
    function expandVariables(value, opts) {
        var togo = "";
        var index = 0;
        while (true) {
            var nextindex = value.indexOf("${", index);
            if (nextindex === -1) {
                togo += value.substring(index);
                break;
            }
            else {
                togo += value.substring(index, nextindex);
                var endi = value.indexOf("}", nextindex + 2);
                var EL = value.substring(nextindex + 2, endi);
                if (EL === "VALUE") {
                    EL = opts.EL;
                }
                else {
                    EL = expandPath(EL, opts.shortRoot, opts.longRoot);
                }

                var val = fluid.model.getBeanValue(opts.dataModel, EL);
                togo += val;
                index = endi + 1;
            }
        }
        return togo;
    }
   
    function expandPaths(target, tree, opts) {
        for (i in tree) {
            var val = tree[i];
            if (val === fluid.VALUE) {
                if (i === "valuebinding") {
                    target[i] = opts.EL;
                }
                else {
                    target[i] = {"valuebinding" : opts.EL};
                }
            }
            else if (i === "valuebinding") {
                target[i] = expandPath(tree[i], opts);
            }
            else if (typeof(val) === 'object') {
                 target[i] = val.length !== undefined? [] : {};
                 expandPaths(target[i], val, opts);
            }
            else if (typeof(val) === 'string') {
                target[i] = expandVariables(val, opts);
            }
            else {target[i] = tree[i];}
        }
        return target;
    }
   
   // sets opts.EL, returns ID
    function IDforColumn(columnDef, opts) {
        var options = opts.options;
        var EL = columnDef.valuebinding;
        var key = columnDef.key;
        if (!EL) {
            fluid.fail("Error in definition for column with key " + key + ": valuebinding is not set");
        }
        opts.EL = expandPath(EL, opts.shortRoot, opts.longRoot);
        if (!key) {
            var segs = fluid.model.parseEL(EL);
            key = segs[segs.length - 1];
        }
        var ID = (options.keyPrefix? options.keyPrefix : "") + key;
        return ID;
    }
   
    function expandColumnDefs(filteredRow, opts) {
        var tree = fluid.transform(opts.columnDefs, function(columnDef){
            var ID = IDforColumn(columnDef, opts);
            var togo;
            if (!columnDef.components) {
              return {
                  ID: ID,
                  valuebinding: opts.EL
              };
            }
            else if (typeof columnDef.components === 'function'){
                togo = columnDef.components(filteredRow.row, filteredRow.index);
            }
            else {
                togo = columnDef.components;
            }
            togo = expandPaths({}, togo, opts);
            togo.ID = ID;
            return togo;
        });
        return tree;
    }
   
    function fetchModel(overallThat) {
        return fluid.model.getBeanValue(overallThat.options.dataModel, 
            overallThat.options.dataOffset);
    }
   
    
    function bigHeaderForKey(key, opts) {
        var id = opts.options.renderOptions.idMap["header:" + key];
        var smallHeader = fluid.jById(id);
        if (smallHeader.length === 0) {return null;}
        var headerSortStylisticOffset = opts.overallOptions.selectors.headerSortStylisticOffset;
        var bigHeader = fluid.findAncestor(smallHeader, function(element) {
            return $(element).is(headerSortStylisticOffset);});
        return bigHeader;
    }
   
    function setSortHeaderClass(styles, element, sort) {
          element = $(element);
        element.removeClass(styles.ascendingHeader);
        element.removeClass(styles.descendingHeader);
        if (sort !== 0) {
            element.addClass(sort === 1? styles.ascendingHeader : styles.descendingHeader);
        }
    }
   
     function fireModelChange(that, newModel) {
         computePageCount(newModel);
         if (newModel.pageIndex >= newModel.pageCount) {
             newModel.pageIndex = newModel.pageCount - 1;
         }
         if (newModel.pageIndex !== that.model.pageIndex || newModel.pageSize !== that.model.pageSize || newModel.sortKey !== that.model.sortKey ||
                newModel.sortDir !== that.model.sortDir) {
         	   var sorted = newModel.sortKey? that.options.sorter(that, newModel) : null;
             that.permutation = sorted;
             that.events.onModelChange.fire(newModel, that.model, that);
             fluid.model.copyModel(that.model, newModel);
         }            
    }
 
    function generateColumnClick(overallThat, columnDef, opts) {
        return function () {
            var model = overallThat.model;
            var newModel = fluid.copy(model);
            var styles = overallThat.options.styles;
            var oldKey = model.sortKey;
            if (columnDef.key !== model.sortKey) {
                newModel.sortKey = columnDef.key;
                newModel.sortDir = 1;
                var oldBig = bigHeaderForKey(oldKey, opts);
                if (oldBig) {
                    setSortHeaderClass(styles, oldBig, 0);
                }
            }
            else if (newModel.sortKey === columnDef.key) {
                newModel.sortDir = -1 * newModel.sortDir;
            }
            else {return false;}
            fireModelChange(overallThat, newModel);
            setSortHeaderClass(styles, bigHeaderForKey(newModel.sortKey, opts), newModel.sortDir);
            return false;
        };
    }
   
    function generateHeader(overallThat, newModel, columnDefs, opts) {
        return {
            children:  
                fluid.transform(columnDefs, function(columnDef) {
                return {
                     ID: IDforColumn(columnDef, opts),
                     value: columnDef.label,
                     decorators: [
                         {"jQuery": ["click", generateColumnClick(overallThat, columnDef, opts)]},
                         {identify: "header:" + columnDef.key}]
                     };
                }
        )};
    }
   
    /** A body renderer implementation which uses the Fluid renderer to render a table section **/
   
    fluid.pager.selfRender = function (overallThat, inOptions) {
        var that = fluid.initView("fluid.pager.selfRender", overallThat.container, inOptions);
        var options = that.options;
        options.renderOptions.idMap = options.renderOptions.idMap || {};
        var idMap = options.renderOptions.idMap;
		var root = that.locate("root");
        var template = fluid.selfRender(root, {}, options.renderOptions);
        root.addClass("fl-pager");
        var columnDefs = getColumnDefs(overallThat);
        var expOpts = {options: options, columnDefs: columnDefs, overallOptions: overallThat.options, dataModel: overallThat.options.dataModel, idMap: idMap};
        var directModel = fetchModel(overallThat);

        return {
            returnedOptions: {
                listeners: {
                    onModelChange: function (newModel, oldModel) {
                        var filtered = overallThat.options.modelFilter(directModel, newModel, overallThat.permutation);
                        var tree = fluid.transform(filtered, 
                            function(filteredRow) {
                                var roots = getRoots(expOpts, overallThat, filteredRow.index);
                                if (columnDefs === "explode") {
                                    return fluid.explode(filteredRow.row, root);
                                }
                                else if (columnDefs.length) {
                                    return expandColumnDefs(filteredRow, expOpts);
                                }
                            }
                            );
                        var fullTree = {};
                        fullTree[options.row] = tree;
                        if (typeof(columnDefs) === "object") {
                            fullTree[options.header] = generateHeader(overallThat, newModel, columnDefs, expOpts);
                        }
                        options.renderOptions = options.renderOptions || {};
                        options.renderOptions.model = expOpts.dataModel;
                        fluid.reRender(template, root, fullTree, options.renderOptions);
                    }
                }
            }
        };
    };

    fluid.defaults("fluid.pager.selfRender", {
		selectors: {
			root: ".body-template"
		},
        keyStrategy: "id",
        keyPrefix: "",
        row: "row:",
        header: "header:",
        // Options passed upstream to the renderer
        renderOptions: {}
      });


    fluid.pager.summary = function (dom, options) {
        var node = dom.locate("summary");
        return {
            returnedOptions: {
                listeners: {
                    onModelChange: function (newModel, oldModel) {
                        var text = fluid.stringTemplate(options.message, {
                          first: newModel.pageIndex * newModel.pageSize + 1,
                          last: computePageLimit(newModel),
                          total: newModel.totalRange});
                        if (node.length > 0) {
                            node.text(text);
                        }
                    }
                }
            }
        };
    };
    
    fluid.pager.directPageSize = function (that) {
        var node = that.locate("pageSize");
        if (node.length > 0) {
            that.events.onModelChange.addListener(
                function(newModel, oldModel) {
                    if (node.val() !== newModel.pageSize) {
                        node.val(newModel.pageSize);
                    }
                }
            );
            node.change(function() {
                that.events.initiatePageSizeChange.fire(node.val());
                });
        }
        return that;
    };


    fluid.pager.rangeAnnotator = function (that, options) {
        var roots = {};
        that.events.onRenderPageLinks.addListener( function (tree) {
            var column = that.options.annotateColumnRange;
            var dataModel = that.options.dataModel;
            // TODO: reaching into another component's options like this is a bit unfortunate
            var columnDefs = getColumnDefs(that);

            if (!column || !dataModel || !columnDefs) {
                return;
            }
            var columnDef = fluid.pager.findColumnDef(columnDefs, column);
            
            function fetchValue(index) {
            	  var index = that.permutation? that.permutation[index] : index;
                return fluid.pager.fetchValue(that, dataModel, index, columnDef.valuebinding, roots);
            }
            var tModel = {};
            fluid.model.copyModel(tModel, that.model);
            
            fluid.transform(tree, function (cell) {
                if (cell.ID === "page-link:link") {
                    var page = cell.pageIndex;
                    var start = page * that.model.pageSize;
                    tModel.pageIndex = page;
                    var limit = computePageLimit(tModel);
                    var iValue = fetchValue(start);
                    var lValue = fetchValue(limit - 1);
                    
                    var text = "<b>" + iValue + "</b><br/>&mdash;<br/><b>" + lValue + "</b>";
                    
                    var decorator = {
                        type: "jQuery",
                        func: "tooltip",
                        args: {
                            delay: that.options.tooltipDelay,
                            extraClass: that.options.styles.tooltip,
                            bodyHandler: function () { 
                                return text; 
                            },
                            showURL: false,
                            id: that.options.tooltipId
                            }
                        };
                    cell.decorators.push(decorator);
                    }
              
            });
    });};

    /*******************
     * Pager Component *
     *******************/
    
    fluid.pagerImpl = function (container, options) {
        var that = fluid.initView("fluid.pager", container, options);
        
        var pageIndexConformer = function(model, dar) {
            if (dar.value < 0) {
                dar.value = 0;
            }
        }
        
        that.events.initiatePageChange.addListener(
            function(arg) {
               var newModel = fluid.copy(that.model);
               if (arg.relativePage !== undefined) {
                   newModel.pageIndex = that.model.pageIndex + arg.relativePage;
               }
               else {
                   newModel.pageIndex = arg.pageIndex;
               }
               if (newModel.pageIndex === undefined || newModel.pageIndex < 0) {
                   newModel.pageIndex = 0;
               }
               fireModelChange(that, newModel);
            }
        );
        
        that.events.initiatePageSizeChange.addListener(
            function(arg) {
                var newModel = fluid.copy(that.model);
                newModel.pageSize = arg;
                fireModelChange(that, newModel);     
            }
            );

        // Setup the top and bottom pager bars.
        var pagerBarElement = that.locate("pagerBar");
        if (pagerBarElement.length > 0) {
            that.pagerBar = fluid.initSubcomponent(that, "pagerBar", 
            [that.events, pagerBarElement, fluid.COMPONENT_OPTIONS, that.options.strings]);
        }
        
        var pagerBarSecondaryElement = that.locate("pagerBarSecondary");
        if (pagerBarSecondaryElement.length > 0) {
            that.pagerBarSecondary = fluid.initSubcomponent(that, "pagerBar",
               [that.events, pagerBarSecondaryElement, fluid.COMPONENT_OPTIONS, that.options.strings]);
        }
 
        that.bodyRenderer = fluid.initSubcomponent(that, "bodyRenderer", [that, fluid.COMPONENT_OPTIONS]);
        
        that.summary = fluid.initSubcomponent(that, "summary", [that.dom, fluid.COMPONENT_OPTIONS]);
        
        that.pageSize = fluid.initSubcomponent(that, "pageSize", [that]);
        
        that.rangeAnnotator = fluid.initSubcomponent(that, "rangeAnnotator", [that, fluid.COMPONENT_OPTIONS]);
 
        that.model = fluid.copy(that.options.model);
        
        var dataModel = fetchModel(that);
        if (dataModel) {
            that.model.totalRange = dataModel.length;
        }
        if (that.model.totalRange === undefined) {
            if (!that.pagerBar) {
                fluid.fail("Error in Pager configuration - cannot determine total range, " +
                " since not configured in model.totalRange and no PagerBar is configured");
            }
            that.model = that.pagerBar.pageList.defaultModel;
        }
        that.applier = fluid.makeDARApplier(that.model);

        that.events.initiatePageChange.fire({pageIndex: 0});

        return that;
    };
    
    fluid.defaults("fluid.pager", {
        pagerBar: {type: "fluid.pager.pagerBar", 
            options: null},
        
        summary: {type: "fluid.pager.summary", options: {
            message: "%first-%last of %total items"
        }},
        
        pageSize: {
            type: "fluid.pager.directPageSize"
        },
        
        modelFilter: fluid.pager.directModelFilter,
        
        sorter: fluid.pager.basicSorter,
        
        bodyRenderer: {
            type: "fluid.emptySubcomponent"
        },
        
        model: {
            pageIndex: undefined,
            pageSize: 10,
            totalRange: undefined
        },
        
        dataModel: undefined,
        // Offset of the tree's "main" data from the overall dataModel root
        dataOffset: "",
        
        // strategy for generating a tree row, either "explode" or an array of columnDef objects
        columnDefs: "explode",
        
        annotateColumnRange: undefined,
        
        tooltipDelay: 300,
        
        tooltipId: "tooltip",
        
        rangeAnnotator: {
            type: "fluid.pager.rangeAnnotator"
        },
        
        selectors: {
            pagerBar: ".flc-pager-top",
            pagerBarSecondary: ".flc-pager-bottom",
            summary: ".flc-pager-summary",
            pageSize: ".flc-pager-page-size",
            headerSortStylisticOffset: "th"
        },
        
        styles: {
            tooltip: "fl-pager-tooltip",
            ascendingHeader: "fl-pager-asc",
            descendingHeader: "fl-pager-desc"
        },
        
        strings: {
            last: " (last)"
        },
        
        events: {
            initiatePageChange: null,
            initiatePageSizeChange: null,
            onModelChange: null,
            onRenderPageLinks: null
        }
    });
})(jQuery, fluid_1_0);
