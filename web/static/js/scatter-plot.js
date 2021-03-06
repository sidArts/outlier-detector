var drawScatterPlotFinal = (data) => {
    var margin = { top: 10, right: 300, bottom: 50, left: 150 },
        outerWidth = 1000,
        outerHeight = 500,
        width = outerWidth - margin.left - margin.right,
        height = outerHeight - margin.top - margin.bottom;

    var x = d3.scale.linear()
        .range([0, width]).nice();

    var y = d3.scale.linear()
        .range([height, 0]).nice();

    var xCat = 'x', yCat = 'y';

    var xMax = d3.max(data, function (d) { return d[xCat]; }) * 1.05,
        xMin = d3.min(data, function (d) { return d[xCat]; }),
        xMin = xMin > 0 ? 0 : xMin,
        yMax = d3.max(data, function (d) { return d[yCat]; }) * 1.05,
        yMin = d3.min(data, function (d) { return d[yCat]; }),
        yMin = yMin > 0 ? 0 : yMin;

    x.domain([xMin, xMax]);
    y.domain([yMin, yMax]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickSize(-height);

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .tickSize(-width);

    var color = d3.scale.category10();

    var tip = d3.tip()
        .attr("class", "d3-tip")
        .offset([-10, 0])
        .html(function (d) {
            return Object.keys(d).reduce((a, c) => a + `${c}: ${d[c]}<br>`, '');
        });

    var zoomBeh = d3.behavior.zoom()
        .x(x)
        .y(y)
        .scaleExtent([0, 500])
        .on("zoom", zoom);

    var svg = d3.select("#scatter-plot")
        .append("svg")
        .attr("width", outerWidth)
        .attr("height", outerHeight)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(zoomBeh);

    svg.call(tip);

    svg.append("rect")
        .attr("width", width)
        .attr("height", height);

    svg.append("g")
        .classed("x axis", true)
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .append("text")
        .classed("label", true)
        .attr("x", width)
        .attr("y", margin.bottom - 10)
        .style("text-anchor", "end")
        .text(xCat);

    svg.append("g")
        .classed("y axis", true)
        .call(yAxis)
        .append("text")
        .classed("label", true)
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(yCat);

    var objects = svg.append("svg")
        .classed("objects", true)
        .attr("width", width)
        .attr("height", height);

    objects.append("svg:line")
        .classed("axisLine hAxisLine", true)
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", width)
        .attr("y2", 0)
        .attr("transform", "translate(0," + height + ")");

    objects.append("svg:line")
        .classed("axisLine vAxisLine", true)
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", height);

    objects.selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .classed("dot", true)
        // .attr("r", function (d) { return 6 * Math.sqrt(d[rCat] / Math.PI); })
        .attr("r", 5)
        .attr("transform", transform)
        .style("fill", (d) => d['isOutlier'] ? 'red' : 'grey')
        .on("mouseover", tip.show)
        .on("mouseout", tip.hide);

    // var legend = svg.selectAll(".legend")
    //     .data(color.domain())
    //     .enter().append("g")
    //     .classed("legend", true)
    //     .attr("transform", function (d, i) { return "translate(0," + i * 20 + ")"; });

    // legend.append("circle")
    //     .attr("r", 3.5)
    //     .attr("cx", width + 20)
    //     .attr("fill", color);

    // legend.append("text")
    //     .attr("x", width + 26)
    //     .attr("dy", ".35em")
    //     .text(function (d) { return d; });

    d3.select("input").on("click", change);

    function change() {
        xMax = d3.max(data, function (d) { return d[xCat]; });
        xMin = d3.min(data, function (d) { return d[xCat]; });

        zoomBeh.x(x.domain([xMin, xMax])).y(y.domain([yMin, yMax]));

        var svg = d3.select("#scatter-plot").transition();

        svg.select(".x.axis").duration(750).call(xAxis).select(".label").text(xCat);

        objects.selectAll(".dot").transition().duration(1000).attr("transform", transform);
    }

    function zoom() {
        svg.select(".x.axis").call(xAxis);
        svg.select(".y.axis").call(yAxis);

        svg.selectAll(".dot")
            .attr("transform", transform);
    }

    function transform(d) {
        return "translate(" + x(d[xCat]) + "," + y(d[yCat]) + ")";
    }

    return {
        resetZoom: () => {
            // zoomBeh.transform(svg, d3.zoomIdentity);
            // svg.call(zoomBeh.transform, d3.zoomIdentity);
            svg.transition()
            .duration(750)
            .call(zoomBeh.translate([0, 0]).scale(1).event);
    }
};
};