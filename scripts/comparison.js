var margin = { top: 20, bottom: 120, left: 70, right: 20 };
var width = 800 - margin.left - margin.right;
var height = 500 - margin.top - margin.bottom;
var barPadding = 4;


const svg = d3.select("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

let deathCounts = [];

d3.json("../data/comparison.json").then(data => {
    console.log("Successfully loaded data:", data);

    
    const filteredData = data.filter(d => d["Age group"] === "All Ages");
    console.log("Filtered data:", filteredData);

  
    const diseases = ["COVID-19 Deaths", "Pneumonia Deaths", "Influenza Deaths"];
    deathCounts = diseases.map(disease => {
        return {
            disease: disease,
            count: d3.sum(filteredData, d => d[disease])
        };
    });

    console.log("Number of deaths:", deathCounts);

    
    drawChart(deathCounts);

    d3.select("#sortOption").on("change", function() {
        const selectedOption = d3.select(this).property("value");
        updateChart(selectedOption);
    });

}).catch(error => {
    console.error("Error loading data:", error);
});


function drawChart(data) {
    
    const x = d3.scaleBand()
        .domain(data.map(d => d.disease))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.count)])
        .nice()
        .range([height, 0]);

   
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    
    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("class", "axis-label")
        .attr("y", -50)
        .attr("x", -height / 2)
        .attr("dy", "-2.5em")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .text("Broj Smrtnih Slučajeva");

    
    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.disease))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.count));
}


function updateChart(order) {
    let sortedData = deathCounts.slice(); 

    if (order === "ascending") {
        sortedData.sort((a, b) => a.count - b.count);
    } else if (order === "descending") {
        sortedData.sort((a, b) => b.count - a.count);
    }


    const x = d3.scaleBand()
        .domain(sortedData.map(d => d.disease))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(sortedData, d => d.count)])
        .nice()
        .range([height, 0]);

  
    svg.select(".x-axis")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    
    svg.selectAll(".bar")
        .data(sortedData)
        .transition()
        .duration(1000)
        .attr("x", d => x(d.disease))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.count));
}