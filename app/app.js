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

var data_source_path = 'data_source/';

stockChart.controller("ChartController", function($scope) {
    var d3 = window.d3;

    $scope.parseTsv = function(fileName) {
        d3.tsv(data_source_path + fileName, function(d) {
            d.date = getTimestamp(d.date);
            d.open = +d.open;
            d.high = +d.high;
            d.low = +d.low;
            d.close = +d.close;
            return d;
        }, function(error, data) {
            if (error) throw error;

            buildChart(data);

        });
    };

    function buildChart(data) {
        var width = 1000;
        var height = 400;
        String.prototype.format = function() {
            var formatted = this;
            for (var i = 0; i < arguments.length; i++) {
                var regexp = new RegExp('\\{'+i+'\\}', 'gi');
                formatted = formatted.replace(regexp, arguments[i]);
            }
            return formatted;
        };

        function min(a, b){ return a < b ? a : b ; }

        function max(a, b){ return a > b ? a : b; }

        function drawChart(data){

            var margin = 50;

            var svg = d3.select("#chart")
                .html("")
                .append("svg:svg")
                .attr("class", "chart")
                .attr("width", width)
                .attr("height", height);

            var y = d3.scale.linear()
                .domain([d3.min(data.map(function(x) {return x["low"];})), d3.max(data.map(function(x){return x["high"];}))])
                .range([height-margin, margin]);
            var x = d3.scale.linear()
                .domain([d3.min(data.map(function(d){return d.date;})), d3.max(data.map(function(d){ return d.date;}))])
                .range([margin,width-margin]);

            var tip = d3.tip()
                .attr('class', 'd3-tip')
                .offset([-10, 0])
                .html(function(d) {
                    return '<p>Open: ' + d.open + '<br/>' +
                        'High: ' + d.high + '<br/>' +
                        'Low: ' + d.low + '<br/>' +
                        'Close: ' + d.close + '</p>';
                });

            svg.call(tip);

            svg.selectAll("line.x")
                .data(x.ticks(12))
                .enter().append("svg:line")
                .attr("class", "x")
                .attr("x1", x)
                .attr("x2", x)
                .attr("y1", margin)
                .attr("y2", height - margin)
                .attr("stroke", "#ccc");

            svg.selectAll("line.y")
                .data(y.ticks(10))
                .enter().append("svg:line")
                .attr("class", "y")
                .attr("x1", margin)
                .attr("x2", width - margin)
                .attr("y1", y)
                .attr("y2", y)
                .attr("stroke", "#ccc");

            svg.selectAll("text.xrule")
                .data(x.ticks(12))
                .enter().append("svg:text")
                .attr("class", "xrule")
                .attr("x", x)
                .attr("y", height - margin)
                .attr("dy", 20)
                .attr("text-anchor", "middle")
                .text(function(d){
                    var date = new Date(d);
                    return ( "0"+(date.getMonth()+1)).slice(-2) + "/" + date.getFullYear();
                });

            svg.selectAll("text.yrule")
                .data(y.ticks(10))
                .enter().append("svg:text")
                .attr("class", "yrule")
                .attr("x", width - margin)
                .attr("y", y)
                .attr("dy", 0)
                .attr("dx", 20)
                .attr("text-anchor", "middle")
                .text(String);

            svg.selectAll("rect")
                .data(data)
                .enter().append("svg:rect")
                .attr("x", function(d) { return x(d.date); })
                .attr("y", function(d) {return y(max(d.open, d.close));})
                .attr("height", function(d) { return y(min(d.open, d.close))-y(max(d.open, d.close));})
                .attr("width", function(d) { return 0.5 * (width - 2*margin)/data.length; })
                .attr("fill",function(d) { return d.open > d.close ? "red" : "green" ;})
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide);

            svg.selectAll("line.stem")
                .data(data)
                .enter().append("svg:line")
                .attr("class", "stem")
                .attr("x1", function(d) { return x(d.date) + 0.25 * (width - 2 * margin)/ data.length;})
                .attr("x2", function(d) { return x(d.date) + 0.25 * (width - 2 * margin)/ data.length;})
                .attr("y1", function(d) { return y(d.high);})
                .attr("y2", function(d) { return y(d.low); })
                .attr("stroke", function(d){ return d.open > d.close ? "red" : "green"; })
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide);

        }

        drawChart(data);
    }

    function getTimestamp(myDate) {
        myDate=myDate.split("-");
        var newDate=myDate[1]+"/"+myDate[2]+"/"+myDate[0];
        return new Date(newDate).getTime();
    }

    $scope.parseTsv("stocks_yahoo-2015-I.tsv");
});