var width = 1500; 
var height = 500;


var redColors = [
    "#f2f2f2", // 0 slučajeva siva
    "#fdc9b4", // Broj zaraženih od 0-2000
    "#fc8a6b", // Broj zaraženih od 2001-8000
    "#ef4533", // Broj zaraženih od 8001-46000
    "#bb151a", // Broj zaraženih od 46001-120000
    "#67000d"  // Broj zaraženih više od 120000
];


var projection = d3.geoAlbersUsa()
    .scale(1000) 
    .translate([width / 2, height / 2]); 


var path = d3.geoPath()
    .projection(projection);


var svg = d3.select("#map-container").append("svg")
    .attr("width", width)
    .attr("height", height);

var totalDeaths;


d3.json("../data/states-historical.json").then(function(data) {
    console.log("Historical data loaded:", data);
    totalDeaths = new Map();
    data.states.forEach(d => {
        if (!totalDeaths.has(d.date)) {
            totalDeaths.set(d.date, []);
        }
        totalDeaths.get(d.date).push(d);
    });
}).catch(function(error) {
    console.error("Error loading historical data:", error);
});


d3.json("../data/states-topology.json").then(function(us) {
    svg.selectAll("path")
        .data(us.features)
        .enter().append("path")
        .attr("d", path)
        .style("fill", function(d) {
            var deaths = 0;
            var selectedDate = d3.select('#currentDate').attr("data-date");
            if (totalDeaths && totalDeaths.has(selectedDate)) {
                totalDeaths.get(selectedDate).forEach(stateData => {
                    if (stateData.state === d.properties.name) {
                        deaths = stateData.deaths;
                    }
                });
            }

            if (deaths > 20000) {
                return redColors[5];
            } else if (deaths > 15000) {
                return redColors[4];
            } else if (deaths > 5000) {
                return redColors[3];
            } else if (deaths > 400) {
                return redColors[2];
            } else if(deaths > 0) {
                return redColors[1];
            } else {
                return redColors[0];
            }
        })
        .on("mouseover", function(event, d) {
            var deaths = 0;
            var selectedDate = d3.select('#currentDate').attr("data-date");
            if (totalDeaths && totalDeaths.has(selectedDate)) {
                totalDeaths.get(selectedDate).forEach(stateData => {
                    if (stateData.state === d.properties.name) {
                        deaths = stateData.deaths;
                    }
                });
            }
            tooltip.style("opacity", 1)
                .html(`<strong>${d.properties.name}</strong><br><span class="deaths">Total Deaths: ${deaths}</span>`)
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            tooltip.style("opacity", 0);
        });
});

var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

var slider = d3.sliderBottom()
    .min(new Date(2020, 0, 1))
    .max(new Date(2020, 4, 29))
    .step(1000 * 60 * 60 * 24)
    .width(800)
    .tickFormat(d3.timeFormat('%Y-%m-%d'))
    .tickValues(d3.timeMonth.range(new Date(2020, 0, 1), new Date(2021, 0, 1), 1))
    .on('onchange', val => {
        var selectedDate = new Date(val);
        var displayDate = d3.timeFormat('%d. %B %Y')(selectedDate);
        var dataDate = d3.timeFormat('%Y-%m-%d')(selectedDate);
        d3.select('#currentDate').text(displayDate).attr("data-date", dataDate);
        updateMapColors(dataDate);
    });

var g = d3.select('#slider-container')
    .append('svg')
    .attr('width', width)
    .attr('height', 100)
    .append('g')
    .attr('transform', 'translate(30,30)');

g.call(slider);

function updateMapColors(selectedDate) {
    svg.selectAll("path")
        .style("fill", function(d) {
            var deaths = 0;
            if (totalDeaths && totalDeaths.has(selectedDate)) {
                totalDeaths.get(selectedDate).forEach(stateData => {
                    if (stateData.state === d.properties.name) {
                        deaths = stateData.deaths;
                    }
                });
            }

            if (deaths > 20000) {
                return redColors[5];
            } else if (deaths > 15000) {
                return redColors[4];
            } else if (deaths > 5000) {
                return redColors[3];
            } else if (deaths > 400) {
                return redColors[2];
            } else if(deaths > 0) {
                return redColors[1];
            } else {
                return redColors[0];
            }
        });
}


var isPlaying = false;
var timer;

function startAnimation() {
    if (isPlaying) return;
    isPlaying = true;
    timer = setInterval(function() {
        var currentValue = slider.value();
        var newValue = new Date(currentValue.getTime() + (1000 * 60 * 60 * 24));
        if (newValue > slider.max()) {
            clearInterval(timer);
            isPlaying = false;
        } else {
            slider.value(newValue);
        }
    }, 200); 
}

function pauseAnimation() {
    if (!isPlaying) return;
    clearInterval(timer);
    isPlaying = false;
}

document.getElementById('startAnimation').addEventListener('click', startAnimation);
document.getElementById('pauseAnimation').addEventListener('click', pauseAnimation);


var legendPadding = 20;
var legendXPosition = width - 250;

var legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(" + legendXPosition + "," + legendPadding + ")");

var legendTitle = legend.append("text")
    .attr("x", 0)
    .attr("y", -8)
    .text("Number of Total Deaths")
    .style("font-size", "18px")
    .style("font-weight", "bold");

var legendData = [
    { color: redColors[5], label: "more than 20,000" },
    { color: redColors[4], label: "15,000 to 20,000" },
    { color: redColors[3], label: "5,000 to 15,000" },
    { color: redColors[2], label: "400 to 5,000" },
    { color: redColors[1], label: "0 to 400" },
    { color: redColors[0], label: "0 deaths" }
];

legend.selectAll("rect")
    .data(legendData)
    .enter().append("rect")
    .attr("x", 0)
    .attr("y", function(d, i) { return i * 30; })
    .attr("width", 60)
    .attr("height", 30)
    .style("fill", function(d) { return d.color; });

legend.selectAll("text")
    .data(legendData)
    .enter().append("text")
    .attr("x", 70)
    .attr("y", function(d, i) { return i * 30 + 9; })
    .attr("dy", ".70em")
    .text(function(d) { return d.label; });

legend.append("text")
    .attr("x", 70)
    .attr("y", 0) 
    .attr("dy", "1.2em")
    .text("more than 20,000");