'use strict';

angular.module('d3', [])
    .factory('d3Service', ['$document', '$q', '$rootScope',
        function($document, $q, $rootScope) {
            var d = $q.defer();

            function onScriptLoad() {
                // Load client in the browser
                $rootScope.$apply(function() {
                    d.resolve(window.d3);
                });
            }
            // Create a script tag with d3 as the source
            // and call our onScriptLoad callback when it
            // has been loaded
            var scriptTag = $document[0].createElement('script');
            scriptTag.type = 'text/javascript';
            scriptTag.async = true;
            scriptTag.src = 'http://d3js.org/d3.v3.min.js';
            scriptTag.onreadystatechange = function() {
                if (this.readyState == 'complete') onScriptLoad();
            };
            scriptTag.onload = onScriptLoad;

            var s = $document[0].getElementsByTagName('body')[0];
            s.appendChild(scriptTag);

            return {
                d3: function() {
                    return d.promise;
                }
            };
        }
    ]);

// Declare app level module which depends on views, and components
var stockChart = angular.module('myApp', [
    'ngRoute',
    'ui.bootstrap',
    'd3'
]);

stockChart.controller("ChartController", function() {
    var d3 = window.d3;

    d3.tsv("stocks_yahoo.tsv", function(d) {
        d.date = getTimestamp(d.date);
        d.open = +d.open;
        d.high = +d.high;
        d.low = +d.low;
        d.close = +d.close;
        return d;
    }, function(error, data) {
        if (error) throw error;

        var margin = {
            top: 20,
            right:20,
            bottom: 40,
            left: 145
        };
        var width = 800 - margin.left - margin.right;
        var height = 400 - margin.top - margin.bottom;

        var x = d3.time.scale()
            .domain(d3.extent(data, function (d) {
                return d.date;
            }))
            .range([0, width]);

        var y = d3.scale.linear()
            .domain(d3.extent(data, function (d) {
                return d.open;
            }))
            .range([height, 0]);

        var chartOpen = d3.scale.linear()
            .domain(d3.extent(data, function (d) {
                return d.open;
            }))
            .range([height, 0]);

        var chartHigh = d3.scale.linear()
            .domain(d3.extent(data, function (d) {
                return d.high;
            }))
            .range([height, 0]);

        var chartLow = d3.scale.linear()
            .domain(d3.extent(data, function (d) {
                return d.low;
            }))
            .range([height, 0]);

        var chartClose = d3.scale.linear()
            .domain(d3.extent(data, function (d) {
                return d.close;
            }))
            .range([height, 0]);

        var lineO = d3.svg.line()
            .x(function (d) { return x(d.date); })
            .y(function (d) { return chartOpen(d.open); });

        var lineH = d3.svg.line()
            .x(function (d) { return x(d.date); })
            .y(function (d) { return chartHigh(d.high); });

        var lineL = d3.svg.line()
            .x(function (d) { return x(d.date); })
            .y(function (d) { return chartLow(d.low); });

        var lineC = d3.svg.line()
            .x(function (d) { return x(d.date); })
            .y(function (d) { return chartClose(d.close); });

        var zoom = d3.behavior.zoom()
            .x(x)
            .y(y)
            .on("zoom", zoomed);

        var svg = d3.select('#chart')
            .append("svg:svg")
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .call(zoom)
            .append("svg:g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var make_x_axis = function () {
            return d3.svg.axis()
                .scale(x)
                .orient("bottom")
                .ticks(5);
        };

        var make_y_axis = function () {
            return d3.svg.axis()
                .scale(y)
                .orient("left")
                .ticks(5);
        };

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .ticks(5);

        svg.append("svg:g")
            .attr("class", "x axis")
            .attr("transform", "translate(0, " + height + ")")
            .call(xAxis);

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .ticks(5);

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        svg.append("g")
            .attr("class", "x grid")
            .attr("transform", "translate(0," + height + ")")
            .call(make_x_axis()
                .tickSize(-height, 0, 0)
                .tickFormat(""));

        svg.append("g")
            .attr("class", "y grid")
            .call(make_y_axis()
                .tickSize(-width, 0, 0)
                .tickFormat(""));

        svg.append("text")
            .attr("x", -100)
            .attr("y", margin.top)
            .attr("class", "legend")
            .style("stroke", '#337ab7')
            .on("click", function(){
                var lineStyle = document.getElementById('line_open').style;
                lineStyle.display = lineStyle.display == 'none' ? 'inline' : 'none';
            })
            .text('Open');

        svg.append("text")
            .attr("x", -100)
            .attr("y", margin.top + 15)
            .attr("class", "legend")
            .style("stroke", '#5cb85c')
            .on("click", function(){
                var lineStyle = document.getElementById('line_high').style;
                lineStyle.display = lineStyle.display == 'none' ? 'inline' : 'none';
            })
            .text('High');

        svg.append("text")
            .attr("x", -100)
            .attr("y", margin.top + 30)
            .attr("class", "legend")
            .style("stroke", '#d9534f')
            .on("click", function(){
                var lineStyle = document.getElementById('line_low').style;
                lineStyle.display = lineStyle.display == 'none' ? 'inline' : 'none';
            })
            .text('Low');

        svg.append("text")
            .attr("x", -100)
            .attr("y", margin.top + 45)
            .attr("class", "legend")
            .style("stroke", '#f0ad4e')
            .on("click", function(){
                var lineStyle = document.getElementById('line_close').style;
                lineStyle.display = lineStyle.display == 'none' ? 'inline' : 'none';
            })
            .text('Close');

        var clip = svg.append("svg:clipPath")
            .attr("id", "clip")
            .append("svg:rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width)
            .attr("height", height);

        var chartBody = svg.append("g")
            .attr("clip-path", "url(#clip)");

        chartBody.append("svg:path")
            .datum(data)
            .attr("id", "line_open")
            .attr("d", lineO);

        chartBody.append("svg:path")
            .datum(data)
            .attr("id", "line_high")
            .attr("d", lineH);

        chartBody.append("svg:path")
            .datum(data)
            .attr("id", "line_low")
            .attr("d", lineL);

        chartBody.append("svg:path")
            .datum(data)
            .attr("id", "line_close")
            .attr("d", lineC);

        function zoomed() {
            //console.log(d3.event.translate);
            //console.log(d3.event.scale);
            svg.select(".x.axis").call(xAxis);
            svg.select(".y.axis").call(yAxis);
            svg.select(".x.grid")
                .call(make_x_axis()
                    .tickSize(-height, 0, 0)
                    .tickFormat(""));
            svg.select(".y.grid")
                .call(make_y_axis()
                    .tickSize(-width, 0, 0)
                    .tickFormat(""));
            svg.select("#line_open")
                .attr("id", "line_open")
                .attr("d", lineO);
            svg.select("#line_high")
                .attr("id", "line_high")
                .attr("d", lineH);
            svg.select("#line_low")
                .attr("id", "line_low")
                .attr("d", lineL);
            svg.select("#line_close")
                .attr("id", "line_close")
                .attr("d", lineC);
        }
    });

    function getTimestamp(myDate) {
        myDate=myDate.split("-");
        var newDate=myDate[1]+"/"+myDate[2]+"/"+myDate[0];
        return new Date(newDate).getTime();
    }
});