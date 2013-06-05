/*
Copyright 2013 OCAD University

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global fluid_1_5:true, jQuery*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, indent: 4 */

var fluid_1_5 = fluid_1_5 || {};

(function ($, fluid) {
    fluid.registerNamespace("fluid.carousel");
    
    fluid.carousel.setup = function (panels, carouselOptions, callback) {
        panels.jcarousel(carouselOptions);
        callback();
    }
    
    fluid.defaults("fluid.carousel", {
       gradeNames: ["fluid.viewComponent", "autoInit"],
       events: {
            onReady: null
       },
       listeners: {
            onCreate: "{that}.setup"
       },
       selectors: {
            panels: ".flc-carousel-panels"
       }, 
       markup: {
           nextHtml: "<div>>>></div>",
           prevHtml: "<div><<<</div>"     
       },
       panelsVisible: "4",
       invokers: {
            setup: {
                funcName: "fluid.carousel.setup",
                args: ["{that}.dom.panels", { visible:"{that}.options.panelsVisible", buttonNextHTML:"{that}.options.markup.nextHtml", buttonPrevHTML:"{that}.options.markup.prevHtml" }, "{that}.events.onReady.fire"]
            }
       }
    });

})(jQuery, fluid_1_5);
