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
    
    fluid.carousel.setup = function (carousel, prevControl, nextControl, carouselOptions, callback) {
        carousel.jcarousel(carouselOptions);
        
        prevControl.jcarouselControl({
            target: '-=1'
        });

        nextControl.jcarouselControl({
            target: '+=1'
        });        
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
            carousel: ".flc-carousel",
            prevControl: ".flc-carousel-prev",
            nextControl: ".flc-carousel-next"
       }, 
       markup: {
           nextHtml: '<div class="fl-icon-next fl-carousel-arrow" role="img" aria-label="Next arrow"></div>',
           prevHtml: '<div class="fl-icon-prev fl-carousel-arrow" role="img" aria-label="Previous arrow"></div>'     
       },
       panelsVisible: "4",
       invokers: {
            setup: {
                funcName: "fluid.carousel.setup",
                args: ["{that}.dom.carousel", "{that}.dom.prevControl", "{that}.dom.nextControl", { }, "{that}.events.onReady.fire"]
            }
       }
    });

})(jQuery, fluid_1_5);
